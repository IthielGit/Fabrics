import { describe, expect, it } from 'vitest'
import type { CanvasElement, Level, OpeningElement, WallElement } from '../../types/document'
import { createOpeningElement, createRoomElement, createWallElement } from '../documents/elements'
import { createLevel } from '../documents/levels'
import { buildBuildingModel } from './model'
import type { WallPiece } from './types'
import { buildWallPieces } from './wallPieces'

const ground = createLevel('Rez-de-chaussée', 0, 2500, 200)
const upper = createLevel('Étage 1', 2500, 2500, 200)

function wallOn(level: Level, points: number[], thickness = 200, height = 2500): WallElement {
  return { ...createWallElement('Mur', points, thickness, height), levelId: level.id }
}

function openingOn(
  wall: WallElement,
  kind: OpeningElement['kind'],
  offset: number,
  size: Partial<Pick<OpeningElement, 'width' | 'height' | 'sillHeight'>> = {},
): OpeningElement {
  return {
    ...createOpeningElement(kind, 'Ouverture', { wallId: wall.id, segmentIndex: 0, offset, side: 'left' }),
    levelId: wall.levelId,
    ...size,
  }
}

/** Vrai si le point (u le long d'un mur horizontal à y = 0, h en hauteur) est dans la matière. */
function solidAt(pieces: readonly WallPiece[], u: number, h: number): boolean {
  return pieces.some(
    (p) =>
      Math.abs(u - p.center.x) < p.size.x / 2 - 1e-6 && Math.abs(h - p.center.y) < p.size.y / 2 - 1e-6,
  )
}

