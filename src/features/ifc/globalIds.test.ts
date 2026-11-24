/**
 * M22, 22.3 (gate G5) : exporter deux fois le même plan donne les mêmes GlobalId ; ils survivent à
 * l'enregistrement du projet et à la modification d'un autre élément.
 */
import { describe, expect, it } from 'vitest'
import type { FabricsDocument } from '../../types/document'
import { createLargeHouseProject } from '../documents/createProject'
import { house01, house02 } from '../scene/migrate/fixtureDocuments'
import { fabricsToScene } from '../scene/migrate/fromFabrics'
import type { PlanScene } from '../scene/sceneTypes'
import { settleScene } from '../scene/settle'
import { buildFabricsIfc } from './exportIfc'
import { globalIdTable } from './globalIds'

const LABELS = { levelSlab: 'Dalle' }
const SETS: [string, () => FabricsDocument][] = [
  ['HOUSE-01', house01],
  ['HOUSE-02', house02],
  ['grande maison', () => createLargeHouseProject(new Date('2026-11-17T00:00:00Z')).document],
]

function table(scene: PlanScene, timestamp: Date) {
  const { summary, additions, ifc } = buildFabricsIfc(scene, { projectName: 'Essai', labels: LABELS, timestamp })
  return { rows: globalIdTable(summary, additions), ifc }
}

/** Tous les GlobalId du fichier (premier attribut des entités qui en ont un). */
const allGuids = (ifc: string) => [...ifc.matchAll(/=IFC[A-Z0-9]+\('([0-3][0-9A-Za-z_$]{21})'/g)].map((m) => m[1]).sort()

describe.each(SETS)('%s', (_name, create) => {
  const scene = settleScene(fabricsToScene(create()).scene)

  it('deux exports à des dates différentes : mêmes GlobalId partout (objets, propriétés, relations)', () => {
    const first = table(scene, new Date('2026-11-24T08:00:00Z'))
    const second = table(scene, new Date('2026-12-01T17:30:00Z'))
    expect(second.rows).toEqual(first.rows)
    expect(allGuids(second.ifc)).toEqual(allGuids(first.ifc))
    expect(new Set(allGuids(first.ifc)).size).toBe(allGuids(first.ifc).length)
  })

  it('après enregistrement et rechargement du projet : mêmes GlobalId', () => {
    const reloaded = JSON.parse(JSON.stringify(scene)) as PlanScene
    expect(table(reloaded, new Date()).rows).toEqual(table(scene, new Date()).rows)
  })

  it('modifier un mur ne change le GlobalId d’aucun élément', () => {
    const wall = Object.values(scene.nodes).find((n) => n.type === 'wall')!
    const end = wall.end as [number, number]
    const moved: PlanScene = { ...scene, nodes: { ...scene.nodes, [wall.id]: { ...wall, end: [end[0] + 0.1, end[1]] } } }
    const guidsOf = (rows: ReturnType<typeof globalIdTable>) => new Map(rows.map((r) => [`${r.nodeId}\u0000${r.entity}`, r.globalId]))
    const before = guidsOf(table(scene, new Date()).rows)
    const after = guidsOf(table(moved, new Date()).rows)
    for (const [key, guid] of before) if (after.has(key)) expect(after.get(key), key).toBe(guid)
    expect(after.size).toBe(before.size)
  })
})

it('un élément importé garde son GlobalId d’origine', () => {
  const scene = settleScene(fabricsToScene(house01()).scene)
  const wall = Object.values(scene.nodes).find((n) => n.type === 'wall')!
  const original = '2O2Fr$t4X7Zf8NOew3FLOH'
  const imported: PlanScene = { ...scene, nodes: { ...scene.nodes, [wall.id]: { ...wall, metadata: { ...wall.metadata, globalId: original } } } }
  const rows = table(imported, new Date()).rows.filter((r) => r.nodeId === wall.id)
  expect(rows.map((r) => r.globalId)).toEqual([original])
})
