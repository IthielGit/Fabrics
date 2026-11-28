-- M24, 24.3 — Journal d'audit (D24-4). À lancer dans Supabase après `schema.sql` et `m23-pricing.sql`.
-- Relançable sans erreur. Vérifié par `npm run check:sql` (PGlite) avant d'être lancé.
--
-- Le journal réutilise ce qui existe déjà (versions des projets, historique des prix, journal des
-- imports, versions des devis) et n'ajoute que les événements manquants :
--   - exports, sauvegardes et restaurations (écrits par l'application, `log_audit_event`) ;
--   - versions de devis figées, définitives ou brouillon (déclencheur) ;
--   - entrées et sorties de membres d'un espace de prix et d'un projet (déclencheurs).
-- Lecture : le propriétaire pour un projet, les admins de l'espace pour les prix et devis.
-- Gardé 1 an : les événements plus anciens sont effacés à chaque nouvel événement.

create table if not exists public.audit_events (
  id           bigserial primary key,
  occurred_at  timestamptz not null default now(),
  actor        uuid references auth.users (id) on delete set null default auth.uid(),
  actor_email  text not null default '',
  project_id   uuid references public.projects (id) on delete cascade,
  workspace_id uuid references public.workspaces (id) on delete cascade,
  kind         text not null check (kind in (
                 'export', 'backup', 'restore',
                 'estimate_final', 'estimate_draft',
                 'workspace_member_joined', 'workspace_member_left',
                 'project_member_joined', 'project_member_left')),
  details      jsonb not null default '{}'::jsonb,
  check (project_id is not null or workspace_id is not null)
);

create index if not exists audit_events_project_idx on public.audit_events (project_id, occurred_at desc);
create index if not exists audit_events_workspace_idx on public.audit_events (workspace_id, occurred_at desc);

alter table public.audit_events enable row level security;

drop policy if exists "audit_events_select" on public.audit_events;
create policy "audit_events_select" on public.audit_events
  for select to authenticated using (
    (project_id is not null and public.my_project_role(project_id) = 'owner')
    or (workspace_id is not null and public.my_workspace_role(workspace_id) = 'admin')
  );

-- Personne n'écrit directement : seulement par les fonctions et déclencheurs ci-dessous.
revoke all on public.audit_events from anon, authenticated;
grant select on public.audit_events to authenticated;
revoke all on sequence public.audit_events_id_seq from anon, authenticated;

-- Écriture d'un événement (interne) : auteur et adresse relevés par la base, journal rogné à 1 an.
create or replace function public.audit_write(p_kind text, p_project_id uuid, p_workspace_id uuid, p_details jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.audit_events (actor, actor_email, project_id, workspace_id, kind, details)
  values (
    auth.uid(),
    coalesce((select u.email from auth.users u where u.id = auth.uid()), ''),
    p_project_id, p_workspace_id, p_kind, coalesce(p_details, '{}'::jsonb)
  );
  delete from public.audit_events where occurred_at < now() - interval '1 year';
end;
$$;

revoke all on function public.audit_write(text, uuid, uuid, jsonb) from public, anon, authenticated;

-- Événements écrits par l'application : export, sauvegarde, restauration, sur un projet accessible.
create or replace function public.log_audit_event(p_kind text, p_project_id uuid, p_details jsonb default '{}'::jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_kind not in ('export', 'backup', 'restore') then
    raise exception 'audit kind not allowed' using errcode = '22023';
  end if;
  if public.my_project_role(p_project_id) is null then
    raise exception 'no access to project' using errcode = '42501';
  end if;
  -- Détails limités : un nom de format, de fichier, de version ; jamais le contenu du projet.
  if octet_length(coalesce(p_details, '{}'::jsonb)::text) > 2000 then
    raise exception 'details too large' using errcode = '22023';
  end if;
  perform public.audit_write(p_kind, p_project_id, null, p_details);
end;
$$;

revoke all on function public.log_audit_event(text, uuid, jsonb) from public, anon;
grant execute on function public.log_audit_event(text, uuid, jsonb) to authenticated;

-- Version de devis figée : « a figé la version 3 du devis (définitif) ».
create or replace function public.audit_estimate_version()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.audit_write(
    case when new.status = 'final' then 'estimate_final' else 'estimate_draft' end,
    (select e.project_id from public.estimates e where e.id = new.estimate_id),
    new.workspace_id,
    jsonb_build_object('number', new.number)
  );
  return new;
end;
$$;

drop trigger if exists estimate_versions_audit on public.estimate_versions;
create trigger estimate_versions_audit after insert on public.estimate_versions
  for each row execute function public.audit_estimate_version();

-- Membres d'un espace de prix : entrée, départ (la ligne est gardée avec `left_at`).
create or replace function public.audit_workspace_member()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' or (old.left_at is not null and new.left_at is null) then
    perform public.audit_write('workspace_member_joined', null, new.workspace_id, jsonb_build_object('email', new.email, 'role', new.role));
  elsif old.left_at is null and new.left_at is not null then
    perform public.audit_write('workspace_member_left', null, new.workspace_id, jsonb_build_object('email', new.email));
  end if;
  return new;
end;
$$;

drop trigger if exists workspace_members_audit on public.workspace_members;
create trigger workspace_members_audit after insert or update of left_at on public.workspace_members
  for each row execute function public.audit_workspace_member();

-- Membres d'un projet : entrée, départ.
create or replace function public.audit_project_member()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  member_email text;
begin
  if tg_op = 'INSERT' then
    select u.email into member_email from auth.users u where u.id = new.user_id;
    perform public.audit_write('project_member_joined', new.project_id, null, jsonb_build_object('email', coalesce(member_email, ''), 'role', new.role));
    return new;
  end if;
  select u.email into member_email from auth.users u where u.id = old.user_id;
  -- Projet supprimé : ses membres partent avec lui, rien à journaliser.
  if exists (select 1 from public.projects p where p.id = old.project_id) then
    perform public.audit_write('project_member_left', old.project_id, null, jsonb_build_object('email', coalesce(member_email, '')));
  end if;
  return old;
end;
$$;

drop trigger if exists project_members_audit on public.project_members;
create trigger project_members_audit after insert or delete on public.project_members
  for each row execute function public.audit_project_member();
