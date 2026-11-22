-- Tremplin FLE — migration 002
-- Accès payant appliqué partout, codes d’activation, plan structuré, date d’examen,
-- suppression du compte, journal des paiements, temps réel.
-- À exécuter après 001_init.sql.

-- ───────────────────────── Objectif et plan ─────────────────────────
alter table public.profils add column if not exists date_examen date;
grant update (date_examen) on public.profils to authenticated;

alter table public.plans add column if not exists contenu jsonb;

-- Garde-fous sur les résultats
alter table public.tentatives
  add constraint tentatives_score_bornes check (max > 0 and score >= 0 and score <= max),
  add constraint tentatives_note_prof_bornes check (note_prof is null or note_prof between 0 and 20);

-- ───────────────────────── Accès valide ─────────────────────────
create or replace function public.acces_valide(uid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select p.abonnement <> 'expire' and p.abonnement_fin > now() from profils p where p.id = uid), false);
$$;

-- Le lien n’opère que si les deux accès sont valides (règle « les deux paient »).
create or replace function public.est_lie(prof uuid, eleve uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from liens where professeur_id = prof and eleve_id = eleve and statut = 'actif')
     and acces_valide(prof) and acces_valide(eleve);
$$;

-- Sans accès valide, l’élève consulte les contenus mais n’enregistre plus de résultats.
drop policy if exists tentatives_ajout on public.tentatives;
create policy tentatives_ajout on public.tentatives for insert
  with check (eleve_id = auth.uid() and public.acces_valide(auth.uid()));

-- Inviter : accès valide requis, adresse contrôlée, doublons mieux détectés.
create or replace function public.inviter(email_cible text)
returns public.liens language plpgsql security definer set search_path = public as $$
declare moi profils; cible profils; l liens; e text := lower(trim(email_cible));
begin
  select * into moi from profils where id = auth.uid();
  if moi.id is null then raise exception 'Non connecté'; end if;
  if not abonnement_valide(moi) then raise exception 'Votre accès doit être actif pour inviter quelqu’un.'; end if;
  if e !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then raise exception 'Adresse électronique invalide.'; end if;
  if e = moi.email then raise exception 'Vous ne pouvez pas vous inviter vous-même.'; end if;
  if (select count(*) from liens where initiateur_id = moi.id and statut = 'en_attente') >= 50 then
    raise exception 'Trop d’invitations en attente : annulez-en avant d’en envoyer de nouvelles.';
  end if;
  select * into cible from profils where email = e;
  if cible.id is not null and cible.role = moi.role then
    raise exception 'Cette adresse correspond à un compte du même rôle que le vôtre.';
  end if;
  if exists (select 1 from liens
              where statut <> 'refuse' and (professeur_id = moi.id or eleve_id = moi.id)
                and (email_invite = e or (cible.id is not null and (professeur_id = cible.id or eleve_id = cible.id)))) then
    raise exception 'Une invitation existe déjà pour cette adresse.';
  end if;
  insert into liens (professeur_id, eleve_id, email_invite, initiateur_id)
  values (case when moi.role = 'professeur' then moi.id else cible.id end,
          case when moi.role = 'eleve' then moi.id else cible.id end,
          e, moi.id)
  returning * into l;
  return l;
end $$;

-- Le professeur supprime un devoir qu’il a donné (politique déjà présente) ; note bornée.
create or replace function public.commenter_tentative(tentative_id uuid, commentaire text, note numeric)
returns void language plpgsql security definer set search_path = public as $$
begin
  if note is not null and (note < 0 or note > 20) then raise exception 'La note doit être comprise entre 0 et 20.'; end if;
  update tentatives set commentaire_prof = nullif(trim(commentaire), ''), note_prof = note
   where id = tentative_id and est_lie(auth.uid(), eleve_id);
  if not found then raise exception 'Action non autorisée.'; end if;
end $$;

-- ───────────────────────── Codes d’activation ─────────────────────────
-- Un code prolonge l’accès de N jours. Il se vend par n’importe quel canal
-- (virement, portefeuille mobile, plateforme de vente, livre…) et s’utilise une seule fois.
create table if not exists public.codes_activation (
  code text primary key check (code = upper(code)),
  jours integer not null check (jours between 1 and 3660),
  role text check (role in ('eleve', 'professeur')),   -- null : tout type de compte
  lot text,                                            -- étiquette libre : « pilote-nov », « livre-kindle »…
  cree_le timestamptz not null default now(),
  expire_le timestamptz,                               -- date limite d’utilisation du code
  utilise_par uuid references public.profils on delete set null,
  utilise_le timestamptz
);
alter table public.codes_activation enable row level security;
revoke all on public.codes_activation from anon, authenticated;

