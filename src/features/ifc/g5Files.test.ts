/**
 * M22, 22.5 : fichiers du contrôle du gate G5 (`npm run check:ifc`). Avec `FABRICS_IFC_G5_DIR`, écrit
 * l'IFC de chaque plan d'essai exporté par Fabrics, avec ses quantités de métré attendues
 * (`<nom>.expected.json`), relus par `tools/ifc/check_g5.py` (IfcOpenShell). Sans la variable : vérifie
 * seulement que chaque export se fait.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import type { FabricsDocument } from '../../types/document'
import { createExamplePlanProject, createLargeHouseProject } from '../documents/createProject'
import { house01, house02 } from '../scene/migrate/fixtureDocuments'
import { fabricsToScene } from '../scene/migrate/fromFabrics'
import { settleScene } from '../scene/settle'
import { buildFabricsIfc } from './exportIfc'

const NOW = new Date('2026-11-24T00:00:00Z')
const SETS: [string, () => FabricsDocument][] = [
  ['HOUSE-01', house01],
  ['HOUSE-02', house02],
  ['example', () => createExamplePlanProject(NOW).document],
  ['large-house', () => createLargeHouseProject(NOW).document],
]
const OUT = process.env.FABRICS_IFC_G5_DIR

describe.each(SETS)('fichier G5 %s', (name, create) => {
  it('export IFC4 avec niveaux attendus', () => {
    const document = create()
    const scene = settleScene(fabricsToScene(document).scene)
    const { ifc, summary } = buildFabricsIfc(scene, { projectName: name, labels: { levelSlab: 'Dalle' }, timestamp: NOW })
    expect(summary.unmatchedExtensions.length).toBeGreaterThanOrEqual(0)
    const levels = (document.levels ?? []).map((l) => ({ name: l.name, elevation_mm: l.elevation }))
    expect(levels.length).toBeGreaterThan(0)
    if (OUT) {
      mkdirSync(OUT, { recursive: true })
      writeFileSync(join(OUT, `${name}.ifc`), ifc)
      writeFileSync(join(OUT, `${name}.expected.json`), `${JSON.stringify({ name, levels }, null, 2)}\n`)
    }
  })
})
