import { getSymbol } from './index'

/** Un objet d'un ensemble : position (coin haut-gauche avant rotation, en mm) dans la boîte de l'ensemble. */
export interface SetMember {
  symbol: string
  x: number
  y: number
  rotation: number
  width: number
  depth: number
  mirrored?: boolean
}

/** Composition prête à poser : plusieurs objets du catalogue, ensuite indépendants les uns des autres. */
export interface SetDef {
  id: string
  category: 'sets' | 'prefabs'
  /** Emprise (boîte englobante des objets), en mm. */
  width: number
  depth: number
  members: readonly SetMember[]
  /** Pièces préfabriquées (M9) : mur fermé et ouvertures autour de l'emprise (la face intérieure du mur). */
  shell?: PrefabShell
}

/** Ouverture d'une pièce préfabriquée, posée sur l'un de ses quatre côtés. */
export interface PrefabOpening {
  side: 'top' | 'right' | 'bottom' | 'left'
  /** Position du centre le long du côté, en mm depuis l'angle haut-gauche de l'emprise (x pour haut et bas, y pour gauche et droite). */
  at: number
  kind: 'door' | 'window' | 'bay'
  width?: number
  height?: number
  sillHeight?: number
  hinge?: 'start' | 'end'
}

/** Mur fermé d'une pièce préfabriquée : l'emprise de l'ensemble est sa face intérieure. */
export interface PrefabShell {
  thickness: number
  openings: readonly PrefabOpening[]
}

interface MemberOptions {
  rotation?: number
  mirrored?: boolean
  width?: number
  depth?: number
}

/** Objet posé de façon que son centre soit en (cx, cy), après rotation de `rotation` degrés. */
export function member(symbol: string, cx: number, cy: number, options: MemberOptions = {}): SetMember {
  const def = getSymbol(symbol)
  if (!def) throw new Error(`Objet inconnu dans un ensemble : ${symbol}`)
  const width = options.width ?? def.width
  const depth = options.depth ?? def.depth
  const rotation = options.rotation ?? 0
  const angle = (rotation * Math.PI) / 180
  // Centre de l'objet par rapport à son coin haut-gauche, après rotation autour de ce coin.
  const ox = (width / 2) * Math.cos(angle) - (depth / 2) * Math.sin(angle)
  const oy = (width / 2) * Math.sin(angle) + (depth / 2) * Math.cos(angle)
  return {
    symbol,
    x: Math.round(cx - ox),
    y: Math.round(cy - oy),
    rotation,
    width,
    depth,
    ...(options.mirrored ? { mirrored: true } : {}),
  }
}

/** Coins d'un objet après rotation (pour calculer l'emprise d'un ensemble). */
function memberCorners(m: SetMember): { x: number; y: number }[] {
  const angle = (m.rotation * Math.PI) / 180
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  return [
    [0, 0],
    [m.width, 0],
    [m.width, m.depth],
    [0, m.depth],
  ].map(([px, py]) => ({ x: m.x + px * cos - py * sin, y: m.y + px * sin + py * cos }))
}

/** Ensemble dont les objets sont recalés pour que l'emprise commence en (0, 0). */
function defineSet(id: string, raw: SetMember[]): SetDef {
  const corners = raw.flatMap(memberCorners)
  const minX = Math.min(...corners.map((c) => c.x))
  const minY = Math.min(...corners.map((c) => c.y))
  const maxX = Math.max(...corners.map((c) => c.x))
  const maxY = Math.max(...corners.map((c) => c.y))
  const dx = Math.round(minX)
  const dy = Math.round(minY)
  return {
    id,
    category: 'sets',
    width: Math.round(maxX - minX),
    depth: Math.round(maxY - minY),
    members: raw.map((m) => ({ ...m, x: m.x - dx, y: m.y - dy })),
  }
}

