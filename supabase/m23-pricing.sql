-- Fabrics — M23 : espaces, bibliothèque de prix et DQE.
-- À exécuter une fois dans Supabase : SQL Editor → New query → coller tout le fichier → Run.
-- Le script peut être relancé sans danger (il ne supprime aucune donnée).
-- Décisions : docs/phases/M23-decisions.md (D23-7 à D23-15).
--
-- Principes :
--  * une bibliothèque de prix appartient à un ESPACE (équipe ou entreprise), pas à un compte ;
--  * deux rôles : `admin` (modifie les prix, gère les membres) et `member` (lit seulement) ;
--  * un membre qui quitte l'espace (`left_at` rempli) ne lit plus rien ; ses modifications restent
--    dans l'historique, avec son adresse ;
--  * on rejoint un espace uniquement avec un lien d'invitation (aucune recherche de comptes) ;
--  * prix et montants : entiers en DIXIÈMES d'Ariary (`bigint`), jamais de nombre à virgule ;
--  * tout passe par `my_workspace_role` (security definer) pour éviter la récursion des règles RLS.

-- =========================================================
-- 23.1 · Espaces et membres
-- =========================================================

create table if not exists public.workspaces (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(name) between 1 and 120),
  created_by uuid references auth.users (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);

create table if not exists public.workspace_members (
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  user_id      uuid not null references auth.users (id) on delete cascade,
  role         text not null check (role in ('admin', 'member')),
  -- Adresse relevée à l'entrée dans l'espace (affichée aux autres membres).
  email        text not null default '',
  joined_at    timestamptz not null default now(),
  left_at      timestamptz,
  primary key (workspace_id, user_id)
);

create index if not exists workspace_members_user_idx on public.workspace_members (user_id);

