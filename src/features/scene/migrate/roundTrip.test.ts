import { validateBuildJson } from '@pascal-app/core'
import { describe, expect, it } from 'vitest'
import { createExamplePlanProject, createLargeHouseProject } from '../../documents/createProject'
import type { CanvasElement, FabricsDocument } from '../../../types/document'
import { sceneToFabricsView } from '../view/toFabricsView'
import { fabricsToScene } from './fromFabrics'

const NOW = new Date('2026-11-18T00:00:00Z')
const BASE = { rotation: 0, opacity: 1, locked: false, hidden: false, x: 0, y: 0 }

/** Un plan qui contient chaque type d'élément, avec des valeurs peu ordinaires. */
function everyTypeDocument(): FabricsDocument {
  const L0 = 'lvl-0'
  const L1 = 'lvl-1'
  const elements: CanvasElement[] = [
    { ...BASE, id: 'w1', type: 'wall', name: 'Mur 1', levelId: L0, points: [100, 100, 7900.5, 100, 7900.5, 9900, 100, 9900], thickness: 200, height: 3000, fill: '#ccc', material: 'brick' },
    { ...BASE, id: 'w2', type: 'wall', name: 'Cloison', levelId: L1, points: [0, 0, 3333.333333, 1234.567891], thickness: 70, height: 2575, fill: '#ddd', locked: true },
    { ...BASE, id: 'w3', type: 'wall', name: 'Point', levelId: L0, points: [50, 50], thickness: 100, height: 2500, fill: '#eee' },
    { ...BASE, id: 'o1', type: 'opening', name: 'P01', levelId: L0, kind: 'door', style: 'double', wallId: 'w1', segmentIndex: 0, offset: 2200, width: 1000, height: 2155, sillHeight: 0, hinge: 'end', side: 'right' },
    { ...BASE, id: 'o2', type: 'opening', name: 'F01', levelId: L0, kind: 'window', tiltTurn: true, wallId: 'w1', segmentIndex: 2, offset: 1800.25, width: 1200, height: 1350, sillHeight: 900, hinge: 'start', side: 'left' },
    { ...BASE, id: 'o3', type: 'opening', name: 'B01', levelId: L1, kind: 'bay', style: 'bay-sliding', wallId: 'w2', segmentIndex: 0, offset: 900, width: 2400, height: 2150, sillHeight: 0, hinge: 'start', side: 'left' },
    { ...BASE, id: 'o4', type: 'opening', name: 'F99', levelId: L0, kind: 'window', wallId: 'absent', segmentIndex: 3, offset: 10, width: 600, height: 600, sillHeight: 1200, hinge: 'start', side: 'left' },
    { ...BASE, id: 'r1', type: 'room', name: 'Séjour', levelId: L0, points: [200, 200, 4450, 200, 4450, 4950, 200, 4950], fill: 'rgba(0,0,255,0.1)', showLabel: true, falseCeiling: true },
    { ...BASE, id: 'pf', type: 'platform', name: 'Estrade', levelId: L0, points: [0, 0, 1000, 0, 1000, 500], elevation: 150, thickness: 150, fill: '#abc' },
    { ...BASE, id: 'f1', type: 'furniture', name: 'Lit', levelId: L1, symbol: 'bed-queen', x: 1234.5, y: 678.9, rotation: 30, width: 1600, depth: 2000, mirrored: true },
    { ...BASE, id: 'f2', type: 'furniture', name: 'Table', levelId: L0, symbol: 'table', x: 10, y: 20, rotation: -135.5, width: 900, depth: 900 },
    { ...BASE, id: 'a1', type: 'axis', name: 'Axe A', points: [0, -1000, 0, 11000], label: 'A' },
    { ...BASE, id: 'a2', type: 'axis', name: 'Axe vide', points: [0, 0, 5000, 0], label: '' },
    { ...BASE, id: 'd1', type: 'dimension', name: 'Cote', levelId: L0, points: [0, 0, 8000, 0], offset: -600, visibleIn: 'client' },
    { ...BASE, id: 'd2', type: 'dimension', name: 'Cote nulle', levelId: L0, points: [500, 500, 500, 500], offset: 300 },
    { ...BASE, id: 'd3', type: 'dimension', name: 'Cote biaise', levelId: L1, points: [100, 200, 3100, 4200], offset: 450.5 },
    { ...BASE, id: 's1', type: 'section', name: 'Coupe A', points: [-500, 5000, 8500, 5000], label: 'A', lookLeft: true },
    { ...BASE, id: 'rf', type: 'roof', name: 'Toit', levelId: L1, points: [0, 0, 8000, 0, 8000, 10000, 0, 10000], shape: 'gable', pitch: 35, overhang: 400, ridgeEdge: 1, covering: 'tiles' },
    { ...BASE, id: 'st', type: 'stair', name: 'Escalier', levelId: L0, x: 6000, y: 6000, rotation: 90, shape: 'u', width: 900, length: 2400, length2: 2400, gap: 100, mirrored: true, voidMargin: 50 },
    { ...BASE, id: 'ch', type: 'chimney', name: 'Cheminée', levelId: L0, x: 300, y: 300, width: 400, depth: 400, heightAboveTop: 800 },
    { ...BASE, id: 't1', type: 'text', name: 'Note', levelId: L0, text: 'Vérifier', width: 2000, fontFamily: 'Inter', fontSize: 250, fontStyle: 'bold', align: 'center', fill: '#000', opacity: 0.5 },
    { ...BASE, id: 'rc', type: 'rect', name: 'Cadre', levelId: L0, x: 10, y: 10, width: 500, height: 300, fill: 'transparent', stroke: '#f00', strokeWidth: 20, cornerRadius: 0, hidden: true },
    { ...BASE, id: 'el', type: 'ellipse', name: 'Rond', levelId: 'niveau-supprimé', x: 10, y: 10, radiusX: 300, radiusY: 200, fill: '#0f0', stroke: '#000', strokeWidth: 10 },
    { ...BASE, id: 'ln', type: 'line', name: 'Fond DXF', levelId: L0, points: [0, 0, 100.123456, 200], stroke: '#999', strokeWidth: 1, arrowEnd: false, groupId: 'dxf-1' },
    { ...BASE, id: 'im', type: 'image', name: 'Photo', levelId: L0, x: 0, y: 0, width: 4000, height: 3000, assetId: 'asset-1' },
  ]
  return {
    version: 4,
    unit: 'mm',
    page: { width: 29700, height: 21000, background: '#ffffff' },
    plan: { scale: 50, gridSize: 100, snapToGrid: true, defaultWallThickness: 200, defaultWallHeight: 2500, showAnnotations: true, northAngle: 15 },
    levels: [
      { id: L0, name: 'Rez-de-chaussée', elevation: -150, height: 2800, slabThickness: 200 },
      { id: L1, name: 'Étage 1', elevation: 3000, height: 2575.5, slabThickness: 220 },
    ],
    elements,
  }
}

