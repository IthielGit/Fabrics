-- Fabrics — schéma Supabase (jalon M12)
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
