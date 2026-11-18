// Vérification complète (M17, mécanisme anti-régression du roadmap) : `npm run check:all`.
//
// Enchaîne : build, lint (oxlint), tests Vitest (dont la baseline `src/baseline` et le test
// d'architecture `src/architecture.test.ts`), tests de Pascal (bun, comparés à leur référence) et
// lint de Pascal (Biome), puis détection de copier-coller dans `src/` (jscpd, accord de
// l'utilisateur le 2026-11-18). S'arrête au premier échec.
import { spawnSync } from 'node:child_process'

const STEPS = [
  // M18 : `src/features/scene/` importe la version compilée de `@pascal-app/core` (ADR 0002 § 5) ;
  // les tests de Pascal ont besoin de tous ses paquets compilés (comme la CI).
  ['Compilation des paquets de Pascal', ['run', 'build:pascal']],
  ['Build', ['run', 'build']],
  ['Lint Fabrics (oxlint)', ['run', 'lint']],
  ['Tests Fabrics (Vitest, baseline, architecture)', ['test']],
  ['Tests Pascal (bun)', ['run', 'test:pascal']],
  ['Lint Pascal (Biome)', ['run', 'lint:pascal']],
  ['Doublons de code (jscpd)', ['run', 'check:duplicates']],
]

const started = Date.now()
for (const [label, args] of STEPS) {
  console.log(`\n=== ${label} ===`)
  const t0 = Date.now()
  // Une seule chaîne de commande (arguments fixes) : `npm` trouvé par le shell, sans l'avertissement DEP0190.
  const result = spawnSync(['npm', ...args].join(' '), { stdio: 'inherit', shell: true })
  const seconds = Math.round((Date.now() - t0) / 1000)
  if (result.status !== 0) {
    console.error(`\n✗ ${label} : échec (${seconds} s). check:all arrêté.`)
    process.exit(result.status ?? 1)
  }
  console.log(`✓ ${label} (${seconds} s)`)
}
console.log(`\n✓ check:all réussi en ${Math.round((Date.now() - started) / 1000)} s`)
