/**
 * M22, 22.2 : export IFC4 d'un plan par l'exportateur de Pascal, avec les ajouts de Fabrics
 * (contour des pièces, dalle de niveau, quantités de M21, propriété `Fabrics`, Uniclass).
 */
import { describe, expect, it } from 'vitest'
import type { CanvasElement, FabricsDocument, Level } from '../../types/document'
import { createExamplePlanProject, createLargeHouseProject } from '../documents/createProject'
import { computeQuantities } from '../measurements/quantities/quantitySet'
import { house01, house02, planDocument, spec } from '../scene/migrate/fixtureDocuments'
import { fabricsToScene } from '../scene/migrate/fromFabrics'
import { settleScene } from '../scene/settle'
import { polygonAreaM2 } from '../scene/siteMeasures'
import { sceneToFabricsView } from '../scene/view/toFabricsView'
import { ifcClassOf } from './classes'
import { buildFabricsIfc, LEVEL_SLAB_NODE_PREFIX } from './exportIfc'
import { wallSegmentQuantities } from './segmentQuantities'

const NOW = new Date('2026-11-17T00:00:00Z')
const LABELS = { levelSlab: 'Dalle' }
const SETS: [string, () => FabricsDocument][] = [
  ['HOUSE-01', house01],
  ['HOUSE-02', house02],
  ['plan d’exemple', () => createExamplePlanProject(NOW).document],
  ['grande maison', () => createLargeHouseProject(NOW).document],
]

function viaScene(doc: FabricsDocument) {
  const scene = settleScene(fabricsToScene(doc).scene)
  return { scene, document: sceneToFabricsView(scene) }
}

/** Valeur d'une quantité IFC écrite pour un nœud : `IFCQUANTITY…('Nom',$,$,valeur,$)` du jeu de ce nœud. */
function quantityOf(ifc: string, name: string): number[] {
  return [...ifc.matchAll(new RegExp(`IFCQUANTITY[A-Z]+\\('${name}',\\$,\\$,([-0-9.E]+),\\$\\)`, 'g'))].map((m) => Number(m[1]))
}

describe.each(SETS)('%s', (_name, create) => {
  const { scene, document } = viaScene(create())

  it('les côtés d’un mur redonnent les quantités du mur entier (M21)', () => {
    const { geometric } = computeQuantities({ document, scene })
    const segments = wallSegmentQuantities(document)
    const value = (code: string, id: string) => geometric.find((q) => q.code === code && q.elementIds[0] === id)?.value
    for (const [wallId, parts] of segments) {
      const sum = (key: 'length' | 'grossArea' | 'openingsArea' | 'netArea' | 'netVolume') => parts.reduce((s, p) => s + p[key], 0)
      expect(sum('length'), wallId).toBeCloseTo(value('wall.length', wallId)!, 6)
      expect(sum('grossArea'), wallId).toBeCloseTo(value('wall.grossArea', wallId)!, 3)
      expect(sum('openingsArea'), wallId).toBeCloseTo(value('wall.openingsArea', wallId)!, 3)
      expect(sum('netVolume') / 1e9, wallId).toBeCloseTo(value('wall.netVolume', wallId)! / 1e9, 9)
    }
  })

  it('chaque ajout trouve son objet IFC ; les pièces ont leur contour tracé ; classification Uniclass', () => {
    const { ifc, summary, additions } = buildFabricsIfc(scene, { projectName: 'Essai', labels: LABELS, timestamp: NOW })
    // Sans vue 3D, seuls les objets à forme 3D (toitures, escaliers…) n'ont pas d'objet IFC.
    const unmatched = summary.unmatchedExtensions.filter((id) => ifcClassOf(additions.nodes[id]?.type ?? '')?.geometry !== 'mesh')
    expect(unmatched).toEqual([])
    expect(ifc).toContain("IFCCLASSIFICATION('NBS','2015',$,'Uniclass 2015'")
    for (const room of document.elements.filter((el) => el.type === 'room')) {
      const zone = Object.values(additions.nodes).find((n) => n.type === 'zone' && additions.nodeToElement[n.id] === room.id)
      expect(zone, room.name).toBeDefined()
      const polygon = zone!.polygon as [number, number][]
      const area = computeQuantities({ document, scene }).geometric.find((q) => q.code === 'room.area' && q.elementIds[0] === room.id)!.value
      expect(polygonAreaM2(polygon) * 1e6, room.name).toBeCloseTo(area, 0)
    }
    // Les annotations ne sont pas exportées.
    for (const node of Object.values(scene.nodes)) {
      if (node.type === 'construction-dimension' || node.type === 'fabrics:section') expect(summary.products[node.id]).toBeUndefined()
    }
  })
})

