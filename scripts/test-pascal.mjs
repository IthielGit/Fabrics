// Tests de Pascal sous bun (M17, ADR 0002) : `npm run test:pascal`.
//
// Lance `bun run test` dans chaque paquet de packages/pascal qui a un script `test` (comme
// `turbo run test` de Pascal), puis les tests de scripts de sa racine. Compare la liste des tests en
// échec à la référence de la plateforme (packages/pascal/.fabrics/known-failures-<plateforme>.json,
// relevée dans le dossier d'origine de Pascal) :
//   - un nouvel échec  → code de sortie 1 ;
//   - un échec connu qui passe désormais → signalé (mettre la référence à jour, commit séparé).
// Options : --update (réécrit la référence), --only=<nom de paquet>.
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const COPY = join(import.meta.dirname, '..', 'packages', 'pascal')
// PASCAL_ROOT : lancer les mêmes tests dans le clone d'origine (pour relever la référence).
const ROOT = process.env.PASCAL_ROOT ?? COPY
const REF_DIR = join(COPY, '.fabrics')
const REF_FILE = join(REF_DIR, `known-failures-${process.platform}.json`)
const ROOT_TESTS = [
  'scripts/i18n.test.ts',
  'scripts/i18n-provider.test.ts',
  'scripts/i18n-literals.test.ts',
  'apps/editor/proxy.test.ts',
]

const args = process.argv.slice(2)
const update = args.includes('--update')
const only = args.find((a) => a.startsWith('--only='))?.slice('--only='.length)

function workspaces() {
  return ['packages', 'apps', 'tooling'].flatMap((group) => {
    const dir = join(ROOT, group)
    return readdirSync(dir, { withFileTypes: true })
      .filter((d) => d.isDirectory() && existsSync(join(dir, d.name, 'package.json')))
      .map((d) => {
        const path = join(dir, d.name)
        const pkg = JSON.parse(readFileSync(join(path, 'package.json'), 'utf8'))
        return { name: pkg.name, path, hasTest: Boolean(pkg.scripts?.test) }
      })
      .filter((w) => w.hasTest)
  })
}

/** Lance une commande bun et renvoie compteurs et noms des tests en échec. */
function run(label, cwd, bunArgs) {
  const t0 = Date.now()
  // Une seule chaîne de commande (arguments fixes, écrits dans ce fichier) : sous Windows, `bun` est
  // trouvé par le shell, sans l'avertissement DEP0190 de Node.
  const result = spawnSync(['bun', ...bunArgs].join(' '), { cwd, encoding: 'utf8', shell: true, maxBuffer: 512 * 1024 * 1024 })
  const output = `${result.stdout ?? ''}\n${result.stderr ?? ''}`
  const count = (word) => {
    const matches = [...output.matchAll(new RegExp(`^\\s*(\\d+) ${word}\\s*$`, 'gm'))]
    return matches.reduce((sum, m) => sum + Number(m[1]), 0)
  }
  const failures = new Set(
    [...output.matchAll(/^\(fail\) (.+?)(?: \[[\d.]+m?s\])?\s*$/gm)].map((m) => `${label} › ${m[1]}`),
  )
  const seconds = Math.round((Date.now() - t0) / 1000)
  const summary = { label, pass: count('pass'), fail: count('fail'), skip: count('skip'), seconds, exit: result.status }
  console.log(`${label.padEnd(32)} ${String(summary.pass).padStart(5)} ok  ${String(summary.fail).padStart(3)} échecs  ${String(summary.skip).padStart(3)} ignorés  ${seconds} s`)
  if (summary.exit !== 0 && summary.fail === 0) {
    // Échec sans test en échec : erreur de chargement ou de compilation, toujours bloquante.
    failures.add(`${label} › (erreur d'exécution, code ${summary.exit})`)
    console.log(output.split('\n').slice(-20).join('\n'))
  }
  return { summary, failures }
}

const results = []
for (const w of workspaces()) {
  if (only && w.name !== only) continue
  results.push(run(w.name, w.path, ['run', 'test']))
}
if (!only) results.push(run('pascal (scripts racine)', ROOT, ['test', ...ROOT_TESTS]))

const failures = [...new Set(results.flatMap((r) => [...r.failures]))].sort()
const total = results.reduce(
  (acc, r) => ({ pass: acc.pass + r.summary.pass, fail: acc.fail + r.summary.fail, skip: acc.skip + r.summary.skip }),
  { pass: 0, fail: 0, skip: 0 },
)
console.log(`\nTotal : ${total.pass} réussis, ${total.fail} en échec, ${total.skip} ignorés`)

if (update) {
  mkdirSync(REF_DIR, { recursive: true })
  writeFileSync(REF_FILE, `${JSON.stringify({ platform: process.platform, total, failures }, null, 2)}\n`)
  console.log(`Référence écrite : ${REF_FILE}`)
  process.exit(0)
}

if (!existsSync(REF_FILE)) {
  console.log(`Aucune référence pour ${process.platform} : tout échec est bloquant.`)
  process.exit(failures.length ? 1 : 0)
}
const known = new Set(JSON.parse(readFileSync(REF_FILE, 'utf8')).failures)
const scope = (name) => !only || name.startsWith(`${only} ›`)
const unexpected = failures.filter((f) => !known.has(f))
const fixed = [...known].filter((f) => scope(f) && !failures.includes(f))
if (fixed.length) {
  console.log(`\n${fixed.length} échec(s) connu(s) qui passent désormais (référence à mettre à jour) :`)
  for (const f of fixed) console.log(`  + ${f}`)
}
if (unexpected.length) {
  console.log(`\n${unexpected.length} NOUVEL(S) ÉCHEC(S) par rapport à la référence :`)
  for (const f of unexpected) console.log(`  - ${f}`)
  process.exit(1)
}
console.log('\nRésultats identiques à la référence de Pascal.')
