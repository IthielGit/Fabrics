// Contrôle des scripts SQL de Supabase (M23) : `npm run check:sql`, lancé aussi par `npm run check:all`.
//
// Exécute `supabase/schema.sql` puis `supabase/m23-pricing.sql` (deux fois : il doit être relançable)
// dans PGlite, un vrai Postgres qui tourne dans Node (dépendance de développement, accord de
// l'utilisateur le 2026-11-27). Supabase est imité au plus juste : rôles `anon` et `authenticated`,
// schéma `auth` (comptes et `auth.uid()`), `storage`, droits par défaut du schéma public. Les règles
// d'accès (RLS) sont ensuite vérifiées avec trois comptes : A (admin), B (invité), C (étranger).
// Aucune donnée réelle, aucune connexion réseau.
import { PGlite } from '@electric-sql/pglite'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const repo = join(import.meta.dirname, '..')
const db = new PGlite()

const A = '00000000-0000-0000-0000-00000000000a'
const B = '00000000-0000-0000-0000-00000000000b'
const C = '00000000-0000-0000-0000-00000000000c'

await db.exec(`
  create role anon nologin; create role authenticated nologin; create role service_role nologin;
  create schema auth; create schema extensions; create schema storage;
  create function extensions.gen_random_bytes(n int) returns bytea language sql volatile as
    $$ select decode(string_agg(lpad(to_hex((random() * 255)::int), 2, '0'), ''), 'hex') from generate_series(1, n) $$;
  create table auth.users (id uuid primary key, email text);
  insert into auth.users values ('${A}', 'a@test'), ('${B}', 'b@test'), ('${C}', 'c@test');
  create function auth.uid() returns uuid language sql stable as
    $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
  create table storage.objects (id uuid default gen_random_uuid(), bucket_id text, name text, owner uuid);
  create function storage.foldername(name text) returns text[] language sql as $$ select string_to_array(name, '/') $$;
  alter table storage.objects enable row level security;
  grant usage on schema public, auth, extensions to anon, authenticated;
  grant execute on function auth.uid() to anon, authenticated;
  -- Droits par défaut de Supabase sur le schéma public (les scripts les restreignent ensuite).
  alter default privileges in schema public grant all on tables to anon, authenticated;
  alter default privileges in schema public grant all on sequences to anon, authenticated;
  alter default privileges in schema public grant execute on functions to anon, authenticated;
`)
// Schéma principal de l'application (projets, membres…), sans les extensions absentes de PGlite.
await db.exec(readFileSync(`${repo}/supabase/schema.sql`, 'utf8').replace(/^create extension.*$/gim, '').replace(/^alter publication.*$/gim, ''))
const script = readFileSync(`${repo}/supabase/m23-pricing.sql`, 'utf8')
await db.exec(script)
await db.exec(script) // relançable sans erreur
// M24, 24.3 : journal d'audit, chargé avant les essais pour que ses déclencheurs les enregistrent.
const audit = readFileSync(`${repo}/supabase/m24-audit.sql`, 'utf8')
await db.exec(audit)
await db.exec(audit) // relançable sans erreur

let failures = 0
const check = (label, ok, detail = '') => {
  console.log(`${ok ? 'OK ' : 'ÉCHEC'} ${label}${detail ? ` — ${detail}` : ''}`)
  if (!ok) failures++
}

async function as(uid, sql, params = []) {
  await db.exec(`reset role; select set_config('request.jwt.claim.sub', '${uid}', false); set role authenticated;`)
  try {
    return await db.query(sql, params)
  } finally {
    await db.exec('reset role;')
  }
}
async function fails(uid, sql, params = []) {
  try {
    await as(uid, sql, params)
    return null
  } catch (e) {
    return e.message
  }
}

const ws = (await as(A, `select public.create_workspace('Entreprise A') as r`)).rows[0].r
check('A crée un espace et en est admin', ws.role === 'admin')
const wsId = ws.id
const lib = (await as(A, `select id, vat_rate_bp, currency from public.price_libraries where workspace_id = $1`, [wsId])).rows[0]
check('bibliothèque créée en Ar, TVA 20 %', lib?.vat_rate_bp === 2000 && lib.currency === 'MGA')