describe('HOUSE-01', () => {
  const { scene } = viaScene(house01())
  const { ifc, summary, additions } = buildFabricsIfc(scene, { projectName: 'HOUSE-01', labels: LABELS, timestamp: NOW })
  const expected = spec('HOUSE-01').expected

  it('dalle de niveau exportée en IfcSlab avec la surface et le volume de M21', () => {
    const slabs = Object.keys(additions.nodes).filter((id) => id.startsWith(LEVEL_SLAB_NODE_PREFIX))
    expect(slabs).toHaveLength(1)
    expect(summary.products[slabs[0]]?.map((p) => p.entity)).toEqual(['IFCSLAB'])
    expect(quantityOf(ifc, 'NetArea')).toContain(expected.slab.area_m2)
    expect(quantityOf(ifc, 'NetVolume')).toContain(expected.slab.volume_m3)
  })

  it('le mur d’enveloppe porte ses quantités côté par côté, dont la somme est celle des métrés', () => {
    const envelope = Object.entries(additions.nodeToElement).filter(([, id]) => id === 'ENV').map(([node]) => node)
    expect(envelope.length).toBe(4)
    const walls = envelope.flatMap((node) => summary.products[node] ?? [])
    expect(walls.every((p) => p.entity === 'IFCWALL')).toBe(true)
    expect(quantityOf(ifc, 'Length').length).toBeGreaterThan(0)
  })

  it('pièces : surfaces de l’IFC = surfaces des métrés', () => {
    const grossAreas = quantityOf(ifc, 'GrossFloorArea')
    for (const room of expected.rooms) expect(grossAreas.some((a) => Math.abs(a - room.exact_m2) < 1e-6), room.name).toBe(true)
  })
})

describe('mur témoin du gate G4', () => {
  const L = 'L0'
  const levels: Level[] = [{ id: L, name: 'RDC', elevation: 0, height: 3000, slabThickness: 200 }]
  const BASE = { rotation: 0, opacity: 1, locked: false, hidden: false, x: 0, y: 0 }
  const elements: CanvasElement[] = [
    { ...BASE, id: 'w', levelId: L, type: 'wall', name: 'M', points: [0, 0, 5000, 0], thickness: 200, height: 3000, fill: '#ccc', material: 'masonry' },
    { ...BASE, id: 'P', levelId: L, type: 'opening', name: 'P', kind: 'door', wallId: 'w', segmentIndex: 0, offset: 2500, width: 900, height: 2100, sillHeight: 0, hinge: 'start', side: 'left' },
  ]
  const { scene } = viaScene(planDocument(levels, elements))
  const { ifc } = buildFabricsIfc(scene, { projectName: 'G4', labels: LABELS, timestamp: NOW })

  it('brut 15,00 m², net 13,11 m², volume net 2,622 m³, porte 1,89 m²', () => {
    expect(quantityOf(ifc, 'GrossSideArea')).toContain(15)
    expect(quantityOf(ifc, 'NetSideArea')).toContain(13.11)
    expect(quantityOf(ifc, 'NetVolume')).toContain(2.622)
    expect(quantityOf(ifc, 'Area')).toContain(1.89)
    expect(ifc).toMatch(/IFCPROPERTYSINGLEVALUE\('QuantityRules',\$,IFCLABEL\('geo-2026\.1'\)/)
  })
})
