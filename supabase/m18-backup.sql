-- M18 (plan, point 3 B) : sauvegarde complète avant la conversion des plans en scène Pascal.
-- À coller dans Supabase → SQL Editor, AVANT `npm run migrate:plans -- --apply`.
-- Le script de conversion vérifie que ces tables existent et ont autant de lignes que les originales.

create table if not exists public.projects_backup_m18 as table public.projects;
create table if not exists public.project_versions_backup_m18 as table public.project_versions;

-- Règle du projet : toute table a le Row Level Security activé. Aucune règle d'accès n'est créée :
-- seules la clé « service_role » et l'éditeur SQL peuvent lire ces copies.
alter table public.projects_backup_m18 enable row level security;
alter table public.project_versions_backup_m18 enable row level security;

-- Contrôle : les deux nombres de chaque ligne doivent être égaux.
select
  (select count(*) from public.projects) as projets,
  (select count(*) from public.projects_backup_m18) as projets_sauvegardes,
  (select count(*) from public.project_versions) as versions,
  (select count(*) from public.project_versions_backup_m18) as versions_sauvegardees;

-- Retour arrière complet (seulement si nécessaire, après accord) :
--   update public.projects p set document = b.document from public.projects_backup_m18 b where b.id = p.id;
