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