-- Prolonge l’accès à partir de la fin actuelle (ou d’aujourd’hui si l’accès a expiré).
create or replace function public.prolonger_acces(uid uuid, nb_jours integer)
returns public.profils language plpgsql security definer set search_path = public as $$
declare p profils;
begin
  if nb_jours is null or nb_jours < 1 then raise exception 'Durée invalide.'; end if;
  update profils
     set abonnement_fin = greatest(case when abonnement <> 'expire' then abonnement_fin else now() end, now())
                          + make_interval(days => nb_jours),
         abonnement = 'actif'
   where id = uid
  returning * into p;
  if p.id is null then raise exception 'Compte introuvable.'; end if;
  return p;
end $$;
revoke execute on function public.prolonger_acces(uuid, integer) from public, anon, authenticated;

create or replace function public.utiliser_code(code_saisi text)
returns public.profils language plpgsql security definer set search_path = public as $$
declare c codes_activation; moi profils;
        propre text := regexp_replace(upper(coalesce(code_saisi, '')), '[^A-Z0-9]', '', 'g');
begin
  select * into moi from profils where id = auth.uid();
  if moi.id is null then raise exception 'Non connecté'; end if;
  select * into c from codes_activation where replace(code, '-', '') = propre for update;
  if c.code is null or c.utilise_le is not null or (c.expire_le is not null and c.expire_le < now()) then
    raise exception 'Code invalide ou déjà utilisé.';
  end if;
  if c.role is not null and c.role <> moi.role then
    raise exception 'Ce code est réservé aux comptes %.', case c.role when 'eleve' then 'élève' else 'professeur' end;
  end if;
  update codes_activation set utilise_par = moi.id, utilise_le = now() where code = c.code;
  return prolonger_acces(moi.id, c.jours);
end $$;

-- Génère des codes (à lancer depuis l’éditeur SQL de Supabase) :
--   select * from generer_codes(20, 30, 'pilote-novembre');           -- 20 codes d’un mois
--   select * from generer_codes(5, 365, 'professeurs', 'professeur'); -- réservés aux professeurs
create or replace function public.generer_codes(
  nombre integer, nb_jours integer, nom_lot text default null, pour_role text default null, valable_jours integer default null)
returns setof text language plpgsql security definer set search_path = public as $$
declare alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';  -- sans I, O, 0, 1 : pas de confusion à la saisie
        c text; i integer; faits integer := 0;
begin
  if nombre is null or nombre < 1 or nombre > 1000 then raise exception 'Nombre de codes : entre 1 et 1000.'; end if;
  while faits < nombre loop
    c := 'TR-';
    for i in 1..10 loop
      c := c || substr(alphabet, 1 + (get_byte(uuid_send(gen_random_uuid()), 0) % 32), 1);
      if i = 5 then c := c || '-'; end if;
    end loop;
    begin
      insert into codes_activation (code, jours, lot, role, expire_le)
      values (c, nb_jours, nom_lot, pour_role,
              case when valable_jours is null then null else now() + make_interval(days => valable_jours) end);
      faits := faits + 1;
      return next c;
    exception when unique_violation then null;  -- collision improbable : on retire un autre code
    end;
  end loop;
end $$;
revoke execute on function public.generer_codes(integer, integer, text, text, integer) from public, anon, authenticated;

-- ───────────────────────── Journal des paiements ─────────────────────────
-- À remplir par une fonction serveur de paiement (webhook du prestataire choisi), avec la clé service :
-- elle appelle fixer_acces(). Voir docs/PUESTA-EN-LINEA.md, étape E.
create table if not exists public.paiements (
  id bigint generated always as identity primary key,
  fournisseur text not null,
  evenement text not null,
  reference text,
  user_id uuid references public.profils on delete set null,
  email text,
  acces_jusqu_a timestamptz,
  brut jsonb,
  recu_le timestamptz not null default now()
);
alter table public.paiements enable row level security;
revoke all on public.paiements from anon, authenticated;

-- Fixe la fin d’accès annoncée par le prestataire. N’abrège jamais un accès déjà acquis (code d’activation).
create or replace function public.fixer_acces(uid uuid, jusqu_a timestamptz)
returns public.profils language plpgsql security definer set search_path = public as $$
declare p profils;
begin
  update profils set abonnement = 'actif', abonnement_fin = greatest(abonnement_fin, jusqu_a)
   where id = uid and jusqu_a > now()
  returning * into p;
  return p;
end $$;
revoke execute on function public.fixer_acces(uuid, timestamptz) from public, anon, authenticated;

-- ───────────────────────── Suppression du compte ─────────────────────────
-- Efface le compte et, en cascade, toutes ses données (résultats, devoirs, messages, liens, plan).
create or replace function public.supprimer_mon_compte()
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Non connecté'; end if;
  delete from auth.users where id = auth.uid();
end $$;

-- ───────────────────────── Temps réel ─────────────────────────
-- Les écrans se mettent à jour quand l’autre personne agit (résultat, devoir, message, lien).
do $$
declare t text;
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach t in array array['tentatives', 'devoirs', 'messages', 'liens', 'plans', 'profils'] loop
      if not exists (select 1 from pg_publication_tables
                      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t) then
        execute format('alter publication supabase_realtime add table public.%I', t);
      end if;
    end loop;
  end if;
end $$;
