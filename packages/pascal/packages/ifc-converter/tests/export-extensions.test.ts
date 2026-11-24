// Fabrics (M22): host property sets, quantity sets, classification and the
// per-node product summary.
import { describe, expect, test } from 'bun:test'
import { LevelNode, WallNode } from '@pascal-app/core'
import { buildIfcExport, ifcGuidFromSeed } from '../src/export'
import { expectWellFormedStep } from './export-step-check'

const EPOCH = new Date(Date.UTC(2026, 0, 1))
const level = LevelNode.parse({ id: 'level_x', height: 3 })
const wall = WallNode.parse({ id: 'wall_x', parentId: level.id, start: [0, 0], end: [5, 0] })
const nodes = { [level.id]: level, [wall.id]: wall }

describe('host extensions', () => {
  const { ifc, summary } = buildIfcExport({
    nodes,
    timestamp: EPOCH,
    extensions: {
      propertySets: {
        wall_x: [
          { name: 'Fabrics', properties: [{ name: 'ElementId', kind: 'identifier', value: 'w1' }] },
        ],
        missing: [
          { name: 'Fabrics', properties: [{ name: 'ElementId', kind: 'identifier', value: 'x' }] },
        ],
      },
      quantitySets: {
        wall_x: [
          {
            name: 'Qto_WallBaseQuantities',
            quantities: [
              { name: 'Length', kind: 'length', value: 5 },
              { name: 'NetSideArea', kind: 'area', value: 13.11 },
              { name: 'NetVolume', kind: 'volume', value: 2.622 },
            ],
          },
        ],
      },
      classification: {
        source: 'NBS',
        edition: '2015',
        name: 'Uniclass 2015',
        references: { wall_x: { identification: 'EF_25_10', name: 'Walls' } },
      },
    },
  })

  test('writes the sets on the node product', () => {
    expect(ifc).toContain("IFCQUANTITYAREA('NetSideArea',$,$,13.11,$)")
    expect(ifc).toContain("IFCQUANTITYVOLUME('NetVolume',$,$,2.622,$)")
    expect(ifc).toContain("'Qto_WallBaseQuantities'")
    expect(ifc).toContain("IFCCLASSIFICATIONREFERENCE($,'EF_25_10','Walls'")
    expect(ifc).toContain("IFCCLASSIFICATION('NBS','2015',$,'Uniclass 2015'")
    expectWellFormedStep(ifc)
  })

  test('reports products and unmatched nodes', () => {
    expect(summary.products.wall_x).toEqual([
      { entity: 'IFCWALL', globalId: ifcGuidFromSeed('wall_x') },
    ])
    expect(summary.products.level_x?.[0]?.entity).toBe('IFCBUILDINGSTOREY')
    expect(summary.unmatchedExtensions).toEqual(['missing'])
  })
})
