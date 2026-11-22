\set ON_ERROR_STOP 1
\pset tuples_only on
-- Accès payant, codes d’activation, suspension du lien, suppression du compte (migration 002).
-- Suite de rls.sql : les fonctions t_ok et t_refus existent déjà.

reset role;
insert into auth.users (id, email, raw_user_meta_data) values
 ('10000000-0000-0000-0000-00000000000e', 'ana@test.fr', '{"role":"eleve","nom":"Ana"}'),
 ('10000000-0000-0000-0000-0000000000a1', 'marc@test.fr', '{"role":"professeur","nom":"Marc"}');
-- Codes créés par l’administrateur
select count(*) as codes_generes from generer_codes(3, 30, 'test') \gset
select t_ok(:codes_generes = 3, 'l’administrateur génère des codes d’activation');
select t_ok((select bool_and(code ~ '^TR-[A-HJ-NP-Z2-9]{5}-[A-HJ-NP-Z2-9]{5}$') from codes_activation), 'format des codes : TR-XXXXX-XXXXX, sans caractères ambigus');
insert into codes_activation (code, jours, role) values ('TR-PROFS-22222', 365, 'professeur');
insert into codes_activation (code, jours, expire_le) values ('TR-VIEUX-33333', 30, now() - interval '1 day');
select code as code1 from codes_activation where lot = 'test' order by code limit 1 \gset
select code as code2 from codes_activation where lot = 'test' order by code offset 1 limit 1 \gset
grant select on codes_activation to postgres;

-- ─── Lien entre Ana et Marc ───
set role authenticated; select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-00000000000e',false);
select inviter('marc@test.fr');
select t_refus($$select inviter('MARC@test.fr')$$, 'inviter deux fois la même personne (majuscules ignorées)');
select t_refus($$select inviter('pas-une-adresse')$$, 'inviter une adresse invalide');
update profils set date_examen = '2027-03-15', niveau_vise = 'B2', examen_vise = 'delf' where id = auth.uid();
select t_ok((select date_examen from profils where id = auth.uid()) = '2027-03-15', 'l’élève enregistre sa date d’examen');
insert into tentatives (activite_id, titre, niveau, competence, score, max) values ('x','X','B1','CE',3,5);
select t_refus($$insert into tentatives (activite_id, titre, niveau, competence, score, max) values ('x','X','B1','CE',9,5)$$, 'enregistrer un score supérieur au maximum');
insert into plans (texte, contenu) values ('Plan', '{"diagnostic":"d","priorites":[],"etapes":[],"indicateurs":[],"source":"local"}');
select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-0000000000a1',false);
select repondre_lien((select id from liens where eleve_id = '10000000-0000-0000-0000-00000000000e'), true);
select t_ok((select count(*) from tentatives) = 1, 'lien actif : le professeur voit les résultats');
select t_ok((select contenu->>'source' from plans) = 'local', 'le professeur lit le plan structuré de l’élève');
select t_ok((select date_examen from profils where email = 'ana@test.fr') = '2027-03-15', 'le professeur voit l’objectif et la date d’examen de l’élève');
select t_refus($$select commenter_tentative((select id from tentatives limit 1), 'Trop', 25)$$, 'mettre une note supérieure à 20');

-- ─── Fonctions réservées à l’administrateur ───
select t_refus($$select generer_codes(1, 30)$$, 'un utilisateur génère lui-même des codes');
select t_refus($$select prolonger_acces(auth.uid(), 3650)$$, 'un utilisateur prolonge lui-même son accès');
select t_refus($$select fixer_acces(auth.uid(), now() + interval '10 years')$$, 'un utilisateur fixe lui-même sa date de fin');
select t_refus($$select * from codes_activation$$, 'un utilisateur lit la liste des codes');
select t_refus($$select * from paiements$$, 'un utilisateur lit le journal des paiements');