const ins = await as(
  A,
  `insert into public.price_items (library_id, kind, designation, unit, source_basis, source_price, price_ht)
   values ($1, 'material', 'Ciment', 'Sac', 'ttc_delivered', 420000, 350000) returning id, workspace_id, updated_by_email`,
  [lib.id],
)
const itemId = ins.rows[0].id
check('A (admin) ajoute une ligne ; espace et auteur posés par la base', ins.rows[0].workspace_id === wsId && ins.rows[0].updated_by_email === 'a@test')
await as(A, `insert into public.work_items (library_id, designation, unit, price_ht, components) values ($1, 'Poste', 'm²', 450000, '[]')`, [lib.id])

check('C (étranger) ne voit ni l’espace ni les prix', (await as(C, `select * from public.price_items`)).rows.length === 0 && (await as(C, `select * from public.workspaces`)).rows.length === 0)
check('C ne voit pas l’historique', (await as(C, `select * from public.price_history`)).rows.length === 0)
check('C ne peut pas écrire dans la bibliothèque de A', (await fails(C, `insert into public.price_items (library_id, kind, designation, unit) values ($1, 'material', 'X', 'U')`, [lib.id])) !== null)
check('C ne peut pas inviter dans l’espace de A', (await fails(C, `select public.create_workspace_invite($1, 'member')`, [wsId])) !== null)

const invite = (await as(A, `select public.create_workspace_invite($1, 'member') as r`, [wsId])).rows[0].r
const joined = (await as(B, `select public.accept_workspace_invite($1) as r`, [invite.token])).rows[0].r
check('B rejoint avec le lien « membre »', joined.status === 'ok' && joined.role === 'member')
check('B (membre) voit les prix', (await as(B, `select * from public.price_items`)).rows.length === 1)
check('B voit les membres de l’espace', (await as(B, `select email from public.workspace_members order by email`)).rows.map((r) => r.email).join() === 'a@test,b@test')
check('B ne peut pas ajouter de ligne', (await fails(B, `insert into public.price_items (library_id, kind, designation, unit) values ($1, 'material', 'X', 'U')`, [lib.id])) !== null)
const upd = await as(B, `update public.price_items set price_ht = 1 where id = $1`, [itemId])
check('B ne peut pas modifier un prix', upd.affectedRows === 0)
const del = await as(B, `delete from public.price_items where id = $1`, [itemId])
check('B ne peut pas supprimer une ligne', del.affectedRows === 0)
check('B ne peut pas changer la TVA', (await fails(B, `select public.set_library_vat_rate($1, 0)`, [lib.id])) !== null)
check('B ne peut pas changer la TVA par la table', (await fails(B, `update public.price_libraries set vat_rate_bp = 0`)) !== null)
check('A ne peut pas écrire la TVA directement (seulement par la fonction)', (await fails(A, `update public.price_libraries set vat_rate_bp = 0`)) !== null)
check('B ne peut pas écrire dans l’historique', (await fails(B, `insert into public.price_history (workspace_id, item_table, item_id, action) values ($1, 'price_items', $2, 'insert')`, [wsId, itemId])) !== null)

await as(A, `select public.set_library_vat_rate($1, 1000)`, [lib.id])
const after = (await as(A, `select price_ht from public.price_items where id = $1`, [itemId])).rows[0].price_ht
check('TVA 10 % : le HT de la ligne TTC est recalculé (42 000 ÷ 1,1 = 38 181,8)', String(after) === '381818', String(after))

await as(A, `update public.price_items set price_ht = 360000, source_price = null, source_basis = 'ht' where id = $1`, [itemId])
const hist = (await as(B, `select action, old_price_ht, new_price_ht, changed_by_email from public.price_history where item_id = $1 order by id`, [itemId])).rows
check('historique : ajout, TVA, modification, avec auteur', hist.map((h) => `${h.action}:${h.old_price_ht}>${h.new_price_ht}:${h.changed_by_email}`).join(' ') === 'insert:null>350000:a@test update:350000>381818:a@test update:381818>360000:a@test', JSON.stringify(hist))

check('le dernier admin ne peut pas partir', (await fails(A, `select public.remove_workspace_member($1, $2)`, [wsId, A]))?.includes('last admin') === true)
check('le dernier admin ne peut pas devenir membre', (await fails(A, `select public.set_workspace_member_role($1, $2, 'member')`, [wsId, A]))?.includes('last admin') === true)
check('B (membre) ne peut pas changer les rôles', (await fails(B, `select public.set_workspace_member_role($1, $2, 'admin')`, [wsId, B])) !== null)
await as(A, `select public.set_workspace_member_role($1, $2, 'admin')`, [wsId, B])
await as(A, `select public.remove_workspace_member($1, $2)`, [wsId, A])
check('A a quitté : il ne voit plus rien', (await as(A, `select * from public.price_items`)).rows.length === 0)
check('les modifications de A restent dans l’historique', (await as(B, `select count(*)::int as n from public.price_history where changed_by_email = 'a@test'`)).rows[0].n === 4)
check('A n’apparaît plus dans les membres', (await as(B, `select email from public.workspace_members`)).rows.map((r) => r.email).join() === 'b@test')

