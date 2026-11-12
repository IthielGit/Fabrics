import { getUserSet } from '../userRegistry'
import { getSymbol } from './index'
import { SETS, member, type PrefabOpening, type SetDef, type SetMember } from './sets'

// Pièces préfabriquées (M9) : un mur fermé, des ouvertures, une pièce étiquetée et du mobilier,
// dessinés pour Fabrics à partir de dimensions courantes (« clean room », aucune source tierce).
// L'emprise (`width` × `depth`) est la face intérieure du mur ; le mur est posé autour.

/** Épaisseur des murs des pièces préfabriquées, en mm. */
export const PREFAB_WALL_THICKNESS = 200

interface BoxOptions {
  rotation?: number
  mirrored?: boolean
  width?: number
  depth?: number
}

/**
 * Objet posé de façon que son rectangle visible (après rotation de 0, 90, 180 ou 270°) ait son
 * coin haut-gauche en (left, top).
 */
function box(symbol: string, left: number, top: number, options: BoxOptions = {}): SetMember {
  const def = getSymbol(symbol)
  if (!def) throw new Error(`Objet inconnu dans une pièce préfabriquée : ${symbol}`)
  const width = options.width ?? def.width
  const depth = options.depth ?? def.depth
  const rotation = options.rotation ?? 0
  const sideways = rotation === 90 || rotation === 270
  const visibleWidth = sideways ? depth : width
  const visibleDepth = sideways ? width : depth
  return member(symbol, left + visibleWidth / 2, top + visibleDepth / 2, options)
}

function prefab(
  id: string,
  width: number,
  depth: number,
  members: SetMember[],
  openings: PrefabOpening[],
): SetDef {
  return {
    id,
    category: 'prefabs',
    width,
    depth,
    members,
    shell: { thickness: PREFAB_WALL_THICKNESS, openings },
  }
}

/** Rangée de meubles de cuisine contre le mur du haut : `[objet, largeur]`, de gauche à droite. */
function topRun(items: readonly (readonly [string, number])[], startX: number): SetMember[] {
  let x = startX
  return items.map(([symbol, width]) => {
    const placed = box(symbol, x, 0, { width })
    x += width
    return placed
  })
}

export const PREFABS: readonly SetDef[] = [
  prefab(
    'prefab-bedroom',
    3500,
    3200,
    [
      box('bed-queen', 950, 0),
      box('nightstand', 450, 0),
      box('nightstand', 2550, 0),
      box('wardrobe-2', 0, 2100, { rotation: 90 }),
    ],
    [
      { side: 'bottom', at: 2400, kind: 'door', hinge: 'start' },
      { side: 'right', at: 1000, kind: 'window' },
    ],
  ),
  prefab(
    'prefab-bathroom',
    2500,
    2200,
    [
      box('shower-square', 1600, 0),
      box('washbasin', 100, 0),
      box('wc', 900, 0),
    ],
    [
      { side: 'bottom', at: 700, kind: 'door', width: 800, hinge: 'start' },
      { side: 'right', at: 1500, kind: 'window', width: 600 },
    ],
  ),
  prefab(
    'prefab-wc',
    1500,
    1500,
    [box('wc', 200, 0), box('washbasin', 800, 0, { width: 600 })],
    [{ side: 'bottom', at: 750, kind: 'door', width: 800, hinge: 'start' }],
  ),
  prefab(
    'prefab-kitchen',
    3600,
    3000,
    [
      ...topRun(
        [
          ['fridge', 600],
          ['kitchen-base', 600],
          ['sink-kitchen-1', 800],
          ['dishwasher', 600],
          ['hob-4', 600],
        ],
        200,
      ),
      box('table-rect-4', 1200, 1700),
      box('chair', 1275, 1300),
      box('chair', 1875, 1300),
      box('chair', 1275, 2400, { rotation: 180 }),
      box('chair', 1875, 2400, { rotation: 180 }),
    ],
    [
      { side: 'bottom', at: 3000, kind: 'door', hinge: 'start' },
      { side: 'top', at: 1800, kind: 'window' },
    ],
  ),
  prefab(
    'prefab-living',
    5000,
    4000,
    [
      box('tv-unit', 1700, 0),
      box('coffee-table', 1950, 1500),
      box('sofa-3', 1450, 2500, { rotation: 180 }),
      box('armchair', 3900, 1700, { rotation: 270 }),
    ],
    [
      { side: 'bottom', at: 700, kind: 'door', hinge: 'start' },
      { side: 'top', at: 800, kind: 'window' },
      { side: 'right', at: 2800, kind: 'window', width: 1500 },
    ],
  ),
  prefab(
    'prefab-office',
    3000,
    3000,
    [
      box('desk', 800, 0),
      box('office-chair', 1200, 800, { rotation: 180 }),
      box('bookcase', 0, 1800, { rotation: 90 }),
      box('bookcase', 2700, 1800, { rotation: 270 }),
    ],
    [
      { side: 'bottom', at: 2200, kind: 'door', hinge: 'start' },
      { side: 'right', at: 1000, kind: 'window' },
    ],
  ),
  prefab(
    'prefab-garage',
    3200,
    6000,
    [box('car-sedan', 675, 600), box('garage-rack', 0, 0, { rotation: 90 })],
    [
      { side: 'bottom', at: 1600, kind: 'bay' },
      { side: 'left', at: 5000, kind: 'door', hinge: 'start' },
    ],
  ),
]

const BY_ID = new Map<string, SetDef>([...SETS, ...PREFABS].map((set) => [set.id, set]))

/** Ensemble, pièce préfabriquée ou ensemble personnel de l'utilisateur par son identifiant, ou `undefined`. */
export function getPlaceable(id: string): SetDef | undefined {
  return BY_ID.get(id) ?? getUserSet(id)?.def
}