describe('buildWallPieces', () => {
  it('un mur sans ouverture est une seule boîte', () => {
    const wall = wallOn(ground, [0, 0, 4000, 0])
    const pieces = buildWallPieces(wall, [], ground)
    expect(pieces).toHaveLength(1)
    expect(pieces[0].size).toEqual({ x: 4000, y: 2500, z: 200 })
    expect(pieces[0].center).toEqual({ x: 2000, y: 1250, z: 0 })
    expect(pieces[0].rotationY).toBeCloseTo(0)
  })

  it("pose le mur à l'altitude de son niveau", () => {
    const wall = wallOn(upper, [0, 0, 4000, 0])
    const [piece] = buildWallPieces(wall, [], upper)
    expect(piece.center.y).toBe(2500 + 1250)
    expect(piece.levelId).toBe(upper.id)
  })

  it('une fenêtre de 1 200 × 1 000 à 900 mm d’allège laisse un trou à la bonne hauteur', () => {
    const wall = wallOn(ground, [0, 0, 4000, 0])
    const window = openingOn(wall, 'window', 2000, { width: 1200, height: 1000, sillHeight: 900 })
    const pieces = buildWallPieces(wall, [window], ground)

    // Trou : de 1 400 à 2 600 le long du mur, de 900 à 1 900 en hauteur.
    expect(solidAt(pieces, 2000, 1400)).toBe(false)
    expect(solidAt(pieces, 1450, 901)).toBe(false)
    expect(solidAt(pieces, 2550, 1899)).toBe(false)
    // Autour : trumeaux, allège, linteau.
    expect(solidAt(pieces, 2000, 450)).toBe(true) // allège
    expect(solidAt(pieces, 2000, 2200)).toBe(true) // linteau
    expect(solidAt(pieces, 700, 1400)).toBe(true) // trumeau gauche
    expect(solidAt(pieces, 3300, 1400)).toBe(true) // trumeau droit
    expect(solidAt(pieces, 1399, 1400)).toBe(true)
    expect(solidAt(pieces, 2601, 1400)).toBe(true)
    expect(pieces).toHaveLength(4)
  })

  it("une porte n'a pas d'allège : seulement des trumeaux et un linteau", () => {
    const wall = wallOn(ground, [0, 0, 4000, 0])
    const door = openingOn(wall, 'door', 1000, { width: 900, height: 2100, sillHeight: 0 })
    const pieces = buildWallPieces(wall, [door], ground)
    expect(pieces).toHaveLength(3)
    expect(solidAt(pieces, 1000, 100)).toBe(false)
    expect(solidAt(pieces, 1000, 2300)).toBe(true)
  })

  it('une ouverture contre l’extrémité ne crée pas de trumeau vide', () => {
    const wall = wallOn(ground, [0, 0, 4000, 0])
    const door = openingOn(wall, 'door', 450, { width: 900, height: 2100, sillHeight: 0 })
    const pieces = buildWallPieces(wall, [door], ground)
    expect(pieces.every((p) => p.size.x > 0 && p.size.y > 0)).toBe(true)
    expect(pieces).toHaveLength(2) // linteau + trumeau
  })

  it('plusieurs ouvertures : pleine hauteur entre elles', () => {
    const wall = wallOn(ground, [0, 0, 6000, 0])
    const a = openingOn(wall, 'door', 1000, { width: 900, height: 2100 })
    const b = openingOn(wall, 'window', 4000, { width: 1200, height: 1000, sillHeight: 900 })
    const pieces = buildWallPieces(wall, [b, a], ground)
    expect(solidAt(pieces, 2500, 1250)).toBe(true)
    expect(solidAt(pieces, 1000, 1000)).toBe(false)
    expect(solidAt(pieces, 4000, 1400)).toBe(false)
  })

  it('une ouverture plus haute que le mur est coupée à la hauteur du mur', () => {
    const wall = wallOn(ground, [0, 0, 4000, 0])
    const tall = openingOn(wall, 'bay', 2000, { width: 1000, height: 5000, sillHeight: 0 })
    const pieces = buildWallPieces(wall, [tall], ground)
    expect(pieces.every((p) => p.center.y + p.size.y / 2 <= 2500 + 1e-6)).toBe(true)
    expect(pieces).toHaveLength(2)
  })

  it('ignore les ouvertures d’un autre mur ou d’un autre segment', () => {
    const wall = wallOn(ground, [0, 0, 4000, 0])
    const other = wallOn(ground, [0, 1000, 4000, 1000])
    const elsewhere = openingOn(other, 'door', 2000)
    expect(buildWallPieces(wall, [elsewhere], ground)).toHaveLength(1)
    const wrongSegment = { ...openingOn(wall, 'door', 2000), segmentIndex: 3 }
    expect(buildWallPieces(wall, [wrongSegment], ground)).toHaveLength(1)
  })

  it('un mur le long de y du plan tourne de −90° et s’étend en z', () => {
    const wall = wallOn(ground, [0, 0, 0, 3000])
    const [piece] = buildWallPieces(wall, [], ground)
    expect(piece.rotationY).toBeCloseTo(-Math.PI / 2)
    expect(piece.center.x).toBeCloseTo(0)
    expect(piece.center.z).toBeCloseTo(1500)
    expect(piece.size.x).toBeCloseTo(3000)
  })

  it('un angle intérieur est prolongé d’une demi-épaisseur pour boucher le coin', () => {
    const wall = wallOn(ground, [0, 0, 3000, 0, 3000, 2000])
    const pieces = buildWallPieces(wall, [], ground)
    expect(pieces).toHaveLength(2)
    expect(pieces[0].size.x).toBe(3000 + 100) // fin prolongée, début libre
    expect(pieces[1].size.x).toBe(2000 + 100) // début prolongé, fin libre
  })

  it('un tracé fermé est prolongé aux quatre coins', () => {
    const wall = wallOn(ground, [0, 0, 4000, 0, 4000, 3000, 0, 3000, 0, 0])
    const pieces = buildWallPieces(wall, [], ground)
    expect(pieces).toHaveLength(4)
    expect(pieces[0].size.x).toBe(4000 + 200)
    expect(pieces[1].size.x).toBe(3000 + 200)
  })

  it('une épaisseur ou une hauteur nulle ne donne rien', () => {
    expect(buildWallPieces(wallOn(ground, [0, 0, 4000, 0], 0), [], ground)).toEqual([])
    expect(buildWallPieces(wallOn(ground, [0, 0, 4000, 0], 200, 0), [], ground)).toEqual([])
  })

  it('un segment de longueur nulle est ignoré', () => {
    const wall = wallOn(ground, [0, 0, 0, 0, 3000, 0])
    expect(buildWallPieces(wall, [], ground)).toHaveLength(1)
  })
})

