\set ON_ERROR_STOP 1
\pset tuples_only on
-- Utilitaires (créés par l'administrateur, exécutés avec les droits de l'appelant)
create function public.t_ok(cond boolean, msg text) returns void language plpgsql as $$
begin if cond then raise notice '✓ %', msg; else raise exception '✗ ÉCHEC : %', msg; end if; end $$;
create function public.t_refus(req text, msg text) returns void language plpgsql as $$
begin
  begin execute req; exception when others then raise notice '✓ % (refusé : %)', msg, left(sqlerrm, 70); return; end;
  raise exception '✗ ÉCHEC : % — la requête aurait dû être refusée', msg;
end $$;
grant execute on function public.t_ok, public.t_refus to authenticated;

insert into auth.users (id, email, raw_user_meta_data) values
 ('00000000-0000-0000-0000-00000000000e', 'eleve@test.fr', '{"role":"eleve","nom":"Lucía"}'),
 ('00000000-0000-0000-0000-00000000000f', 'autre.eleve@test.fr', '{"role":"eleve","nom":"Félix"}'),
 ('00000000-0000-0000-0000-0000000000a1', 'prof@test.fr', '{"role":"professeur","nom":"Edwin"}'),
 ('00000000-0000-0000-0000-0000000000a2', 'intrus@test.fr', '{"role":"professeur","nom":"Intrus"}');
select t_ok((select count(*) from profils) = 4, 'profils créés automatiquement à l’inscription, avec le bon rôle')
  where (select role from profils where email='prof@test.fr') = 'professeur';

-- ─── Élève : invite son professeur ───
set role authenticated; select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000e',false);
select t_ok((select statut from inviter('prof@test.fr')) = 'en_attente', 'l’élève invite son professeur par courriel');
select t_refus($$select inviter('autre.eleve@test.fr')$$, 'inviter un compte du même rôle');
select t_refus($$select repondre_lien((select id from liens limit 1), true)$$, 'l’élève accepte sa propre invitation');
insert into tentatives (activite_id, titre, niveau, competence, score, max) values ('b1-ce-teletravail','Télétravail','B1','CE',4,5);
select t_refus($$update profils set abonnement='actif', abonnement_fin=now()+interval '10 years' where id=auth.uid()$$, 'l’élève se donne un abonnement gratuit');
select t_refus($$update tentatives set commentaire_prof='Parfait', note_prof=20$$, 'l’élève écrit lui-même la note du professeur');
select t_refus($$insert into usage_ia values (auth.uid(), '2026-11', 0)$$, 'l’élève remet son quota d’IA à zéro');
select t_refus($$insert into messages (a_id, texte) values ('00000000-0000-0000-0000-0000000000a1','bonjour')$$, 'message avant que le lien soit accepté');

-- ─── Professeur : voit l'invitation mais pas encore les données ───
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-0000000000a1',false);
select t_ok((select count(*) from liens) = 1, 'le professeur voit l’invitation reçue');
select t_ok((select nom from profils where email='eleve@test.fr') = 'Lucía', 'le professeur voit le nom de l’élève qui l’invite');
select t_ok((select count(*) from tentatives) = 0, 'résultats invisibles tant que le lien n’est pas accepté');
select repondre_lien((select id from liens limit 1), true);
select t_ok((select count(*) from tentatives) = 1, 'après acceptation, le professeur voit les résultats de l’élève');
insert into devoirs (eleve_id, professeur_id, activite_id, consigne) values ('00000000-0000-0000-0000-00000000000e', auth.uid(), 'b2-ls-subjonctif', 'Révise le subjonctif');
select commenter_tentative((select id from tentatives limit 1), 'Bon travail', 16);
insert into messages (a_id, texte) values ('00000000-0000-0000-0000-00000000000e', 'Bravo !');
select t_ok(true, 'le professeur assigne un devoir, commente, note et écrit à l’élève');
select t_ok((select count(*) from profils) = 2, 'le professeur ne voit que les profils liés (pas les autres élèves)');

-- ─── Professeur intrus : ne voit rien ───
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-0000000000a2',false);
select t_ok((select count(*) from tentatives) + (select count(*) from liens) + (select count(*) from messages) + (select count(*) from devoirs) = 0, 'un professeur non lié ne voit ni résultats, ni liens, ni messages, ni devoirs');
select t_refus($$insert into devoirs (eleve_id, professeur_id, activite_id) values ('00000000-0000-0000-0000-00000000000e', auth.uid(), 'x')$$, 'un professeur non lié assigne un devoir');
select t_refus($$select commenter_tentative((select id from tentatives limit 1), 'hack', 0)$$, 'un professeur non lié note l’élève');
select t_refus($$insert into messages (a_id, texte) values ('00000000-0000-0000-0000-00000000000e','spam')$$, 'un professeur non lié écrit à l’élève');

-- ─── Élève : retour du professeur ───
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000e',false);
select t_ok((select commentaire_prof from tentatives limit 1) = 'Bon travail', 'l’élève lit le commentaire de son professeur');
insert into tentatives (activite_id, titre, niveau, competence, score, max, devoir_id) values ('b2-ls-subjonctif','Subjonctif','B2','LS',5,6,(select id from devoirs limit 1));
select t_ok((select statut from devoirs limit 1) = 'fait', 'faire l’activité rend automatiquement le devoir');
update messages set lu = true where a_id = auth.uid();
select t_refus($$update messages set texte='modifié' where a_id = auth.uid()$$, 'modifier le texte d’un message reçu');
insert into plans (texte) values ('Plan sur deux semaines');
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-0000000000a1',false);
select t_ok((select count(*) from plans) = 1, 'le professeur lit le plan d’amélioration de l’élève');

-- ─── Abonnement expiré : le lien ne peut pas être accepté ───
reset role; update profils set abonnement='expire' where email='autre.eleve@test.fr';
set role authenticated; select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-00000000000f',false);
select inviter('prof@test.fr');
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-0000000000a1',false);
select t_refus($$select repondre_lien((select id from liens where email_invite='prof@test.fr' and eleve_id='00000000-0000-0000-0000-00000000000f'), true)$$, 'accepter un élève dont l’abonnement a expiré');

-- ─── Invitation envoyée avant l'inscription ───
select inviter('nouvelle@test.fr');
reset role; insert into auth.users (id, email, raw_user_meta_data) values ('00000000-0000-0000-0000-0000000000b1','Nouvelle@Test.fr','{"role":"eleve"}');
set role authenticated; select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-0000000000b1',false);
select t_ok((select count(*) from liens where eleve_id = auth.uid()) = 1, 'l’invitation est rattachée au compte créé ensuite (majuscules ignorées)');
select repondre_lien((select id from liens where eleve_id = auth.uid()), true);
select t_ok((select statut from liens where eleve_id = auth.uid()) = 'actif', 'la nouvelle élève accepte');

-- ─── Visiteur non connecté ───
reset role; set role anon; select set_config('request.jwt.claim.sub','',false);
select t_refus($$select count(*) from tentatives$$, 'un visiteur non connecté lit des résultats');
select t_refus($$select count(*) from profils$$, 'un visiteur non connecté lit des profils');
\echo 'Tous les tests de sécurité sont passés.'