/** Table rectangulaire au centre (0, 0) et chaises : `perLong` sur chaque long côté, `perEnd` à chaque bout. */
function tableWithChairs(table: string, chair: string, perLong: number, perEnd: number): SetMember[] {
  const t = getSymbol(table)!
  const c = getSymbol(chair)!
  const out: SetMember[] = [member(table, 0, 0)]
  const overlap = 100 // l'assise passe un peu sous le plateau
  for (let i = 0; i < perLong; i++) {
    const x = -t.width / 2 + (t.width * (i + 0.5)) / perLong
    out.push(member(chair, x, -(t.depth / 2 + c.depth / 2 - overlap), { rotation: 0 }))
    out.push(member(chair, x, t.depth / 2 + c.depth / 2 - overlap, { rotation: 180 }))
  }
  if (perEnd > 0) {
    out.push(member(chair, t.width / 2 + c.depth / 2 - overlap, 0, { rotation: 90 }))
    out.push(member(chair, -(t.width / 2 + c.depth / 2 - overlap), 0, { rotation: 270 }))
  }
  return out
}

/** Table ronde au centre (0, 0) et `count` chaises régulièrement réparties, tournées vers la table. */
function roundTableWithChairs(table: string, chair: string, count: number): SetMember[] {
  const t = getSymbol(table)!
  const c = getSymbol(chair)!
  const out: SetMember[] = [member(table, 0, 0)]
  const radius = t.width / 2 + c.depth / 2 - 100
  for (let i = 0; i < count; i++) {
    const a = -90 + (i * 360) / count
    const rad = (a * Math.PI) / 180
    out.push(member(chair, Math.cos(rad) * radius, Math.sin(rad) * radius, { rotation: a + 90 }))
  }
  return out
}

/** Rangée de meubles de cuisine alignés contre le mur du haut (y = 0) : `[objet, largeur]`, de gauche à droite. */
function kitchenRun(items: readonly (readonly [string, number])[], startX = 0): SetMember[] {
  let x = startX
  return items.map(([symbol, width]) => {
    const def = getSymbol(symbol)!
    const placed = member(symbol, x + width / 2, def.depth / 2, { width })
    x += width
    return placed
  })
}

function stools(xs: readonly number[], y: number): SetMember[] {
  return xs.map((x) => member('stool-bar', x, y))
}

const LINEAR_RUN: readonly (readonly [string, number])[] = [
  ['fridge', 600],
  ['kitchen-base', 400],
  ['sink-kitchen-1', 800],
  ['dishwasher', 600],
  ['hob-4', 600],
]

