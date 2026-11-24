/**
 * M22, 22.1 : l'exportateur de Pascal écrit pour chaque nœud la classe IFC de la table `classes.ts`.
 * Les formes 3D de la vue (toitures, escaliers, mobilier) sont remplacées ici par un triangle.
 */
import { describe, expect, it } from 'vitest'
import { buildIfcExport, type IfcMeshPart } from '@pascal-app/ifc-converter/export'
import type { FabricsDocument } from '../../types/document'
import { createExamplePlanProject, createLargeHouseProject } from '../documents/createProject'
import { house01, house02 } from '../scene/migrate/fixtureDocuments'
import { fabricsToScene } from '../scene/migrate/fromFabrics'
import { settleScene } from '../scene/settle'
import { IFC_CLASSES, ifcClassOf, NOT_EXPORTED } from './classes'

const NOW = new Date('2026-11-17T00:00:00Z')
const TRIANGLE: IfcMeshPart = { positions: new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]), indices: new Uint32Array([0, 1, 2]) }
const SETS: [string, () => FabricsDocument][] = [
  ['HOUSE-01', house01],
  ['HOUSE-02', house02],
  ['plan d’exemple', () => createExamplePlanProject(NOW).document],
  ['grande maison', () => createLargeHouseProject(NOW).document],
]

describe.each(SETS)('classes IFC de %s', (_name, create) => {
  const scene = settleScene(fabricsToScene(create()).scene)
  const nodes = scene.nodes as Parameters<typeof buildIfcExport>[0]['nodes']
  const meshes = new Map(Object.keys(nodes).map((id) => [id, [TRIANGLE]]))
  const { summary } = buildIfcExport({ nodes, meshes, timestamp: NOW, excludedNodeTypes: Object.keys(NOT_EXPORTED) })

  it('chaque nœud devient la classe de la table, ou rien s’il est une annotation', () => {
    const wrong: string[] = []
    for (const node of Object.values(nodes)) {
      const written = (summary.products[node.id] ?? []).map((p) => p.entity)
      const rule = ifcClassOf(node.type)
      if (!rule) {
        if (!(node.type in NOT_EXPORTED) || written.length > 0) wrong.push(`${node.type} → ${written.join('+') || 'rien'}`)
      } else if (written.length === 0 || written.some((entity) => !rule.entities.includes(entity))) {
        wrong.push(`${node.type} → ${written.join('+') || 'rien'} (attendu ${rule.entities.join(' ou ')})`)
      }
    }
    expect(wrong).toEqual([])
    expect(summary.skipped).toEqual([])
  })

  it('chaque produit a un GlobalId IFC valide', () => {
    for (const product of Object.values(summary.products).flat()) expect(product.globalId).toMatch(/^[0-3][0-9A-Za-z_$]{21}$/)
  })
})

it('chaque classe porteuse d’un code Uniclass a un code de la table EF', () => {
  for (const rule of IFC_CLASSES) if (rule.uniclass) expect(rule.uniclass.identification).toMatch(/^EF_\d{2}_\d{2}$/)
})
