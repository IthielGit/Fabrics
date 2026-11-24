/**
 * Comparaison du quantitatif avec un IFC (M21, 21.6, D21-7). Le fichier IFC4 est produit par
 * l'exportateur de Pascal (`ifc-converter`, chargé depuis ses sources : il ne sera branché dans
 * l'application qu'en M22). Ici : chaque élément quantifié se retrouve dans l'IFC.
 *
 * Avec `FABRICS_IFC_EXCHANGE_DIR`, le test écrit aussi pour chaque jeu `<nom>.ifc` et
 * `<nom>.quantities.json`, que `tools/ifc/compare_quantities.py` relit avec IfcOpenShell
 * (`npm run check:ifc-quantities`).
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import type { FabricsDocument } from '../../../types/document'
import { createExamplePlanProject, createLargeHouseProject } from '../../documents/createProject'
import { house01, house02 } from '../../scene/migrate/fixtureDocuments'
import { fabricsToScene } from '../../scene/migrate/fromFabrics'
import type { PlanScene } from '../../scene/sceneTypes'
import { settleScene } from '../../scene/settle'
import { sceneToFabricsView } from '../../scene/view/toFabricsView'
import { exchangeSet } from './ifcExchange'

interface IfcExporter {
  exportSceneToIfc: (input: { nodes: Record<string, unknown>; timestamp?: Date; projectName?: string }) => string
}

// Chargé par un chemin calculé : TypeScript ne vérifie pas le code de Pascal avec les règles de Fabrics.
const EXPORTER = ['..', '..', '..', '..', 'packages', 'pascal', 'packages', 'ifc-converter', 'src', 'export', 'index.ts'].join('/')
const loadExporter = () => import(/* @vite-ignore */ EXPORTER) as Promise<IfcExporter>

const NOW = new Date('2026-11-17T00:00:00Z')
const SETS: [string, () => FabricsDocument][] = [
  ['HOUSE-01', house01],
  ['HOUSE-02', house02],
  ['example', () => createExamplePlanProject(NOW).document],
  ['large-house', () => createLargeHouseProject(NOW).document],
]

const OUT = process.env.FABRICS_IFC_EXCHANGE_DIR

describe.each(SETS)('jeu d’échange %s : quantitatif ↔ IFC4 de Pascal', (name, create) => {
  const scene: PlanScene = settleScene(fabricsToScene(create()).scene)
  const document = sceneToFabricsView(scene)
  const set = exchangeSet(name, document, scene)

  it('chaque mur, ouverture et pièce quantifié se retrouve dans l’IFC (propriété Pascal.NodeId)', async () => {
    const { exportSceneToIfc } = await loadExporter()
    const ifc = exportSceneToIfc({ nodes: scene.nodes, timestamp: NOW, projectName: name })
    const exported = new Set([...ifc.matchAll(/IFCIDENTIFIER\('([^']+)'\)/g)].map((m) => m[1]))
    const missing = Object.entries(set.nodeToElement)
      .filter(([node]) => !exported.has(node))
      .map(([node, id]) => `${set.elements[id].name} (${node})`)
    expect(missing).toEqual([])
    expect(Object.keys(set.elements).length).toBeGreaterThan(0)
    if (OUT) {
      mkdirSync(OUT, { recursive: true })
      writeFileSync(join(OUT, `${name}.ifc`), ifc)
      writeFileSync(join(OUT, `${name}.quantities.json`), `${JSON.stringify(set, null, 2)}\n`)
    }
  })
})