function roundTrip(doc: FabricsDocument): FabricsDocument {
  return sceneToFabricsView(fabricsToScene(doc).scene)
}

describe('conversion plan Fabrics ↔ scène Pascal', () => {
  it('rend exactement un plan qui contient chaque type d’élément', () => {
    const doc = everyTypeDocument()
    expect(roundTrip(doc)).toStrictEqual(doc)
  })

  it.each([
    ['exemple', createExamplePlanProject],
    ['grande maison', createLargeHouseProject],
  ])('rend exactement le plan « %s »', (_, create) => {
    const doc = create(NOW).document
    expect(roundTrip(doc)).toStrictEqual(doc)
  })

  it('produit une scène que Pascal valide (schémas, liens parent / enfant)', () => {
    const { scene } = fabricsToScene(everyTypeDocument())
    const result = validateBuildJson(scene)
    expect(result.schemaIssues ?? []).toEqual([])
    expect(result.errors).toEqual([])
    expect(result.ok).toBe(true)
  })

  it('découpe un mur à plusieurs côtés et accroche chaque ouverture à son côté', () => {
    const { scene } = fabricsToScene(everyTypeDocument())
    const sides = Object.values(scene.nodes).filter((n) => n.type === 'wall' && n.id.startsWith('wall_w1__'))
    expect(sides.map((n) => n.id).sort()).toEqual(['wall_w1__0', 'wall_w1__1', 'wall_w1__2'])
    expect(scene.nodes.door_o1.parentId).toBe('wall_w1__0')
    expect(scene.nodes.window_o2.parentId).toBe('wall_w1__2')
    expect(scene.nodes.wall_w1__2.children).toContain('window_o2')
    expect(scene.nodes.door_o1.position).toEqual([2.2, 1.0775, 0]) // centre de la porte : 2155 / 2 mm
    expect(scene.nodes.wall_w1__0).toMatchObject({ start: [0.1, 0.1], end: [7.9005, 0.1], thickness: 0.2, height: 3 })
  })

  it('empile les niveaux comme Pascal (altitude = haut du niveau précédent + décalage)', () => {
    const { scene } = fabricsToScene(everyTypeDocument())
    expect(scene.nodes['level_lvl-0']).toMatchObject({ level: 0, baseElevation: -0.15, height: 2.8 })
    // -150 + 2800 = 2650 ; 3000 - 2650 = 350 mm de décalage
    expect(scene.nodes['level_lvl-1']).toMatchObject({ level: 1, baseElevation: 0.35, height: 2.5755 })
  })

  it('signale les anomalies sans les corriger (EDGE-01 : jamais de résultat faux en silence)', () => {
    const { issues } = fabricsToScene(everyTypeDocument())
    expect(issues).toEqual(
      expect.arrayContaining([
        { code: 'wall-degenerate', elementId: 'w3' },
        { code: 'opening-without-wall', elementId: 'o4' },
        { code: 'element-without-level', elementId: 'el' },
      ]),
    )
    expect(issues).toHaveLength(3)
  })
})
