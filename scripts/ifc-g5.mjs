/**
 * Contrôle du gate G5 (M22, 22.5) : écrit l'IFC4 exporté par Fabrics pour HOUSE-01, HOUSE-02, le plan
 * d'exemple et la grande maison dans `tmp/ifc-g5`, puis les fait relire par IfcOpenShell
 * (`tools/ifc/check_g5.py` : schéma, IDS `tools/ifc/fabrics-g5.ids`, quantités ↔ géométrie, niveaux,
 * matériaux, classification). Rapport : `tmp/ifc-g5/report.md`. Exige l'environnement Python de
 * `tools/ifc` (voir `docs/05-INSTALLATION.md`).
 */
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'

const dir = 'tmp/ifc-g5'
const python = process.platform === 'win32' ? 'tools/ifc/.venv/Scripts/python.exe' : 'tools/ifc/.venv/bin/python'
// `npx` passe par le shell sous Windows ; Python est lancé directement (chemin avec des « / »).
const run = (command, args, env, shell = false) =>
  spawnSync(command, args, { stdio: 'inherit', shell, env: { ...process.env, ...env } }).status ?? 1

if (!existsSync(python)) {
  console.error(`Python d'IfcOpenShell introuvable (${python}) : voir docs/05-INSTALLATION.md, « Contrôle IFC avec IfcOpenShell ».`)
  process.exit(1)
}
if (run('npx', ['vitest', 'run', 'src/features/ifc/g5Files.test.ts'], { FABRICS_IFC_G5_DIR: dir }, process.platform === 'win32') !== 0) process.exit(1)
process.exit(run(python, ['-I', 'tools/ifc/check_g5.py', dir, '--ids', 'tools/ifc/fabrics-g5.ids', '--report', `${dir}/report.md`]))