await as(B, `update public.workspace_invites set active = false where id = $1`, [invite.id])
const reuse = (await as(C, `select public.accept_workspace_invite($1) as r`, [invite.token])).rows[0].r
check('un lien désactivé ne fait entrer personne', reuse.status === 'unavailable')
const back = (await as(B, `select public.create_workspace_invite($1, 'member') as r`, [wsId])).rows[0].r
const rejoin = (await as(A, `select public.accept_workspace_invite($1) as r`, [back.token])).rows[0].r
check('un ancien membre peut revenir avec un nouveau lien', rejoin.status === 'ok' && (await as(A, `select * from public.price_items`)).rows.length === 1)
check('anonyme : aucun accès', (await fails('', `select * from public.price_items`)) !== null || (await as('', `select * from public.price_items`)).rows.length === 0)

// ---- 23.2 : import atomique
const libB = (await as(B, `select id, version from public.price_libraries where workspace_id = $1`, [wsId])).rows[0]
const manualCount = (await as(B, `select count(*)::int as n from public.price_items`)).rows[0].n
const ins1 = JSON.stringify([
  { kind: 'material', code: '9.1', category: 'C', designation: 'Importé', unit: 'Sac', source_basis: 'ttc_delivered', source_price: '420000', vat_exempt: false, price_ht: '350000', supplier: '', region: 'Antananarivo', effective_date: '2026-10-01', details: { a: 'b' }, source_row: 'MTX!6', source_key: 'MTX:9.1' },
])
const insW = JSON.stringify([
  { code: 'CAT-01-001', category: 'X', designation: 'Poste importé', unit: 'm²', price_ht: '78447667', reference_price: '86293000', source_coefficient: '1.1', output: '1', components: [{ group: 'labour', amountHt: '10' }], source_row: 'T!4', source_key: 'TRAV:CAT-01-001' },
])
const args = (version, ins, upd, del, insWork, updWork, delWork) => [libB.id, version, '2026-10-01', 'f.xlsx', 'abc', JSON.stringify({ added: 2 }), ins, upd, del, insWork, updWork, delWork]
const CALL = `select public.apply_price_import($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, $8::jsonb, $9::uuid[], $10::jsonb, $11::jsonb, $12::uuid[]) as v`
check('un membre ne peut pas importer', (await fails(A, CALL, args(libB.version, ins1, '[]', '{}', insW, '[]', '{}'))) !== null)
const v1 = (await as(B, CALL, args(libB.version, ins1, '[]', '{}', insW, '[]', '{}'))).rows[0].v
const imported = (await as(B, `select id, price_ht, source_price, details from public.price_items where source_key = 'MTX:9.1'`)).rows[0]
const work = (await as(B, `select id, price_ht, components from public.work_items where source_key = 'TRAV:CAT-01-001'`)).rows[0]
check('import appliqué : version +1, prix texte relus en entiers exacts', v1 === libB.version + 1 && String(imported.price_ht) === '350000' && String(work.price_ht) === '78447667', `${v1} ${imported.price_ht} ${work.price_ht}`)
check('date des prix posée par l’import', String((await as(B, `select price_date::text as d from public.price_libraries where id = $1`, [libB.id])).rows[0].d) === '2026-10-01')
check('import sur une version dépassée refusé', (await fails(B, CALL, args(libB.version, ins1, '[]', '{}', '[]', '[]', '{}')))?.includes('stale version') === true)
const updImport = JSON.stringify([{ id: imported.id, kind: 'material', code: '9.1', category: 'C', designation: 'Importé', unit: 'Sac', source_basis: 'ttc_delivered', source_price: '480000', vat_exempt: false, price_ht: '400000', supplier: '', region: 'Antananarivo', effective_date: '2026-10-01', details: {}, source_row: 'MTX!6', source_key: 'MTX:9.1' }])
const manualId = (await as(B, `select id from public.price_items where source_key = '' limit 1`)).rows[0].id
const v2 = (await as(B, CALL, args(v1, '[]', updImport, `{${manualId}}`, '[]', '[]', `{${work.id}}`))).rows[0].v
check('réimport : mise à jour sur la même ligne, historique de l’ancien prix', v2 === v1 + 1 && (await as(B, `select old_price_ht, new_price_ht from public.price_history where item_id = $1 and action = 'update'`, [imported.id])).rows.some((h) => String(h.old_price_ht) === '350000' && String(h.new_price_ht) === '400000'))
check('une ligne saisie à la main n’est jamais retirée par un import', (await as(B, `select count(*)::int as n from public.price_items where source_key = ''`)).rows[0].n === manualCount)
check('un poste importé absent est retiré', (await as(B, `select count(*)::int as n from public.work_items where id = $1`, [work.id])).rows[0].n === 0)
const batches = (await as(B, `select version, file_name, imported_by_email from public.price_import_batches order by version`)).rows
check('journal des imports', batches.length === 2 && batches[0].imported_by_email === 'b@test', JSON.stringify(batches))
check('C ne voit pas le journal des imports', (await as(C, `select * from public.price_import_batches`)).rows.length === 0)