-- ─── L’accès du professeur expire : le lien est suspendu ───
reset role; update profils set abonnement_fin = now() - interval '1 hour' where email = 'marc@test.fr';
set role authenticated; select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-0000000000a1',false);
select t_ok((select count(*) from tentatives) = 0, 'accès du professeur expiré : il ne voit plus les résultats');
select t_refus($$insert into devoirs (eleve_id, professeur_id, activite_id) values ('10000000-0000-0000-0000-00000000000e', auth.uid(), 'x')$$, 'professeur expiré : assigner un devoir');
select t_refus($$insert into messages (a_id, texte) values ('10000000-0000-0000-0000-00000000000e','coucou')$$, 'professeur expiré : écrire à l’élève');
select t_ok((select count(*) from liens) = 1, 'le lien reste visible (suspendu, pas supprimé)');

-- ─── Le professeur utilise un code : le lien reprend ───
select t_refus($$select utiliser_code('TR-VIEUX-33333')$$, 'utiliser un code périmé');
select t_refus($$select utiliser_code('TR-AAAAA-AAAAA')$$, 'utiliser un code inexistant');
select utiliser_code(lower(replace(:'code1', '-', ' ')));
select t_ok((select abonnement = 'actif' and abonnement_fin between now() + interval '29 days' and now() + interval '31 days' from profils where id = auth.uid()),
  'code accepté (saisie en minuscules, sans tirets) : 30 jours à partir d’aujourd’hui');
select t_refus(format($$select utiliser_code(%L)$$, :'code1'), 'réutiliser un code déjà utilisé');
select t_ok((select count(*) from tentatives) = 1, 'accès rétabli : le professeur revoit les résultats');
select utiliser_code('TR-PROFS-22222');
select t_ok((select abonnement_fin between now() + interval '394 days' and now() + interval '396 days' from profils where id = auth.uid()),
  'deuxième code : la durée s’ajoute à la fin de l’accès en cours');

-- ─── L’accès de l’élève expire ───
reset role; update profils set abonnement = 'expire' where email = 'ana@test.fr';
set role authenticated; select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-00000000000e',false);
select t_refus($$insert into tentatives (activite_id, titre, niveau, competence, score, max) values ('y','Y','B1','CE',1,5)$$, 'élève expiré : enregistrer un résultat');
select t_ok((select count(*) from tentatives) = 1, 'élève expiré : il relit toujours ses propres résultats');
select t_refus($$select utiliser_code('TR-PROFS-22222')$$, 'réutiliser le code d’un autre');
select utiliser_code(:'code2');
insert into tentatives (activite_id, titre, niveau, competence, score, max) values ('y','Y','B1','CE',1,5);
select t_ok((select count(*) from tentatives) = 2, 'après le code, l’élève enregistre de nouveau');

-- ─── Paiement en ligne (clé service) : n’abrège jamais un accès acquis ───
reset role;
select fixer_acces('10000000-0000-0000-0000-00000000000e', now() + interval '5 days');
select t_ok((select abonnement_fin > now() + interval '29 days' from profils where email = 'ana@test.fr'), 'le prestataire de paiement n’abrège pas un accès plus long déjà acquis');
select fixer_acces('10000000-0000-0000-0000-00000000000e', now() + interval '90 days');
select t_ok((select abonnement_fin > now() + interval '89 days' from profils where email = 'ana@test.fr'), 'le prestataire de paiement prolonge l’accès');

-- ─── Temps réel ───
select t_ok((select count(*) from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public') = 6, 'les 6 tables sont publiées pour le temps réel');

-- ─── Suppression du compte ───
set role authenticated; select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-00000000000e',false);
select supprimer_mon_compte();
reset role;
select t_ok(not exists (select 1 from profils where email = 'ana@test.fr')
        and not exists (select 1 from tentatives where eleve_id = '10000000-0000-0000-0000-00000000000e')
        and not exists (select 1 from liens where eleve_id = '10000000-0000-0000-0000-00000000000e')
        and not exists (select 1 from plans where eleve_id = '10000000-0000-0000-0000-00000000000e'),
  'suppression du compte : profil, résultats, liens et plan effacés');
select t_ok((select utilise_par is null and utilise_le is not null from codes_activation where code = :'code2'), 'le code utilisé reste marqué comme utilisé après la suppression du compte');
\echo 'Accès et codes : tous les tests sont passés.'