describe('buildBuildingModel', () => {
  const rect = (x0: number, y0: number, x1: number, y1: number) => [x0, y0, x1, y0, x1, y1, x0, y1]
  const roomOn = (level: Level, points: number[]) => ({ ...createRoomElement('Pièce', points), levelId: level.id })

  it('un document sans niveaux (Visuel) donne un modèle vide', () => {
    expect(buildBuildingModel({ elements: [], levels: undefined })).toEqual({
      walls: [],
      steps: [],
      chimneys: [],
      slabs: [],
      bounds: null,
    })
  })

  it('une dalle est posée sous chaque pièce, dessus au niveau du sol', () => {
    const room = roomOn(ground, rect(0, 0, 4000, 3000))
    const model = buildBuildingModel({ elements: [room], levels: [ground] })
    const slab = model.slabs.find((s) => s.kind === 'slab')
    expect(slab).toMatchObject({ sourceId: room.id, baseY: -200, thickness: 200 })
    expect(slab?.outline).toHaveLength(4)
  })

  it('le toit plat couvre les pièces du dernier niveau seulement', () => {
    const r0 = roomOn(ground, rect(0, 0, 4000, 3000))
    const r1 = roomOn(upper, rect(0, 0, 4000, 3000))
    const model = buildBuildingModel({ elements: [r0, r1], levels: [ground, upper] })
    const roofs = model.slabs.filter((s) => s.kind === 'roof')
    expect(roofs).toHaveLength(1)
    expect(roofs[0]).toMatchObject({ sourceId: r1.id, baseY: 2500 + 2500 })
    expect(model.slabs.filter((s) => s.kind === 'slab')).toHaveLength(2)
  })

  it('« étage ouvert » : pas de niveaux au-dessus, pas de toit', () => {
    const w0 = wallOn(ground, [0, 0, 4000, 0])
    const w1 = wallOn(upper, [0, 0, 4000, 0])
    const r0 = roomOn(ground, rect(0, 0, 4000, 3000))
    const model = buildBuildingModel(
      { elements: [w0, w1, r0], levels: [ground, upper] },
      { upToLevelId: ground.id },
    )
    expect(model.walls.map((w) => w.levelId)).toEqual([ground.id])
    expect(model.slabs.some((s) => s.kind === 'roof')).toBe(false)
  })

  it('« jusqu’au dernier niveau » garde le toit', () => {
    const r1 = roomOn(upper, rect(0, 0, 4000, 3000))
    const model = buildBuildingModel({ elements: [r1], levels: [ground, upper] }, { upToLevelId: upper.id })
    expect(model.slabs.some((s) => s.kind === 'roof')).toBe(true)
  })

  it('ignore les éléments masqués et les ouvertures masquées', () => {
    const wall = wallOn(ground, [0, 0, 4000, 0])
    const hiddenWall: CanvasElement = { ...wallOn(ground, [0, 500, 4000, 500]), hidden: true }
    const hiddenDoor = { ...openingOn(wall, 'door', 2000), hidden: true }
    const model = buildBuildingModel({ elements: [wall, hiddenWall, hiddenDoor], levels: [ground] })
    expect(model.walls).toHaveLength(1)
  })

  it('une pièce de moins de 3 points est ignorée', () => {
    const room = roomOn(ground, [0, 0, 100, 100])
    expect(buildBuildingModel({ elements: [room], levels: [ground] }).slabs).toEqual([])
  })

  it('un mur sans niveau est rattaché au premier niveau', () => {
    const wall: WallElement = { ...createWallElement('Mur', [0, 0, 4000, 0], 200, 2500), levelId: undefined }
    const model = buildBuildingModel({ elements: [wall], levels: [upper, ground] })
    expect(model.walls[0].levelId).toBe(ground.id)
  })

  it("l'emprise englobe murs, dalles et toit", () => {
    const wall = wallOn(ground, [0, 0, 4000, 0])
    const room = roomOn(ground, rect(0, 0, 4000, 3000))
    const { bounds } = buildBuildingModel({ elements: [wall, room], levels: [ground] })
    expect(bounds).not.toBeNull()
    expect(bounds?.min.x).toBeCloseTo(0)
    expect(bounds?.max.x).toBeCloseTo(4000)
    expect(bounds?.min.z).toBeCloseTo(-100) // le mur d'axe y = 0 déborde d'une demi-épaisseur
    expect(bounds?.max.z).toBeCloseTo(3000)
    expect(bounds?.min.y).toBeCloseTo(-200)
    expect(bounds?.max.y).toBeCloseTo(2700)
  })

  it("l'emprise d'un mur oblique tient compte de l'épaisseur", () => {
    const wall = wallOn(ground, [0, 0, 0, 3000])
    const { bounds } = buildBuildingModel({ elements: [wall], levels: [ground] })
    expect(bounds?.min.x).toBeCloseTo(-100)
    expect(bounds?.max.x).toBeCloseTo(100)
    expect(bounds?.max.z).toBeCloseTo(3000)
  })

  it('un bâtiment de 3 niveaux et 600 murs avec ouvertures se calcule en moins de 200 ms', () => {
    const l2 = createLevel('Étage 2', 5000, 2500, 200)
    const levels = [ground, upper, l2]
    const elements: CanvasElement[] = []
    for (const level of levels) {
      for (let i = 0; i < 200; i++) {
        const wall = wallOn(level, [0, i * 100, 6000, i * 100, 6000, i * 100 + 3000])
        elements.push(wall, openingOn(wall, 'window', 3000, { width: 1200, height: 1000, sillHeight: 900 }))
      }
      elements.push(roomOn(level, rect(0, 0, 6000, 4000)))
    }
    const start = performance.now()
    const model = buildBuildingModel({ elements, levels })
    const elapsed = performance.now() - start
    expect(model.walls.length).toBeGreaterThan(2000)
    expect(elapsed).toBeLessThan(200)
  })

  it('3 niveaux : un mur par niveau, aux bonnes altitudes', () => {
    const l2 = createLevel('Étage 2', 5000, 2500, 200)
    const walls = [ground, upper, l2].map((l) => wallOn(l, [0, 0, 4000, 0]))
    const model = buildBuildingModel({ elements: walls, levels: [ground, upper, l2] })
    expect(model.walls.map((w) => w.center.y)).toEqual([1250, 3750, 6250])
  })
})
