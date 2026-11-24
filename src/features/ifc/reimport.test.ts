/**
 * M22, 22.5 (gate G5) : réimport et comparaison. Un plan exporté en IFC puis réimporté dans Fabrics
 * (conversion de Pascal, web-ifc) redonne les mêmes niveaux et les mêmes métrés : longueurs exactes,
 * quantités simples à moins de 0,1 % (D21-6). Seul écart attendu : la marge de 0,2 mm laissée entre
 * une dalle de niveau et les murs qu'elle contourne (`levelSlabNode.ts`).
 * Ce qui n'est pas exporté sans vue 3D (toitures, escaliers, mobilier) n'est pas comparé ici. Limite
 * connue : la trémie d'un escalier revient comme trou de dalle ; la surface nette des pièces ne la déduit
 * plus (pas comparée, voir « Idées »).
 */
import { describe, expect, it } from 'vitest'
import type { FabricsDocument } from '../../types/document'
import { createExamplePlanProject, createLargeHouseProject } from '../documents/createProject'
import { computeQuantities, sumQuantity } from '../measurements/quantities/quantitySet'
import type { QuantityCode } from '../measurements/quantities/types'
import { house01, house02 } from '../scene/migrate/fixtureDocuments'
import { fabricsToScene } from '../scene/migrate/fromFabrics'
import { settleScene } from '../scene/settle'
import { sceneToFabricsView } from '../scene/view/toFabricsView'
import { buildFabricsIfc } from './exportIfc'
import { importIfc } from './importIfc'

const WASM = `${process.cwd()}/packages/pascal/node_modules/web-ifc/`.split(String.fromCharCode(92)).join('/')
const NOW = new Date('2026-11-17T00:00:00Z')
const SETS: [string, () => FabricsDocument][] = [
  ['HOUSE-01', house01],
  ['HOUSE-02', house02],
  ['plan d’exemple', () => createExamplePlanProject(NOW).document],
  ['grande maison', () => createLargeHouseProject(NOW).document],
]
/** Quantités comparées et écart relatif permis. */
const EXACT: QuantityCode[] = ['wall.length', 'wall.grossArea', 'wall.openingsArea', 'wall.netArea', 'wall.netVolume', 'opening.count', 'opening.area', 'room.area', 'room.perimeter']
const WITHIN_TOLERANCE: QuantityCode[] = ['slab.area', 'slab.volume']

describe.each(SETS)('réimport de %s', (_name, create) => {
  it('mêmes niveaux, mêmes métrés (murs, ouvertures, pièces exacts ; dalles à moins de 0,1 %)', async () => {
    const scene = settleScene(fabricsToScene(create()).scene)
    const view = sceneToFabricsView(scene)
    const before = computeQuantities({ document: view, scene }).geometric
    const { ifc } = buildFabricsIfc(scene, { projectName: 'Essai', labels: { levelSlab: 'Dalle' }, timestamp: NOW })
    const { scene: back } = await importIfc(new TextEncoder().encode(ifc), { wasmPath: WASM })
    const backView = sceneToFabricsView(back)
    const after = computeQuantities({ document: backView, scene: back }).geometric

    const levels = (doc: FabricsDocument) => (doc.levels ?? []).map((l) => [l.name, l.elevation, l.height])
    expect(levels(backView)).toEqual(levels(view))
    for (const code of EXACT) expect(sumQuantity(after, code), code).toBeCloseTo(sumQuantity(before, code), 0)
    for (const code of WITHIN_TOLERANCE) {
      const expected = sumQuantity(before, code)
      expect(Math.abs(sumQuantity(after, code) - expected) / expected, code).toBeLessThan(0.001)
    }
  }, 120000)
})
