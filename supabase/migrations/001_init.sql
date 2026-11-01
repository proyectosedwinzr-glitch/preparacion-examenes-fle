-- Tremplin FLE — schéma initial (Supabase / Postgres)
-- Règle centrale : un professeur ne voit que les données des élèves liés à son compte
-- par un lien ACTIF ; un lien ne devient actif que si les deux abonnements sont valides.

create extension if not exists pgcrypto;

-- ───────────────────────── Profils ─────────────────────────
create table public.profils (
  id uuid primary key references auth.users on delete cascade,
  email text not null unique,
  nom text not null default '',
  role text not null check (role in ('eleve', 'professeur')),
  langue_ia text not null default 'fr' check (langue_ia in ('fr', 'es', 'en', 'pt')),
  niveau_vise text check (niveau_vise in ('A1','A2','B1','B2','C1','C2')),
  examen_vise text,
  abonnement text not null default 'essai' check (abonnement in ('essai', 'actif', 'expire')),
  abonnement_fin timestamptz not null default now() + interval '14 days',
  cree_le timestamptz not null default now()
);

create or replace function public.abonnement_valide(p public.profils)
returns boolean language sql stable as $$
  select p.abonnement <> 'expire' and p.abonnement_fin > now();
$$;

-- ───────────────────────── Liens ─────────────────────────
create table public.liens (
  id uuid primary key default gen_random_uuid(),
  professeur_id uuid references public.profils on delete cascade,
  eleve_id uuid references public.profils on delete cascade,
  email_invite text not null,
  initiateur_id uuid not null references public.profils on delete cascade,
  statut text not null default 'en_attente' check (statut in ('en_attente', 'actif', 'refuse')),
  cree_le timestamptz not null default now()
);
create index on public.liens (professeur_id);
create index on public.liens (eleve_id);
create index on public.liens (email_invite);

create or replace function public.est_lie(prof uuid, eleve uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from liens where professeur_id = prof and eleve_id = eleve and statut = 'actif');
$$;

-- Adresse de l’utilisateur courant (security definer : évite la récursion entre politiques)
create or replace function public.mon_email()
returns text language sql stable security definer set search_path = public as $$
  select email from profils where id = auth.uid();
$$;

-- Création du profil à l’inscription (rôle et nom passés dans les métadonnées du lien magique)
create or replace function public.nouveau_compte()
returns trigger language plpgsql security definer set search_path = public as $$
declare r text := coalesce(new.raw_user_meta_data->>'role', 'eleve');
begin
  insert into profils (id, email, nom, role)
  values (new.id, lower(new.email), coalesce(new.raw_user_meta_data->>'nom', ''), r);
  -- Rattache les invitations reçues avant l’inscription
  update liens set professeur_id = new.id
    where email_invite = lower(new.email) and professeur_id is null and r = 'professeur';
  update liens set eleve_id = new.id
    where email_invite = lower(new.email) and eleve_id is null and r = 'eleve';
  return new;
end $$;
create trigger apres_inscription after insert on auth.users
  for each row execute function public.nouveau_compte();

-- Inviter par courriel (dans les deux sens)
create or replace function public.inviter(email_cible text)
returns public.liens language plpgsql security definer set search_path = public as $$
declare moi profils; cible profils; l liens; e text := lower(trim(email_cible));
begin
  select * into moi from profils where id = auth.uid();
  if moi.id is null then raise exception 'Non connecté'; end if;
  if e = moi.email then raise exception 'Vous ne pouvez pas vous inviter vous-même.'; end if;
  select * into cible from profils where email = e;
  if cible.id is not null and cible.role = moi.role then
    raise exception 'Cette adresse correspond à un compte du même rôle que le vôtre.';
  end if;
  if exists (select 1 from liens where email_invite = e and statut <> 'refuse'
             and (professeur_id = moi.id or eleve_id = moi.id)) then
    raise exception 'Une invitation existe déjà pour cette adresse.';
  end if;
  insert into liens (professeur_id, eleve_id, email_invite, initiateur_id)
  values (case when moi.role = 'professeur' then moi.id else cible.id end,
          case when moi.role = 'eleve' then moi.id else cible.id end,
          e, moi.id)
  returning * into l;
  return l;
end $$;

-- Répondre : seule la personne invitée répond ; les deux abonnements doivent être valides
create or replace function public.repondre_lien(lien_id uuid, accepter boolean)
returns void language plpgsql security definer set search_path = public as $$
declare l liens; moi profils; autre profils;
begin
  select * into l from liens where id = lien_id;
  select * into moi from profils where id = auth.uid();
  if l.id is null or l.initiateur_id = moi.id
     or not (l.professeur_id = moi.id or l.eleve_id = moi.id) then
    raise exception 'Action non autorisée.';
  end if;
  if accepter then
    select * into autre from profils where id = l.initiateur_id;
    if not abonnement_valide(moi) then raise exception 'Votre abonnement doit être actif pour accepter le lien.'; end if;
    if not abonnement_valide(autre) then raise exception 'L’abonnement de la personne qui vous invite n’est pas actif.'; end if;
  end if;
  update liens set statut = case when accepter then 'actif' else 'refuse' end where id = lien_id;
end $$;

