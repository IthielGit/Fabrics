/**
 * Comparaison du quantitatif avec IfcOpenShell (M21, 21.6) : écrit les jeux d'échange (IFC4 de Pascal +
 * quantités de Fabrics) dans `tmp/ifc-exchange`, puis les compare avec `tools/ifc/compare_quantities.py`.
 * Rapport : `tmp/ifc-exchange/report.md`. Exige l'environnement Python de `tools/ifc` (voir son README).
 */
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'

const dir = 'tmp/ifc-exchange'
const python = process.platform === 'win32' ? 'tools/ifc/.venv/Scripts/python.exe' : 'tools/ifc/.venv/bin/python'
// `npx` passe par le shell sous Windows ; Python est lancé directement (chemin avec des « / »).
const run = (command, args, env, shell = false) =>
  spawnSync(command, args, { stdio: 'inherit', shell, env: { ...process.env, ...env } }).status ?? 1

if (!existsSync(python)) {
  console.error(`Python d'IfcOpenShell introuvable (${python}) : voir docs/05-INSTALLATION.md, « Contrôle IFC avec IfcOpenShell ».`)
  process.exit(1)
}
if (run('npx', ['vitest', 'run', 'src/features/measurements/quantities/ifcExchange.test.ts'], { FABRICS_IFC_EXCHANGE_DIR: dir }, process.platform === 'win32') !== 0) process.exit(1)
process.exit(run(python, ['-I', 'tools/ifc/compare_quantities.py', dir, '--report', `${dir}/report.md`]))
