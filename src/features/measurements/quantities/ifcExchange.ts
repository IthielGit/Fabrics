/**
 * Jeu d'échange pour comparer le quantitatif avec un IFC (M21, 21.6, D21-7) : nos quantités
 * géométriques par élément, en unités SI (m, m², m³) comme IfcOpenShell, et le lien entre les nœuds
 * de la scène Pascal (propriété `Pascal.NodeId` de l'IFC) et les éléments Fabrics.
 * Le fichier IFC4 est produit par l'exportateur de Pascal ; la comparaison est faite par
 * `tools/ifc/compare_quantities.py`. Fonction pure.
 */
import type { FabricsDocument } from '../../../types/document'
import type { PlanScene } from '../../scene/sceneTypes'
import { computeQuantities } from './quantitySet'

export interface ExchangeElement {
  kind: 'wall' | 'opening' | 'room' | 'slab'
  name: string
  /** Mur : volume net (ouvertures déduites), m³. */
  netVolume?: number
  /** Ouverture : largeur × hauteur dans le mur, m² ; pièce : surface au tracé, m² ; dalle : m². */
  area?: number
  /** Dalle : volume, m³. */
  volume?: number
  /** Statut de la quantité comparée (21.4) : une quantité provisoire est signalée, pas comptée en échec. */
  status?: string
}

export interface ExchangeSet {
  name: string
  /** Tolérance relative des quantités simples (D21-6 : moins de 0,1 %, provisoire). */
  relativeTolerance: number
  elements: Record<string, ExchangeElement>
  /** Nœud de la scène → élément Fabrics (un mur à plusieurs côtés donne plusieurs nœuds). */
  nodeToElement: Record<string, string>
}

export function exchangeSet(name: string, document: FabricsDocument, scene: PlanScene): ExchangeSet {
  const { geometric } = computeQuantities({ document, scene })
  const elements: Record<string, ExchangeElement> = {}
  const get = (id: string, kind: ExchangeElement['kind'], label: string) => (elements[id] ??= { kind, name: label })
  for (const q of geometric) {
    const [id] = q.elementIds
    const label = q.trace.sources[0]?.name ?? id
    if (q.code === 'wall.netVolume') Object.assign(get(id, 'wall', label), { netVolume: q.value / 1e9, status: q.status })
    else if (q.code === 'opening.area') Object.assign(get(id, 'opening', label), { area: q.value / 1e6, status: q.status })
    else if (q.code === 'room.area') get(id, 'room', label).area = q.value / 1e6
    else if (q.code === 'slab.area' && q.partId === null) get(id, 'slab', label).area = q.value / 1e6
    else if (q.code === 'slab.volume' && q.partId === null) get(id, 'slab', label).volume = q.value / 1e9
  }
  const nodeToElement: Record<string, string> = {}
  for (const node of Object.values(scene.nodes)) {
    const id = (node.metadata?.fabrics as { id?: string } | undefined)?.id ?? node.id
    if (elements[id]) nodeToElement[node.id] = id
  }
  return { name, relativeTolerance: 0.001, elements, nodeToElement }
}