// ---- 23.3 : règles
const wid = (await as(B, `insert into public.work_items (library_id, designation, unit, price_ht) values ($1, 'Poste règle', 'm²', 1) returning id`, [libB.id])).rows[0].id
check('un membre ne peut pas créer de règle', (await fails(A, `insert into public.pricing_rules (library_id, quantity_code, work_item_id) values ($1, 'wall.netArea', $2)`, [libB.id, wid])) !== null)
const rid = (await as(B, `insert into public.pricing_rules (library_id, name, quantity_code, filter, work_item_id, waste_bp) values ($1, 'R', 'wall.netArea', '{"wallMaterial":"brick"}', $2, 500) returning id, workspace_id`, [libB.id, wid])).rows[0]
check('un admin crée une règle ; espace posé par la base', rid.workspace_id === wsId)
check('un membre lit les règles', (await as(A, `select * from public.pricing_rules`)).rows.length === 1)
check('C ne lit pas les règles', (await as(C, `select * from public.pricing_rules`)).rows.length === 0)
check('code de quantité invalide refusé', (await fails(B, `insert into public.pricing_rules (library_id, quantity_code) values ($1, 'drop table')`, [libB.id])) !== null)
await as(B, `delete from public.work_items where id = $1`, [wid])
check('poste retiré : la règle reste, sans poste', (await as(B, `select work_item_id from public.pricing_rules where id = $1`, [rid.id])).rows[0].work_item_id === null)

// ---- 23.5 : devis et versions
const proj = (await as(B, `insert into public.projects (name, kind, document) values ('P', 'plan', '{}') returning id`)).rows[0].id
const other = (await as(C, `insert into public.projects (name, kind, document) values ('Q', 'plan', '{}') returning id`)).rows[0].id
check('un admin ne crée pas le devis d’un projet auquel il n’a pas accès', (await fails(B, `insert into public.estimates (library_id, project_id) values ($1, $2)`, [libB.id, other])) !== null)
const est = (await as(B, `insert into public.estimates (library_id, project_id, a1_bp) values ($1, $2, 700) returning id, workspace_id`, [libB.id, proj])).rows[0]
check('devis créé, rattaché à l’espace', est.workspace_id === wsId)
check('un membre ne crée pas de devis', (await fails(A, `insert into public.estimates (library_id, project_id) values ($1, $2)`, [libB.id, other])) !== null)
const snap = (n) => JSON.stringify({ lines: [{ code: 'CAT-1', designation: 'Poste', category: 'Lot', unit: 'm²', quantity: '1311', quantityDecimals: 2, unitPriceHt: '450000', salePriceHt: '450000', amountHt: '5900000' }], totalHt: '5900000', vat: '1180000', totalTtc: '7080000', debours: '5900000', settings: {}, linesWithoutPrice: n, provisionalLines: 0 })
const FREEZE = `select public.freeze_estimate_version($1, $2, 3, 'abc', $3::jsonb, '') as v`
check('un membre ne fige pas de version', (await fails(A, FREEZE, [est.id, 'draft', snap(0)])) !== null)
const v1e = (await as(B, FREEZE, [est.id, 'draft', snap(0)])).rows[0].v
const v2e = (await as(B, FREEZE, [est.id, 'final', snap(0)])).rows[0].v
check('versions numérotées 1, 2 ; totaux relus du devis figé', v1e.number === 1 && v2e.number === 2 && String(v2e.total_ht) === '5900000')
check('un poste sans prix empêche le devis définitif (base)', (await fails(B, FREEZE, [est.id, 'final', snap(1)])) !== null)
check('une version figée ne se modifie pas', (await fails(B, `update public.estimate_versions set total_ht = 1 where estimate_id = $1`, [est.id])) !== null)
check('une version figée ne se supprime pas', (await fails(B, `delete from public.estimate_versions where estimate_id = $1`, [est.id])) !== null)
check('un membre de l’espace lit les versions', (await as(A, `select * from public.estimate_versions`)).rows.length === 2)
await db.exec(`insert into public.project_members (project_id, user_id, role) values ('${proj}', '${C}', 'viewer')`)
check('C (hors espace) ne lit ni devis ni versions', (await as(C, `select * from public.estimates`)).rows.length === 0 && (await as(C, `select * from public.estimate_versions`)).rows.length === 0)
const outline = (await as(C, `select public.project_estimate_outline($1) as o`, [proj])).rows[0].o
check('C voit postes et quantités, sans aucun prix (D23-8)', outline.length === 1 && outline[0].quantity === '1311' && !JSON.stringify(outline).includes('450000') && !JSON.stringify(outline).includes('5900000'), JSON.stringify(outline))
check('sans accès au projet, pas de résumé', (await fails(C, `select public.project_estimate_outline($1)`, [(await as(B, `insert into public.projects (name, kind, document) values ('R', 'plan', '{}') returning id`)).rows[0].id])) !== null)