-- Rôle de la personne connectée dans un espace : 'admin', 'member', ou null (aucun accès).
create or replace function public.my_workspace_role(p_workspace_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select m.role from public.workspace_members m
   where m.workspace_id = p_workspace_id and m.user_id = auth.uid() and m.left_at is null;
$$;

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;

drop policy if exists "workspaces_select" on public.workspaces;
create policy "workspaces_select" on public.workspaces
  for select to authenticated
  using (public.my_workspace_role(id) is not null);

drop policy if exists "workspaces_update_admin" on public.workspaces;
create policy "workspaces_update_admin" on public.workspaces
  for update to authenticated
  using (public.my_workspace_role(id) = 'admin')
  with check (public.my_workspace_role(id) = 'admin');

-- Les membres présents se voient entre eux ; les anciens membres ne sont plus listés.
drop policy if exists "workspace_members_select" on public.workspace_members;
create policy "workspace_members_select" on public.workspace_members
  for select to authenticated
  using (left_at is null and public.my_workspace_role(workspace_id) is not null);

revoke all on public.workspaces from anon, authenticated;
grant select on public.workspaces to authenticated;
grant update (name) on public.workspaces to authenticated;

-- Aucune écriture directe sur les membres : tout passe par les fonctions ci-dessous.
revoke all on public.workspace_members from anon, authenticated;
grant select on public.workspace_members to authenticated;

-- =========================================================
-- 23.1 · Bibliothèque de prix
-- =========================================================

create table if not exists public.price_libraries (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null unique references public.workspaces (id) on delete cascade,
  name         text not null default 'Bibliothèque de prix' check (char_length(name) between 1 and 120),
  version      integer not null default 1 check (version >= 1),
  currency     text not null default 'MGA' check (currency = 'MGA'),
  -- Taux de TVA en points de base : 2000 = 20 % (D23-6, D23-10).
  vat_rate_bp  integer not null default 2000 check (vat_rate_bp between 0 and 10000),
  price_date   date,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

drop trigger if exists price_libraries_set_updated_at on public.price_libraries;
create trigger price_libraries_set_updated_at
  before update on public.price_libraries
  for each row execute function public.set_updated_at();

-- Matériaux (MTX), matériel (MTL), main-d'œuvre (MO).
create table if not exists public.price_items (
  id               uuid primary key default gen_random_uuid(),
  library_id       uuid not null references public.price_libraries (id) on delete cascade,
  workspace_id     uuid not null references public.workspaces (id) on delete cascade,
  kind             text not null check (kind in ('material', 'equipment', 'labour')),
  code             text not null default '',
  category         text not null default '',
  designation      text not null check (char_length(btrim(designation)) between 1 and 500),
  unit             text not null check (char_length(btrim(unit)) between 1 and 30),
  source_basis     text not null default 'ht' check (source_basis in ('ht', 'ttc_delivered')),
  source_price     bigint check (source_price is null or source_price >= 0),
  -- Ligne achetée sans TVA (D23-16) : prix HT = prix TTC, quel que soit le taux.
  vat_exempt       boolean not null default false,
  price_ht         bigint check (price_ht is null or price_ht >= 0),
  supplier         text not null default '',
  region           text not null default '',
  effective_date   date,
  details          jsonb not null default '{}'::jsonb,
  source_row       text not null default '',
  -- Clé d'import (« MTX:1.1 ») : un réimport met à jour la ligne de même clé ; vide = saisie à la main.
  source_key       text not null default '',
  updated_by       uuid references auth.users (id) on delete set null,
  updated_by_email text not null default '',
  updated_at       timestamptz not null default now(),
  check (source_price is null or price_ht is not null)
);

create index if not exists price_items_library_idx on public.price_items (library_id, kind, code);

-- Postes de travaux (BIBLIOTHEQUE_TRAVAUX + sous-détail SDP). Prix = débours sec HT (D23-12).
create table if not exists public.work_items (
  id                 uuid primary key default gen_random_uuid(),
  library_id         uuid not null references public.price_libraries (id) on delete cascade,
  workspace_id       uuid not null references public.workspaces (id) on delete cascade,
  code               text not null default '',
  category           text not null default '',
  designation        text not null check (char_length(btrim(designation)) between 1 and 500),
  unit               text not null check (char_length(btrim(unit)) between 1 and 30),
  price_ht           bigint check (price_ht is null or price_ht >= 0),
  reference_price    bigint,
  source_coefficient text not null default '',
  output             text not null default '',
  -- Lignes du sous-détail : [{ group, designation, unit, quantity, unitPriceHt, amountHt }]
  -- (montants en dixièmes d'Ar, écrits en texte).
  components         jsonb not null default '[]'::jsonb,
  source_row         text not null default '',
  source_key         text not null default '',
  updated_by         uuid references auth.users (id) on delete set null,
  updated_by_email   text not null default '',
  updated_at         timestamptz not null default now()
);

create index if not exists work_items_library_idx on public.work_items (library_id, code);

-- Historique par ligne (D23-7) : auteur, date, ancienne et nouvelle valeur.
create table if not exists public.price_history (
  id               bigint generated always as identity primary key,
  workspace_id     uuid not null references public.workspaces (id) on delete cascade,
  item_table       text not null check (item_table in ('price_items', 'work_items')),
  item_id          uuid not null,
  code             text not null default '',
  designation      text not null default '',
  action           text not null check (action in ('insert', 'update', 'delete')),
  old_price_ht     bigint,
  new_price_ht     bigint,
  changed_by       uuid references auth.users (id) on delete set null,
  changed_by_email text not null default '',
  changed_at       timestamptz not null default now()
);

create index if not exists price_history_item_idx on public.price_history (item_id, changed_at desc);

-- Auteur et date de chaque modification ; l'espace est toujours celui de la bibliothèque.
create or replace function public.price_rows_stamp()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  select l.workspace_id into new.workspace_id from public.price_libraries l where l.id = new.library_id;
  new.updated_by = auth.uid();
  new.updated_by_email = coalesce((select u.email::text from auth.users u where u.id = auth.uid()), '');
  new.updated_at = now();
  return new;
end;
$$;

-- Une ligne d'historique par ajout, suppression, ou changement de prix ou de désignation.
create or replace function public.price_rows_history()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := coalesce((select u.email::text from auth.users u where u.id = auth.uid()), '');
begin
  if tg_op = 'INSERT' then
    insert into public.price_history (workspace_id, item_table, item_id, code, designation, action,
                                      old_price_ht, new_price_ht, changed_by, changed_by_email)
    values (new.workspace_id, tg_table_name, new.id, new.code, new.designation, 'insert',
            null, new.price_ht, auth.uid(), v_email);
    return new;
  elsif tg_op = 'UPDATE' then
    if new.price_ht is distinct from old.price_ht or new.designation is distinct from old.designation
       or new.code is distinct from old.code or new.unit is distinct from old.unit then
      insert into public.price_history (workspace_id, item_table, item_id, code, designation, action,
                                        old_price_ht, new_price_ht, changed_by, changed_by_email)
      values (new.workspace_id, tg_table_name, new.id, new.code, new.designation, 'update',
              old.price_ht, new.price_ht, auth.uid(), v_email);
    end if;
    return new;
  else
    insert into public.price_history (workspace_id, item_table, item_id, code, designation, action,
                                      old_price_ht, new_price_ht, changed_by, changed_by_email)
    values (old.workspace_id, tg_table_name, old.id, old.code, old.designation, 'delete',
            old.price_ht, null, auth.uid(), v_email);
    return old;
  end if;
end;
$$;

drop trigger if exists price_items_stamp on public.price_items;
create trigger price_items_stamp before insert or update on public.price_items
  for each row execute function public.price_rows_stamp();
drop trigger if exists price_items_history on public.price_items;
create trigger price_items_history after insert or update or delete on public.price_items
  for each row execute function public.price_rows_history();

drop trigger if exists work_items_stamp on public.work_items;
create trigger work_items_stamp before insert or update on public.work_items
  for each row execute function public.price_rows_stamp();
drop trigger if exists work_items_history on public.work_items;
create trigger work_items_history after insert or update or delete on public.work_items
  for each row execute function public.price_rows_history();

alter table public.price_libraries enable row level security;
alter table public.price_items enable row level security;
alter table public.work_items enable row level security;
alter table public.price_history enable row level security;

-- Lecture : tout membre présent de l'espace (D23-7). Écriture : admins seulement.
drop policy if exists "price_libraries_select" on public.price_libraries;
create policy "price_libraries_select" on public.price_libraries
  for select to authenticated using (public.my_workspace_role(workspace_id) is not null);
drop policy if exists "price_libraries_update" on public.price_libraries;
create policy "price_libraries_update" on public.price_libraries
  for update to authenticated
  using (public.my_workspace_role(workspace_id) = 'admin')
  with check (public.my_workspace_role(workspace_id) = 'admin');

drop policy if exists "price_items_select" on public.price_items;
create policy "price_items_select" on public.price_items
  for select to authenticated using (public.my_workspace_role(workspace_id) is not null);
drop policy if exists "price_items_write" on public.price_items;
create policy "price_items_write" on public.price_items
  for all to authenticated
  using (public.my_workspace_role(workspace_id) = 'admin')
  with check (
    public.my_workspace_role((select l.workspace_id from public.price_libraries l where l.id = library_id)) = 'admin'
  );

drop policy if exists "work_items_select" on public.work_items;
create policy "work_items_select" on public.work_items
  for select to authenticated using (public.my_workspace_role(workspace_id) is not null);
drop policy if exists "work_items_write" on public.work_items;
create policy "work_items_write" on public.work_items
  for all to authenticated
  using (public.my_workspace_role(workspace_id) = 'admin')
  with check (
    public.my_workspace_role((select l.workspace_id from public.price_libraries l where l.id = library_id)) = 'admin'
  );

drop policy if exists "price_history_select" on public.price_history;
create policy "price_history_select" on public.price_history
  for select to authenticated using (public.my_workspace_role(workspace_id) is not null);

revoke all on public.price_libraries from anon, authenticated;
grant select on public.price_libraries to authenticated;
-- Le taux de TVA ne se change que par set_library_vat_rate (les prix HT tirés d'un TTC suivent).
grant update (name, price_date) on public.price_libraries to authenticated;

revoke all on public.price_items from anon, authenticated;
grant select, insert, delete on public.price_items to authenticated;
grant update (kind, code, category, designation, unit, source_basis, source_price, vat_exempt, price_ht, supplier,
              region, effective_date, details, source_row, source_key) on public.price_items to authenticated;

revoke all on public.work_items from anon, authenticated;
grant select, insert, delete on public.work_items to authenticated;
grant update (code, category, designation, unit, price_ht, reference_price, source_coefficient, output,
              components, source_row, source_key) on public.work_items to authenticated;

-- L'historique n'est écrit que par les déclencheurs.
revoke all on public.price_history from anon, authenticated;
grant select on public.price_history to authenticated;

-- =========================================================
-- 23.1 · Fonctions : créer un espace, inviter, rejoindre, gérer les membres
-- =========================================================

-- Crée un espace : la personne connectée en devient admin, avec une bibliothèque vide.
create or replace function public.create_workspace(p_name text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if auth.uid() is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;
  insert into public.workspaces (name, created_by) values (btrim(p_name), auth.uid()) returning id into v_id;
  insert into public.workspace_members (workspace_id, user_id, role, email)
  values (v_id, auth.uid(), 'admin',
          coalesce((select u.email::text from auth.users u where u.id = auth.uid()), ''));
  insert into public.price_libraries (workspace_id) values (v_id);
  return jsonb_build_object('id', v_id, 'name', btrim(p_name), 'role', 'admin');
end;
$$;

-- Espaces de la personne connectée, avec son rôle.
create or replace function public.my_workspaces()
returns table (id uuid, name text, role text)
language sql
stable
security definer
set search_path = public
as $$
  select w.id, w.name, m.role
    from public.workspaces w
    join public.workspace_members m on m.workspace_id = w.id
   where m.user_id = auth.uid() and m.left_at is null
   order by w.created_at;
$$;

create table if not exists public.workspace_invites (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  created_by   uuid references auth.users (id) on delete set null default auth.uid(),
  token        text not null unique default encode(extensions.gen_random_bytes(24), 'hex'),
  role         text not null check (role in ('admin', 'member')),
  active       boolean not null default true,
  expires_at   timestamptz,
  created_at   timestamptz not null default now()
);

create index if not exists workspace_invites_ws_idx on public.workspace_invites (workspace_id);

alter table public.workspace_invites enable row level security;

drop policy if exists "workspace_invites_admin" on public.workspace_invites;
create policy "workspace_invites_admin" on public.workspace_invites
  for select to authenticated using (public.my_workspace_role(workspace_id) = 'admin');
drop policy if exists "workspace_invites_admin_update" on public.workspace_invites;
create policy "workspace_invites_admin_update" on public.workspace_invites
  for update to authenticated
  using (public.my_workspace_role(workspace_id) = 'admin')
  with check (public.my_workspace_role(workspace_id) = 'admin');

revoke all on public.workspace_invites from anon, authenticated;
grant select on public.workspace_invites to authenticated;
grant update (active) on public.workspace_invites to authenticated;

create or replace function public.create_workspace_invite(p_workspace_id uuid, p_role text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v public.workspace_invites;
begin
  if p_role not in ('admin', 'member') then
    raise exception 'invalid role' using errcode = '22023';
  end if;
  if public.my_workspace_role(p_workspace_id) is distinct from 'admin' then
    raise exception 'workspace not found' using errcode = '42501';
  end if;
  insert into public.workspace_invites (workspace_id, role) values (p_workspace_id, p_role) returning * into v;
  return jsonb_build_object('id', v.id, 'workspace_id', v.workspace_id, 'token', v.token, 'role', v.role,
                            'active', v.active, 'expires_at', v.expires_at, 'created_at', v.created_at);
end;
$$;

-- Rejoindre un espace. Même réponse « unavailable » pour un jeton inconnu, désactivé ou expiré.
-- Un ancien membre revient avec le rôle de l'invitation ; un membre présent n'est jamais rétrogradé.
create or replace function public.accept_workspace_invite(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  i public.workspace_invites;
  v_current text;
  v_email text := coalesce((select u.email::text from auth.users u where u.id = auth.uid()), '');
begin
  if auth.uid() is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;
  select * into i from public.workspace_invites where token = p_token;
  if not found or not i.active or (i.expires_at is not null and i.expires_at <= now()) then
    return jsonb_build_object('status', 'unavailable');
  end if;

  v_current := public.my_workspace_role(i.workspace_id);
  if v_current is null then
    insert into public.workspace_members (workspace_id, user_id, role, email)
    values (i.workspace_id, auth.uid(), i.role, v_email)
    on conflict (workspace_id, user_id)
      do update set role = excluded.role, email = excluded.email, joined_at = now(), left_at = null;
    v_current := i.role;
  elsif v_current = 'member' and i.role = 'admin' then
    update public.workspace_members set role = 'admin'
     where workspace_id = i.workspace_id and user_id = auth.uid();
    v_current := 'admin';
  end if;
  return jsonb_build_object('status', 'ok', 'workspace_id', i.workspace_id, 'role', v_current);
end;
$$;

-- Changer le rôle d'un membre (admins). Il reste toujours au moins un admin.
create or replace function public.set_workspace_member_role(p_workspace_id uuid, p_user_id uuid, p_role text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_role not in ('admin', 'member') then
    raise exception 'invalid role' using errcode = '22023';
  end if;
  if public.my_workspace_role(p_workspace_id) is distinct from 'admin' then
    raise exception 'workspace not found' using errcode = '42501';
  end if;
  if p_role = 'member' and (
    select count(*) from public.workspace_members
     where workspace_id = p_workspace_id and role = 'admin' and left_at is null and user_id <> p_user_id
  ) = 0 then
    raise exception 'last admin' using errcode = 'P0001';
  end if;
  update public.workspace_members set role = p_role
   where workspace_id = p_workspace_id and user_id = p_user_id and left_at is null;
end;
$$;

-- Retirer un membre (admins) ou quitter l'espace (soi-même). Le membre est marqué parti, jamais
-- effacé : ses modifications restent dans l'historique (D23-7). Il reste toujours au moins un admin.
create or replace function public.remove_workspace_member(p_workspace_id uuid, p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_user_id <> auth.uid() and public.my_workspace_role(p_workspace_id) is distinct from 'admin' then
    raise exception 'workspace not found' using errcode = '42501';
  end if;
  if (select role from public.workspace_members
       where workspace_id = p_workspace_id and user_id = p_user_id and left_at is null) = 'admin'
     and (select count(*) from public.workspace_members
           where workspace_id = p_workspace_id and role = 'admin' and left_at is null) = 1 then
    raise exception 'last admin' using errcode = 'P0001';
  end if;
  update public.workspace_members set left_at = now()
   where workspace_id = p_workspace_id and user_id = p_user_id and left_at is null;
end;
$$;

revoke all on function public.my_workspace_role(uuid) from public, anon;
revoke all on function public.create_workspace(text) from public, anon;
revoke all on function public.my_workspaces() from public, anon;
revoke all on function public.create_workspace_invite(uuid, text) from public, anon;
revoke all on function public.accept_workspace_invite(text) from public, anon;
revoke all on function public.set_workspace_member_role(uuid, uuid, text) from public, anon;
revoke all on function public.remove_workspace_member(uuid, uuid) from public, anon;
revoke all on function public.price_rows_stamp() from public, anon, authenticated;
revoke all on function public.price_rows_history() from public, anon, authenticated;
grant execute on function public.my_workspace_role(uuid) to authenticated;
grant execute on function public.create_workspace(text) to authenticated;
grant execute on function public.my_workspaces() to authenticated;
grant execute on function public.create_workspace_invite(uuid, text) to authenticated;
grant execute on function public.accept_workspace_invite(text) to authenticated;
grant execute on function public.set_workspace_member_role(uuid, uuid, text) to authenticated;
grant execute on function public.remove_workspace_member(uuid, uuid) to authenticated;

-- Change le taux de TVA et recalcule, dans la même transaction, le prix HT des lignes saisies en TTC
-- (sauf les lignes « sans TVA », D23-16)
-- (D23-10 : HT = TTC ÷ (1 + taux), au dixième d'Ar le plus proche, la moitié vers le haut).
create or replace function public.set_library_vat_rate(p_library_id uuid, p_vat_rate_bp integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_workspace uuid;
begin
  select workspace_id into v_workspace from public.price_libraries where id = p_library_id;
  if v_workspace is null or public.my_workspace_role(v_workspace) is distinct from 'admin' then
    raise exception 'library not found' using errcode = '42501';
  end if;
  if p_vat_rate_bp < 0 or p_vat_rate_bp > 10000 then
    raise exception 'invalid rate' using errcode = '22023';
  end if;
  update public.price_libraries set vat_rate_bp = p_vat_rate_bp where id = p_library_id;
  update public.price_items
     set price_ht = round(source_price::numeric * 10000 / (10000 + p_vat_rate_bp))::bigint
   where library_id = p_library_id and source_basis = 'ttc_delivered' and source_price is not null
     and not vat_exempt;
end;
$$;

revoke all on function public.set_library_vat_rate(uuid, integer) from public, anon;
grant execute on function public.set_library_vat_rate(uuid, integer) to authenticated;

-- =========================================================
-- 23.2 · Import des prix (classeur XLSX ou CSV)
-- =========================================================
-- Le navigateur lit le fichier et calcule le plan (lignes à ajouter, modifier, retirer) ; la base
-- l'applique d'un bloc, ou pas du tout. La bibliothèque prend une version de plus. Une ligne saisie
-- à la main (source_key vide) n'est jamais retirée par un import.

create table if not exists public.price_import_batches (
  id                uuid primary key default gen_random_uuid(),
  library_id        uuid not null references public.price_libraries (id) on delete cascade,
  workspace_id      uuid not null references public.workspaces (id) on delete cascade,
  version           integer not null,
  file_name         text not null default '',
  sha256            text not null default '',
  imported_by       uuid references auth.users (id) on delete set null,
  imported_by_email text not null default '',
  imported_at       timestamptz not null default now(),
  -- { added, updated, removed, unchanged, keptManual, priceChanges, warnings }
  summary           jsonb not null default '{}'::jsonb
);

create index if not exists price_import_batches_library_idx on public.price_import_batches (library_id, imported_at desc);

alter table public.price_import_batches enable row level security;

drop policy if exists "price_import_batches_select" on public.price_import_batches;
create policy "price_import_batches_select" on public.price_import_batches
  for select to authenticated using (public.my_workspace_role(workspace_id) is not null);

revoke all on public.price_import_batches from anon, authenticated;
grant select on public.price_import_batches to authenticated;

create or replace function public.apply_price_import(
  p_library_id       uuid,
  p_expected_version integer,
  p_price_date       date,
  p_file_name        text,
  p_sha256           text,
  p_summary          jsonb,
  p_price_insert     jsonb,
  p_price_update     jsonb,
  p_price_delete     uuid[],
  p_work_insert      jsonb,
  p_work_update      jsonb,
  p_work_delete      uuid[]
) returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_library public.price_libraries;
  v_version integer;
begin
  select * into v_library from public.price_libraries where id = p_library_id for update;
  if not found or public.my_workspace_role(v_library.workspace_id) is distinct from 'admin' then
    raise exception 'library not found' using errcode = '42501';
  end if;
  if v_library.version <> p_expected_version then
    raise exception 'stale version' using errcode = 'P0001';
  end if;

  delete from public.price_items
   where library_id = p_library_id and source_key <> '' and id = any(coalesce(p_price_delete, '{}'));
  delete from public.work_items
   where library_id = p_library_id and source_key <> '' and id = any(coalesce(p_work_delete, '{}'));

  update public.price_items p set
    kind = x.kind, code = x.code, category = x.category, designation = x.designation, unit = x.unit,
    source_basis = x.source_basis, source_price = x.source_price, vat_exempt = x.vat_exempt,
    price_ht = x.price_ht, supplier = x.supplier, region = x.region, effective_date = x.effective_date,
    details = x.details, source_row = x.source_row, source_key = x.source_key
  from jsonb_to_recordset(coalesce(p_price_update, '[]')) as x(
    id uuid, kind text, code text, category text, designation text, unit text, source_basis text,
    source_price bigint, vat_exempt boolean, price_ht bigint, supplier text, region text,
    effective_date date, details jsonb, source_row text, source_key text)
  where p.id = x.id and p.library_id = p_library_id;

  insert into public.price_items (library_id, kind, code, category, designation, unit, source_basis,
    source_price, vat_exempt, price_ht, supplier, region, effective_date, details, source_row, source_key)
  select p_library_id, x.kind, x.code, x.category, x.designation, x.unit, x.source_basis,
    x.source_price, x.vat_exempt, x.price_ht, x.supplier, x.region, x.effective_date,
    coalesce(x.details, '{}'::jsonb), x.source_row, x.source_key
  from jsonb_to_recordset(coalesce(p_price_insert, '[]')) as x(
    kind text, code text, category text, designation text, unit text, source_basis text,
    source_price bigint, vat_exempt boolean, price_ht bigint, supplier text, region text,
    effective_date date, details jsonb, source_row text, source_key text);

  update public.work_items w set
    code = x.code, category = x.category, designation = x.designation, unit = x.unit,
    price_ht = x.price_ht, reference_price = x.reference_price, source_coefficient = x.source_coefficient,
    output = x.output, components = x.components, source_row = x.source_row, source_key = x.source_key
  from jsonb_to_recordset(coalesce(p_work_update, '[]')) as x(
    id uuid, code text, category text, designation text, unit text, price_ht bigint,
    reference_price bigint, source_coefficient text, output text, components jsonb,
    source_row text, source_key text)
  where w.id = x.id and w.library_id = p_library_id;

  insert into public.work_items (library_id, code, category, designation, unit, price_ht, reference_price,
    source_coefficient, output, components, source_row, source_key)
  select p_library_id, x.code, x.category, x.designation, x.unit, x.price_ht, x.reference_price,
    x.source_coefficient, x.output, coalesce(x.components, '[]'::jsonb), x.source_row, x.source_key
  from jsonb_to_recordset(coalesce(p_work_insert, '[]')) as x(
    code text, category text, designation text, unit text, price_ht bigint, reference_price bigint,
    source_coefficient text, output text, components jsonb, source_row text, source_key text);

  update public.price_libraries
     set version = version + 1, price_date = coalesce(p_price_date, price_date)
   where id = p_library_id
  returning version into v_version;

  insert into public.price_import_batches (library_id, workspace_id, version, file_name, sha256,
    imported_by, imported_by_email, summary)
  values (p_library_id, v_library.workspace_id, v_version, coalesce(p_file_name, ''), coalesce(p_sha256, ''),
    auth.uid(), coalesce((select u.email::text from auth.users u where u.id = auth.uid()), ''),
    coalesce(p_summary, '{}'::jsonb));

  return v_version;
end;
$$;

revoke all on function public.apply_price_import(uuid, integer, date, text, text, jsonb, jsonb, jsonb, uuid[], jsonb, jsonb, uuid[]) from public, anon;
grant execute on function public.apply_price_import(uuid, integer, date, text, text, jsonb, jsonb, jsonb, uuid[], jsonb, jsonb, uuid[]) to authenticated;

-- =========================================================
-- 23.3 · Règles de l'espace : quantité de métré + filtre → poste (D23-15)
-- =========================================================

create table if not exists public.pricing_rules (
  id               uuid primary key default gen_random_uuid(),
  library_id       uuid not null references public.price_libraries (id) on delete cascade,
  workspace_id     uuid not null references public.workspaces (id) on delete cascade,
  name             text not null default '' check (char_length(name) <= 200),
  -- Code de quantité du métré (M21), ex. « wall.netArea ».
  quantity_code    text not null check (quantity_code ~ '^[a-zA-Z]+\.[a-zA-Z]+$'),
  -- { wallMaterial, layerMaterial, minThickness, maxThickness, openingKind }
  filter           jsonb not null default '{}'::jsonb,
  work_item_id     uuid references public.work_items (id) on delete set null,
  waste_bp         integer not null default 0 check (waste_bp between 0 and 10000),
  enabled          boolean not null default true,
  position         integer not null default 0,
  updated_by       uuid references auth.users (id) on delete set null,
  updated_by_email text not null default '',
  updated_at       timestamptz not null default now()
);

create index if not exists pricing_rules_library_idx on public.pricing_rules (library_id, position);

drop trigger if exists pricing_rules_stamp on public.pricing_rules;
create trigger pricing_rules_stamp before insert or update on public.pricing_rules
  for each row execute function public.price_rows_stamp();

alter table public.pricing_rules enable row level security;

drop policy if exists "pricing_rules_select" on public.pricing_rules;
create policy "pricing_rules_select" on public.pricing_rules
  for select to authenticated using (public.my_workspace_role(workspace_id) is not null);
drop policy if exists "pricing_rules_write" on public.pricing_rules;
create policy "pricing_rules_write" on public.pricing_rules
  for all to authenticated
  using (public.my_workspace_role(workspace_id) = 'admin')
  with check (
    public.my_workspace_role((select l.workspace_id from public.price_libraries l where l.id = library_id)) = 'admin'
  );

revoke all on public.pricing_rules from anon, authenticated;
grant select, insert, delete on public.pricing_rules to authenticated;
grant update (name, quantity_code, filter, work_item_id, waste_bp, enabled, position) on public.pricing_rules to authenticated;
