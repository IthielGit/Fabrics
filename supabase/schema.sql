-- Fabrics — schéma Supabase (jalon M13)
-- À exécuter une fois dans Supabase : SQL Editor → New query → coller → Run.
-- Correspond au type `Project` de docs/02-ARCHITECTURE.md (document stocké en JSON).

-- =========================================================
-- Table des projets
-- =========================================================
create table if not exists public.projects (
  id             uuid primary key default gen_random_uuid(),
  owner_id       uuid not null default auth.uid()
                   references auth.users (id) on delete cascade,
  name           text not null check (char_length(name) between 1 and 200),
  kind           text not null check (kind in ('design', 'plan')),
  document       jsonb not null,
  thumbnail_path text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists projects_owner_updated_idx
  on public.projects (owner_id, updated_at desc);

-- Mise à jour automatique de updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

-- =========================================================
-- Sécurité : chaque utilisateur ne voit que ses projets
-- =========================================================
alter table public.projects enable row level security;

drop policy if exists "projects_select_own" on public.projects;
create policy "projects_select_own" on public.projects
  for select to authenticated
  using (owner_id = auth.uid());

drop policy if exists "projects_insert_own" on public.projects;
create policy "projects_insert_own" on public.projects
  for insert to authenticated
  with check (owner_id = auth.uid());

drop policy if exists "projects_update_own" on public.projects;
create policy "projects_update_own" on public.projects
  for update to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

drop policy if exists "projects_delete_own" on public.projects;
create policy "projects_delete_own" on public.projects
  for delete to authenticated
  using (owner_id = auth.uid());

-- =========================================================
-- Stockage des images : bucket privé "assets"
-- Chemin de chaque fichier : <user_id>/<assetId>
-- =========================================================
insert into storage.buckets (id, name, public)
values ('assets', 'assets', false)
on conflict (id) do nothing;

drop policy if exists "assets_select_own" on storage.objects;
create policy "assets_select_own" on storage.objects
  for select to authenticated
  using (bucket_id = 'assets' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "assets_insert_own" on storage.objects;
create policy "assets_insert_own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'assets' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "assets_update_own" on storage.objects;
create policy "assets_update_own" on storage.objects
  for update to authenticated
  using (bucket_id = 'assets' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "assets_delete_own" on storage.objects;
create policy "assets_delete_own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'assets' and (storage.foldername(name))[1] = auth.uid()::text);

-- =========================================================
-- Partage par lien en lecture seule (lot E)
-- Le fichier entier peut être réexécuté sans risque.
--
-- Principe de sécurité :
--  * la table `shares` n'est lisible que par le propriétaire du projet, et sans le mot de passe haché ;
--  * un visiteur (anon) n'a accès à AUCUNE table : il passe uniquement par la fonction
--    get_shared_project, qui vérifie le jeton, l'état actif, l'expiration et le mot de passe ;
--  * personne d'autre que le propriétaire ne peut créer ou modifier un partage.
-- =========================================================
create extension if not exists pgcrypto with schema extensions;

create table if not exists public.shares (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references public.projects (id) on delete cascade,
  owner_id      uuid not null default auth.uid()
                  references auth.users (id) on delete cascade,
  -- Jeton aléatoire de 192 bits, tiré par la base : impossible à deviner.
  token         text not null unique default encode(extensions.gen_random_bytes(24), 'hex'),
  active        boolean not null default true,
  password_hash text,
  has_password  boolean generated always as (password_hash is not null) stored,
  expires_at    timestamptz,
  created_at    timestamptz not null default now()
);

create index if not exists shares_project_idx on public.shares (project_id);

alter table public.shares enable row level security;

drop policy if exists "shares_select_own" on public.shares;
create policy "shares_select_own" on public.shares
  for select to authenticated
  using (owner_id = auth.uid());

drop policy if exists "shares_update_own" on public.shares;
create policy "shares_update_own" on public.shares
  for update to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

drop policy if exists "shares_delete_own" on public.shares;
create policy "shares_delete_own" on public.shares
  for delete to authenticated
  using (owner_id = auth.uid());

-- Droits par colonne : le mot de passe haché n'est jamais lisible depuis le navigateur,
-- et seuls « actif » et « expiration » se modifient directement.
revoke all on public.shares from anon, authenticated;
grant select (id, project_id, owner_id, token, active, has_password, expires_at, created_at)
  on public.shares to authenticated;
grant update (active, expires_at) on public.shares to authenticated;
grant delete on public.shares to authenticated;

-- Création d'un lien (propriétaire d'un plan seulement).
create or replace function public.create_share(
  p_project_id uuid,
  p_password text default null,
  p_expires_at timestamptz default null
) returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v public.shares;
begin
  if auth.uid() is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;
  if not exists (
    select 1 from public.projects
    where id = p_project_id and owner_id = auth.uid() and kind = 'plan'
  ) then
    raise exception 'project not found' using errcode = '42501';
  end if;

  insert into public.shares (project_id, password_hash, expires_at)
  values (
    p_project_id,
    case when coalesce(p_password, '') = '' then null else crypt(p_password, gen_salt('bf')) end,
    p_expires_at
  )
  returning * into v;

  return jsonb_build_object(
    'id', v.id, 'project_id', v.project_id, 'token', v.token, 'active', v.active,
    'has_password', v.has_password, 'expires_at', v.expires_at, 'created_at', v.created_at
  );
end;
$$;

-- Ajout, changement ou retrait (mot de passe vide) du mot de passe d'un lien.
create or replace function public.set_share_password(p_share_id uuid, p_password text)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  update public.shares
     set password_hash = case when coalesce(p_password, '') = '' then null else crypt(p_password, gen_salt('bf')) end
   where id = p_share_id and owner_id = auth.uid();
  if not found then
    raise exception 'share not found' using errcode = '42501';
  end if;
end;
$$;

-- Lecture publique : seule porte d'entrée des visiteurs.
-- Même réponse « unavailable » pour un jeton inconnu, désactivé ou expiré (rien n'est révélé).
create or replace function public.get_shared_project(p_token text, p_password text default null)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  s public.shares;
  p public.projects;
begin
  select * into s from public.shares where token = p_token;
  if not found or not s.active or (s.expires_at is not null and s.expires_at <= now()) then
    return jsonb_build_object('status', 'unavailable');
  end if;

  if s.password_hash is not null then
    if p_password is null or p_password = '' then
      return jsonb_build_object('status', 'password_required');
    end if;
    if crypt(p_password, s.password_hash) <> s.password_hash then
      return jsonb_build_object('status', 'wrong_password');
    end if;
  end if;

  select * into p from public.projects where id = s.project_id;
  if not found then
    return jsonb_build_object('status', 'unavailable');
  end if;

  return jsonb_build_object(
    'status', 'ok',
    'project', jsonb_build_object(
      'name', p.name, 'kind', p.kind, 'document', p.document, 'updated_at', p.updated_at
    )
  );
end;
$$;

revoke all on function public.create_share(uuid, text, timestamptz) from public, anon;
revoke all on function public.set_share_password(uuid, text) from public, anon;
revoke all on function public.get_shared_project(text, text) from public;
grant execute on function public.create_share(uuid, text, timestamptz) to authenticated;
grant execute on function public.set_share_password(uuid, text) to authenticated;
grant execute on function public.get_shared_project(text, text) to anon, authenticated;

-- =========================================================
-- Partage avec un autre compte (M14, lot B)
-- Le fichier entier peut être réexécuté sans risque.
--
-- Principe de sécurité :
--  * le propriétaire reste `projects.owner_id` ; les autres comptes sont dans `project_members`
--    (rôle « viewer » = lecture, « editor » = lecture et modification) ;
--  * tout passe par la fonction `my_project_role` (security definer) : les règles de `projects`
--    et de `project_members` n'ont ainsi pas à s'interroger l'une l'autre (pas de récursion RLS) ;
--  * on rejoint un projet uniquement avec un lien d'invitation (`project_invites`), jamais par
--    adresse e-mail : aucune recherche de comptes n'est possible ;
--  * seul le propriétaire supprime le projet, crée des invitations et gère les membres ;
--  * `owner_id` d'un projet ne peut plus changer une fois créé (déclencheur).
-- =========================================================

create table if not exists public.project_members (
  project_id uuid not null references public.projects (id) on delete cascade,
  user_id    uuid not null references auth.users (id) on delete cascade,
  role       text not null check (role in ('viewer', 'editor')),
  created_at timestamptz not null default now(),
  primary key (project_id, user_id)
);

create index if not exists project_members_user_idx on public.project_members (user_id);

-- Rôle de la personne connectée sur un projet : 'owner', 'editor', 'viewer', ou null (aucun accès).
-- Créée après la table : une fonction SQL est vérifiée dès sa création.
create or replace function public.my_project_role(p_project_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select case
    when p.owner_id = auth.uid() then 'owner'
    else (
      select m.role from public.project_members m
      where m.project_id = p.id and m.user_id = auth.uid()
    )
  end
  from public.projects p
  where p.id = p_project_id;
$$;

alter table public.project_members enable row level security;

-- Un membre voit sa propre ligne ; le propriétaire voit celles de ses projets.
drop policy if exists "members_select" on public.project_members;
create policy "members_select" on public.project_members
  for select to authenticated
  using (user_id = auth.uid() or public.my_project_role(project_id) = 'owner');

-- Le propriétaire change un rôle ou retire un membre ; un membre peut quitter le projet.
drop policy if exists "members_update_owner" on public.project_members;
create policy "members_update_owner" on public.project_members
  for update to authenticated
  using (public.my_project_role(project_id) = 'owner')
  with check (public.my_project_role(project_id) = 'owner');

drop policy if exists "members_delete" on public.project_members;
create policy "members_delete" on public.project_members
  for delete to authenticated
  using (user_id = auth.uid() or public.my_project_role(project_id) = 'owner');

-- Aucune insertion directe : on entre uniquement par accept_invite.
revoke all on public.project_members from anon, authenticated;
grant select on public.project_members to authenticated;
grant update (role) on public.project_members to authenticated;
grant delete on public.project_members to authenticated;

-- Invitations par lien.
create table if not exists public.project_invites (
  id         uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  owner_id   uuid not null default auth.uid()
               references auth.users (id) on delete cascade,
  -- Jeton aléatoire de 192 bits, tiré par la base : impossible à deviner.
  token      text not null unique default encode(extensions.gen_random_bytes(24), 'hex'),
  role       text not null check (role in ('viewer', 'editor')),
  active     boolean not null default true,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists project_invites_project_idx on public.project_invites (project_id);

alter table public.project_invites enable row level security;

drop policy if exists "invites_select_own" on public.project_invites;
create policy "invites_select_own" on public.project_invites
  for select to authenticated
  using (owner_id = auth.uid());

drop policy if exists "invites_update_own" on public.project_invites;
create policy "invites_update_own" on public.project_invites
  for update to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

drop policy if exists "invites_delete_own" on public.project_invites;
create policy "invites_delete_own" on public.project_invites
  for delete to authenticated
  using (owner_id = auth.uid());

revoke all on public.project_invites from anon, authenticated;
grant select on public.project_invites to authenticated;
grant update (active, expires_at, role) on public.project_invites to authenticated;
grant delete on public.project_invites to authenticated;

-- Création d'une invitation (propriétaire du projet seulement).
create or replace function public.create_invite(
  p_project_id uuid,
  p_role text,
  p_expires_at timestamptz default null
) returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v public.project_invites;
begin
  if auth.uid() is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;
  if p_role not in ('viewer', 'editor') then
    raise exception 'invalid role' using errcode = '22023';
  end if;
  if public.my_project_role(p_project_id) is distinct from 'owner' then
    raise exception 'project not found' using errcode = '42501';
  end if;

  insert into public.project_invites (project_id, role, expires_at)
  values (p_project_id, p_role, p_expires_at)
  returning * into v;

  return jsonb_build_object(
    'id', v.id, 'project_id', v.project_id, 'token', v.token, 'role', v.role,
    'active', v.active, 'expires_at', v.expires_at, 'created_at', v.created_at
  );
end;
$$;

-- La personne connectée rejoint le projet de l'invitation.
-- Même réponse « unavailable » pour un jeton inconnu, désactivé ou expiré (rien n'est révélé).
-- Un membre existant n'est jamais rétrogradé : on garde le rôle le plus élevé.
create or replace function public.accept_invite(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  i public.project_invites;
  current_role_name text;
begin
  if auth.uid() is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  select * into i from public.project_invites where token = p_token;
  if not found or not i.active or (i.expires_at is not null and i.expires_at <= now()) then
    return jsonb_build_object('status', 'unavailable');
  end if;

  if not exists (select 1 from public.projects where id = i.project_id) then
    return jsonb_build_object('status', 'unavailable');
  end if;

  if public.my_project_role(i.project_id) = 'owner' then
    return jsonb_build_object('status', 'owner', 'project_id', i.project_id);
  end if;

  select role into current_role_name from public.project_members
   where project_id = i.project_id and user_id = auth.uid();

  if current_role_name is null then
    insert into public.project_members (project_id, user_id, role)
    values (i.project_id, auth.uid(), i.role);
    current_role_name := i.role;
  elsif current_role_name = 'viewer' and i.role = 'editor' then
    update public.project_members set role = 'editor'
     where project_id = i.project_id and user_id = auth.uid();
    current_role_name := 'editor';
  end if;

  return jsonb_build_object('status', 'ok', 'project_id', i.project_id, 'role', current_role_name);
end;
$$;

-- Membres d'un projet avec leur adresse e-mail : réservé au propriétaire.
create or replace function public.list_project_members(p_project_id uuid)
returns table (user_id uuid, email text, role text, created_at timestamptz)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if public.my_project_role(p_project_id) is distinct from 'owner' then
    raise exception 'project not found' using errcode = '42501';
  end if;
  return query
    select m.user_id, u.email::text, m.role, m.created_at
      from public.project_members m
      join auth.users u on u.id = m.user_id
     where m.project_id = p_project_id
     order by m.created_at;
end;
$$;

-- Rubrique « Partagés avec moi » : projets des autres comptes dont la personne est membre.
create or replace function public.my_shared_projects()
returns table (
  id uuid, name text, kind text, thumbnail_path text,
  created_at timestamptz, updated_at timestamptz, role text
)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.name, p.kind, p.thumbnail_path, p.created_at, p.updated_at, m.role
    from public.project_members m
    join public.projects p on p.id = m.project_id
   where m.user_id = auth.uid()
   order by p.updated_at desc;
$$;

-- Règles de `projects` étendues aux membres : un membre lit, un éditeur modifie,
-- seul le propriétaire crée (à son nom) et supprime.
drop policy if exists "projects_select_own" on public.projects;
drop policy if exists "projects_select_member" on public.projects;
create policy "projects_select_member" on public.projects
  for select to authenticated
  using (public.my_project_role(id) is not null);

drop policy if exists "projects_update_own" on public.projects;
drop policy if exists "projects_update_editor" on public.projects;
create policy "projects_update_editor" on public.projects
  for update to authenticated
  using (public.my_project_role(id) in ('owner', 'editor'))
  with check (public.my_project_role(id) in ('owner', 'editor'));

-- Le propriétaire et la date de création ne changent jamais après la création. Sans cela, l'enregistrement
-- automatique d'un éditeur (qui envoie la ligne entière) pourrait s'approprier le projet.
create or replace function public.projects_freeze_owner()
returns trigger
language plpgsql
as $$
begin
  new.owner_id = old.owner_id;
  new.created_at = old.created_at;
  return new;
end;
$$;

drop trigger if exists projects_freeze_owner on public.projects;
create trigger projects_freeze_owner
  before update on public.projects
  for each row execute function public.projects_freeze_owner();

-- Images : un membre lit les images du dossier du propriétaire d'un projet qu'il peut ouvrir.
-- (Les images ajoutées par un éditeur restent dans son propre dossier : voir M14, lot D.)
create or replace function public.can_read_assets_of(p_folder text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.projects p
     where p.owner_id::text = p_folder
       and public.my_project_role(p.id) is not null
  );
$$;

drop policy if exists "assets_select_shared" on storage.objects;
create policy "assets_select_shared" on storage.objects
  for select to authenticated
  using (bucket_id = 'assets' and public.can_read_assets_of((storage.foldername(name))[1]));

-- Droits d'exécution : jamais pour les visiteurs sans compte.
revoke all on function public.my_project_role(uuid) from public, anon;
revoke all on function public.create_invite(uuid, text, timestamptz) from public, anon;
revoke all on function public.accept_invite(text) from public, anon;
revoke all on function public.list_project_members(uuid) from public, anon;
revoke all on function public.my_shared_projects() from public, anon;
revoke all on function public.can_read_assets_of(text) from public, anon;
grant execute on function public.my_project_role(uuid) to authenticated;
grant execute on function public.create_invite(uuid, text, timestamptz) to authenticated;
grant execute on function public.accept_invite(text) to authenticated;
grant execute on function public.list_project_members(uuid) to authenticated;
grant execute on function public.my_shared_projects() to authenticated;
grant execute on function public.can_read_assets_of(text) to authenticated;