-- ───────────────────────── Activité de l’élève ─────────────────────────
create table public.devoirs (
  id uuid primary key default gen_random_uuid(),
  professeur_id uuid not null references public.profils on delete cascade,
  eleve_id uuid not null references public.profils on delete cascade,
  activite_id text not null,
  consigne text,
  echeance date,
  statut text not null default 'a_faire' check (statut in ('a_faire', 'fait')),
  cree_le timestamptz not null default now()
);

create table public.tentatives (
  id uuid primary key default gen_random_uuid(),
  eleve_id uuid not null references public.profils on delete cascade default auth.uid(),
  activite_id text not null,
  titre text not null,
  niveau text not null,
  competence text not null,
  examens text[] not null default '{}',
  score numeric not null,
  max numeric not null,
  reponses jsonb,
  production text,
  correction jsonb,
  commentaire_prof text,
  note_prof numeric,
  devoir_id uuid references public.devoirs on delete set null,
  faite_le timestamptz not null default now()
);
create index on public.tentatives (eleve_id, faite_le desc);

create or replace function public.devoir_fait()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.devoir_id is not null then
    update devoirs set statut = 'fait' where id = new.devoir_id and eleve_id = new.eleve_id;
  end if;
  return new;
end $$;
create trigger apres_tentative after insert on public.tentatives
  for each row execute function public.devoir_fait();

create or replace function public.commenter_tentative(tentative_id uuid, commentaire text, note numeric)
returns void language plpgsql security definer set search_path = public as $$
begin
  update tentatives set commentaire_prof = commentaire, note_prof = note
   where id = tentative_id and est_lie(auth.uid(), eleve_id);
  if not found then raise exception 'Action non autorisée.'; end if;
end $$;

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  de_id uuid not null references public.profils on delete cascade default auth.uid(),
  a_id uuid not null references public.profils on delete cascade,
  texte text not null check (length(texte) between 1 and 4000),
  envoye_le timestamptz not null default now(),
  lu boolean not null default false
);
create index on public.messages (de_id, a_id, envoye_le);

create table public.plans (
  eleve_id uuid primary key references public.profils on delete cascade default auth.uid(),
  texte text not null,
  cree_le timestamptz not null default now()
);

-- Consommation d’IA par mois, pour plafonner le coût par abonné
create table public.usage_ia (
  user_id uuid not null references public.profils on delete cascade,
  mois text not null,          -- 'AAAA-MM'
  appels int not null default 0,
  primary key (user_id, mois)
);

-- ───────────────────────── Sécurité (RLS) ─────────────────────────
alter table public.profils enable row level security;
alter table public.liens enable row level security;
alter table public.devoirs enable row level security;
alter table public.tentatives enable row level security;
alter table public.messages enable row level security;
alter table public.plans enable row level security;
alter table public.usage_ia enable row level security;

-- Profils : soi-même, et les personnes avec qui un lien existe (même en attente)
create policy profils_lecture on public.profils for select using (
  id = auth.uid() or exists (
    select 1 from public.liens l
    where (l.professeur_id = auth.uid() and l.eleve_id = profils.id)
       or (l.eleve_id = auth.uid() and l.professeur_id = profils.id)));
create policy profils_maj on public.profils for update using (id = auth.uid());
revoke update on public.profils from authenticated;
grant update (nom, langue_ia, niveau_vise, examen_vise) on public.profils to authenticated;

create policy liens_lecture on public.liens for select using (
  professeur_id = auth.uid() or eleve_id = auth.uid()
  or email_invite = public.mon_email());
create policy liens_suppression on public.liens for delete using (professeur_id = auth.uid() or eleve_id = auth.uid());
-- Création et réponse : uniquement par les fonctions inviter() et repondre_lien().

create policy tentatives_lecture on public.tentatives for select using (
  eleve_id = auth.uid() or public.est_lie(auth.uid(), eleve_id));
create policy tentatives_ajout on public.tentatives for insert with check (eleve_id = auth.uid());

create policy devoirs_lecture on public.devoirs for select using (eleve_id = auth.uid() or professeur_id = auth.uid());
create policy devoirs_ajout on public.devoirs for insert with check (professeur_id = auth.uid() and public.est_lie(auth.uid(), eleve_id));
create policy devoirs_suppression on public.devoirs for delete using (professeur_id = auth.uid());

create policy messages_lecture on public.messages for select using (de_id = auth.uid() or a_id = auth.uid());
create policy messages_ajout on public.messages for insert with check (
  de_id = auth.uid() and (public.est_lie(auth.uid(), a_id) or public.est_lie(a_id, auth.uid())));
create policy messages_lu on public.messages for update using (a_id = auth.uid());
revoke update on public.messages from authenticated;
grant update (lu) on public.messages to authenticated;

create policy plans_lecture on public.plans for select using (eleve_id = auth.uid() or public.est_lie(auth.uid(), eleve_id));
create policy plans_ecriture on public.plans for insert with check (eleve_id = auth.uid());
create policy plans_maj on public.plans for update using (eleve_id = auth.uid());

create policy usage_lecture on public.usage_ia for select using (user_id = auth.uid());
-- Écriture de usage_ia : uniquement par la fonction serveur (clé service).