export const SETS: readonly SetDef[] = [
  defineSet('set-dining-4', tableWithChairs('table-rect-4', 'chair', 2, 0)),
  defineSet('set-dining-6', tableWithChairs('table-rect-6', 'chair', 2, 1)),
  defineSet('set-dining-8', tableWithChairs('table-rect-8', 'chair', 3, 1)),
  defineSet('set-dining-round-6', roundTableWithChairs('table-round-6', 'chair', 6)),
  defineSet('set-living-corner', [
    member('rug-rect', 1150, 2300),
    member('sofa-corner', 1250, 800),
    member('coffee-table', 1150, 2300),
    member('tv-unit', 1150, 4100, { rotation: 180 }),
  ]),
  defineSet('set-living-straight', [
    member('rug-rect', 1050, 1900),
    member('sofa-3', 1050, 450),
    member('armchair', 450, 2550, { rotation: 180 }),
    member('armchair', 1650, 2550, { rotation: 180 }),
    member('coffee-table', 1050, 1500),
  ]),
  defineSet('set-bedroom-double', [
    member('bed-queen', 1400, 1000),
    member('nightstand', 350, 200),
    member('nightstand', 2450, 200),
    member('wardrobe-3', 1400, 2600, { rotation: 180 }),
  ]),
  defineSet('set-bedroom-child', [
    member('bed-child', 350, 700),
    member('nightstand', 925, 200),
    member('desk-child', 1900, 275),
    member('wardrobe-2', 500, 1950, { rotation: 180 }),
  ]),
  defineSet('set-office-workstation', [
    member('desk', 700, 350),
    member('office-chair', 700, 1000, { rotation: 180 }),
    member('filing-pedestal', 1600, 300),
  ]),
  defineSet('set-office-meeting-6', tableWithChairs('meeting-table-6', 'chair-visitor', 2, 1)),
  defineSet('set-kitchen-linear', [...kitchenRun(LINEAR_RUN), member('hood', 2700, 250)]),
  defineSet('set-kitchen-l', [
    member('kitchen-corner', 450, 450),
    ...kitchenRun(
      [
        ['sink-kitchen-1', 800],
        ['dishwasher', 600],
        ['fridge', 600],
      ],
      900,
    ),
    member('kitchen-base', 300, 1200, { rotation: 270 }),
    member('hob-4', 260, 1800, { rotation: 270 }),
    member('kitchen-base', 300, 2400, { rotation: 270 }),
  ]),
  defineSet('set-kitchen-island', [
    ...kitchenRun(LINEAR_RUN),
    member('hood', 2700, 250),
    member('kitchen-island', 1500, 2200),
    ...stools([900, 1500, 2100], 2950),
  ]),
  defineSet('set-bathroom-basic', [
    member('bathtub', 850, 350),
    member('vanity-unit', 400, 1130),
    member('wc', 1250, 1250),
  ]),
  defineSet('set-bathroom-shower', [
    member('shower-square', 450, 450),
    member('vanity-unit', 1400, 230),
    member('wc', 2000, 350),
  ]),
  defineSet('set-wc-pmr', [
    member('pmr-turning-circle', 1500, 1500),
    member('wc-pmr', 400, 350),
    member('washbasin-pmr', 1450, 275),
  ]),
  defineSet('set-terrace-4', [...tableWithChairs('table-garden', 'chair-garden', 2, 0), member('parasol', 0, 0)]),
  defineSet('set-parking-3', [
    member('parking-bay', 1250, 2500),
    member('parking-bay', 3750, 2500),
    member('parking-bay', 6250, 2500),
  ]),
  defineSet('set-kitchen-american', [
    member('kitchen-american', 1600, 750),
    ...stools([1900, 2500, 3100], 1750),
    ...tableWithChairs('table-rect-4', 'chair', 2, 0).map((m) => ({ ...m, y: m.y + 3600 - 0, x: m.x + 1600 })),
  ]),
  defineSet('set-kitchen-american-l', [
    member('kitchen-american-l', 1600, 1300),
    ...stools([1700, 2300, 2900], 2850),
    member('coffee-table', 1600, 3600),
    member('sofa-3', 1600, 4500, { rotation: 180 }),
  ]),
  defineSet('set-kitchen-u-table', [
    member('kitchen-u', 1500, 1500),
    ...tableWithChairs('table-kitchen', 'chair', 2, 0).map((m) => ({ ...m, y: m.y + 1900, x: m.x + 1500 })),
  ]),
  defineSet('set-bar-home', [member('bar-home', 1200, 750), ...stools([1000, 1450, 1900, 2350], 1800)]),
  defineSet('set-bar-l-restaurant', [
    member('bar-counter-l', 1500, 1000),
    member('bar-back', 1800, 1750, { rotation: 180, width: 2400 }),
    ...[900, 1500, 2100, 2700].map((x) => member('stool-bar', x, -250)),
    member('stool-bar', -250, 900),
    member('stool-bar', -250, 1500),
  ]),
  defineSet('set-bar-garden', [
    member('bar-outdoor', 1000, 300),
    ...stools([400, 800, 1200, 1600], 900),
    member('parasol', 1000, 700),
  ]),
]

const BY_ID = new Map(SETS.map((set) => [set.id, set]))

/** Ensemble par son identifiant, ou `undefined`. */
export function getSet(id: string): SetDef | undefined {
  return BY_ID.get(id)
}