// ---- M24 24.3 : journal d'audit (D24-4)
const LOG = `select public.log_audit_event($1, $2, $3::jsonb)`
await as(B, LOG, ['export', proj, '{"format":"pdf"}'])
await as(C, LOG, ['backup', proj, '{}']) // C est lecteur du projet : il peut sauvegarder
const projEvents = (await as(B, `select kind, actor_email from public.audit_events where project_id = $1 order by id`, [proj])).rows
check('journal du projet (propriétaire) : versions figées, entrée de C, export, sauvegarde', projEvents.map((e) => (e.kind === 'project_member_joined' ? e.kind : `${e.kind}:${e.actor_email}`)).join(' ') === 'estimate_draft:b@test estimate_final:b@test project_member_joined export:b@test backup:c@test', JSON.stringify(projEvents))
check('un lecteur du projet ne lit pas son journal', (await as(C, `select * from public.audit_events where project_id = $1`, [proj])).rows.length === 0)
check('sans accès au projet, rien n’est journalisé', (await fails(A, LOG, ['export', proj, '{}'])) !== null)
check('type d’événement non permis refusé', (await fails(B, LOG, ['estimate_final', proj, '{}'])) !== null)
check('écriture directe dans le journal refusée', (await fails(B, `insert into public.audit_events (project_id, kind) values ($1, 'export')`, [proj])) !== null)
check('le journal ne se modifie ni ne s’efface', (await fails(B, `update public.audit_events set kind = 'export'`)) !== null && (await fails(B, `delete from public.audit_events`)) !== null)
const wsEvents = (await as(B, `select kind, details->>'email' as email from public.audit_events where workspace_id = $1 and kind like 'workspace%' order by id`, [wsId])).rows
check('journal de l’espace (admin) : entrées et sorties de membres', wsEvents.some((e) => e.kind === 'workspace_member_joined' && e.email === 'b@test') && wsEvents.some((e) => e.kind === 'workspace_member_left' && e.email === 'a@test'), JSON.stringify(wsEvents))
check('un membre (non admin) ne lit pas le journal de l’espace', (await as(A, `select * from public.audit_events where workspace_id = $1`, [wsId])).rows.length === 0)
await db.exec(`insert into public.audit_events (occurred_at, project_id, kind) values (now() - interval '13 months', '${proj}', 'export')`)
await as(B, LOG, ['restore', proj, '{}'])
check('événements de plus d’un an effacés', (await as(B, `select count(*)::int as n from public.audit_events where occurred_at < now() - interval '1 year'`)).rows[0].n === 0)

console.log(failures === 0 ? '\nTout est conforme.' : `\n${failures} échec(s).`)
process.exit(failures === 0 ? 0 : 1)
