/**
 * Scène venue d'ailleurs (M22, 22.4 : IFC importé et converti par Pascal) rendue utilisable comme projet
 * Plan de Fabrics : son terrain et son bâtiment prennent les identifiants de Fabrics (`SITE_ID`,
 * `BUILDING_ID`) et le bâtiment reçoit les réglages d'un plan neuf (page, plan). Rien d'autre ne
 * change : les éléments gardent leur identifiant, leur géométrie et leur GlobalId d'origine
 * (`metadata.globalId`). Fonction pure.
 */
import type { FabricsDocument } from '../../types/document'
import { documentSettingsOf } from './migrate/fromFabrics'
import { BUILDING_ID, SITE_ID, type PlanScene, type SceneNodeData } from './sceneTypes'

export class ForeignSceneError extends Error {}

export function adoptForeignScene(
  scene: PlanScene,
  template: Pick<FabricsDocument, 'version' | 'unit' | 'page' | 'plan' | 'levels'>,
): PlanScene {
  const all = Object.values(scene.nodes)
  const building = all.find((n) => n.type === 'building')
  if (!building) throw new ForeignSceneError('La scène n’a pas de bâtiment.')
  const site = all.find((n) => n.type === 'site')
  const renamed = new Map<string, string>()
  if (building.id !== BUILDING_ID && !scene.nodes[BUILDING_ID]) renamed.set(building.id, BUILDING_ID)
  if (site && site.id !== SITE_ID && !scene.nodes[SITE_ID]) renamed.set(site.id, SITE_ID)
  const rename = (id: string) => renamed.get(id) ?? id

  const nodes: Record<string, SceneNodeData> = {}
  for (const node of all) {
    const copy: SceneNodeData = {
      ...node,
      id: rename(node.id),
      parentId: node.parentId === null ? null : rename(node.parentId),
      ...(node.children && { children: node.children.map(rename) }),
    }
    nodes[copy.id] = copy
  }
  const target = nodes[rename(building.id)]
  target.metadata = { ...target.metadata, fabrics: documentSettingsOf({ ...template, levels: template.levels ?? [] }) }
  return { nodes, rootNodeIds: scene.rootNodeIds.map(rename) }
}
