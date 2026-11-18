// Conversion de tous les projets Plan de Supabase au format scène Pascal (M18, plan point 3 B).
//
//   npm run migrate:plans               essai à blanc : lit tout, n'écrit rien, rapport par projet
//   npm run migrate:plans -- --apply    écrit les projets « prêts » (après l'accord de l'utilisateur)
//
// Variables (fichier .env.local, jamais versionné) : VITE_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY.
// La clé « service_role » contourne le Row Level Security : elle ne sert qu'ici, sur le poste de
// l'utilisateur, jamais dans l'application.
//
// Garde-fous :
// - `--apply` exige les tables de sauvegarde (supabase/m18-backup.sql) avec autant de lignes que
//   les originales ;
// - un projet n'est écrit que si ses métrés sont identiques avant et après (`migrateStoredPlan`) ;
// - l'écriture ne passe que si le projet n'a pas été modifié depuis sa lecture (`updated_at`).
import { createClient } from '@supabase/supabase-js'
import { mkdirSync, writeFileSync } from 'node:fs'
import type { StoredProject } from '../src/features/documents/migrations'
import { migrateStoredPlan } from '../src/features/scene/migrate/bulkMigration'

interface Row {
  id: string
  name: string
  kind: 'plan' | 'design'
  document: StoredProject['document']
  updated_at: string
}

const PAGE = 100

async function main(): Promise<number> {
  const apply = process.argv.includes('--apply')
  const { VITE_SUPABASE_URL: url, SUPABASE_SERVICE_ROLE_KEY: key } = process.env
  if (!url || !key) {
    console.error('Variables manquantes dans .env.local : VITE_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY.')
    return 2
  }
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })

  const count = async (table: string) => {
    const { count: n, error } = await db.from(table).select('id', { count: 'exact', head: true })
    if (error) throw new Error(`${table} : ${error.message}`)
    return n ?? 0
  }

  if (apply) {
    const checks: [string, string][] = [
      ['projects', 'projects_backup_m18'],
      ['project_versions', 'project_versions_backup_m18'],
    ]
    for (const [table, backup] of checks) {
      let original: number
      let saved: number
      try {
        ;[original, saved] = [await count(table), await count(backup)]
      } catch (error) {
        console.error(`Sauvegarde introuvable (${backup}) : lancez d'abord supabase/m18-backup.sql.`, error)
        return 2
      }
      if (original !== saved) {
        console.error(`Sauvegarde incomplète : ${table} = ${original} lignes, ${backup} = ${saved}.`)
        return 2
      }
    }
  }

  const report: Record<string, unknown>[] = []
  const totals = { ready: 0, written: 0, changedMeanwhile: 0, skipped: 0, refused: 0 }
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await db
      .from('projects')
      .select('id, name, kind, document, updated_at')
      .order('id')
      .range(from, from + PAGE - 1)
    if (error) throw error
    const rows = (data ?? []) as Row[]
    for (const row of rows) {
      const outcome = migrateStoredPlan(row)
      if (outcome.status === 'skipped') {
        totals.skipped += 1
        continue
      }
      if (outcome.status === 'refused') {
        totals.refused += 1
        report.push({ id: row.id, name: row.name, status: outcome.status, reason: outcome.reason, detail: outcome.detail })
        continue
      }
      totals.ready += 1
      let written = false
      if (apply) {
        const { data: updated, error: updateError } = await db
          .from('projects')
          .update({ document: outcome.document })
          .eq('id', row.id)
          .eq('updated_at', row.updated_at)
          .select('id')
        if (updateError) throw updateError
        written = (updated ?? []).length === 1
        if (written) totals.written += 1
        else totals.changedMeanwhile += 1
      }
      report.push({ id: row.id, name: row.name, status: apply ? (written ? 'written' : 'changed-meanwhile') : 'ready' })
    }
    if (rows.length < PAGE) break
  }

  mkdirSync('scripts/.reports', { recursive: true })
  const file = `scripts/.reports/migrate-plans-m18-${apply ? 'apply' : 'dry-run'}-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
  writeFileSync(file, `${JSON.stringify({ apply, totals, projects: report }, null, 2)}\n`)

  console.log(apply ? 'Conversion faite.' : 'Essai à blanc : rien n’a été écrit.')
  console.log(`Plans prêts : ${totals.ready} ; laissés intacts et signalés : ${totals.refused} ; autres (visuels, déjà convertis) : ${totals.skipped}`)
  if (apply) console.log(`Écrits : ${totals.written} ; modifiés pendant la conversion (à relancer) : ${totals.changedMeanwhile}`)
  console.log(`Rapport détaillé : ${file}`)
  return totals.refused > 0 ? 1 : 0
}

main().then(
  (code) => process.exit(code),
  (error) => {
    console.error(error)
    process.exit(2)
  },
)
