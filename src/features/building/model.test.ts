import { describe, expect, it } from 'vitest'
import type { CanvasElement, Level, OpeningElement, WallElement } from '../../types/document'
import { createOpeningElement, createRoomElement, createWallElement } from '../documents/elements'
import { createLevel } from '../documents/levels'
import { buildBuildingModel } from './model'
import type { WallPiece } from './types'
import { buildOpeningFills } from './openingFills'
import { buildWallMesh } from './wallMesh'
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
      wallMeshes: [],
      steps: [],
      chimneys: [],
      slabs: [],
      fills: [],
      marks: [],
      bounds: null,
    })
  })

  it('une dalle est posée sous chaque pièce, dessus au niveau du sol', () => {
    const room = roomOn(ground, rect(0, 0, 4000, 3000))
    const model = buildBuildingModel({ elements: [room], levels: [ground] })
    const slab = model.slabs.find((s) => s.kind === 'slab')
    expect(slab).toMatchObject({ sourceId: room.id, baseY: -200, thickness: 200, onGround: true })
    expect(slab?.outline).toHaveLength(4)
  })

  it('seule la dalle du niveau le plus bas est marquée « sous le terrain »', () => {
    const r0 = roomOn(ground, rect(0, 0, 4000, 3000))
    const r1 = roomOn(upper, rect(0, 0, 4000, 3000))
    const model = buildBuildingModel({ elements: [r0, r1], levels: [ground, upper] })
    const slabs = model.slabs.filter((s) => s.kind === 'slab')
    expect(slabs.find((s) => s.sourceId === r0.id)?.onGround).toBe(true)
    expect(slabs.find((s) => s.sourceId === r1.id)?.onGround).toBeUndefined()
  })

  it('le toit est pris entre les murs : son dessus est au haut des murs', () => {
    const r0 = roomOn(ground, rect(0, 0, 4000, 3000))
    const roof = buildBuildingModel({ elements: [r0], levels: [ground] }).slabs.find((s) => s.kind === 'roof')
    expect(roof).toMatchObject({ baseY: 2500 - 200, thickness: 200 })
  })

  it('une pièce du rez sans étage au-dessus reçoit aussi un toit', () => {
    const house = roomOn(ground, rect(0, 0, 4000, 3000))
    const annex = roomOn(ground, rect(4200, 0, 7000, 3000))
    const upstairs = roomOn(upper, rect(0, 0, 4000, 3000))
    const model = buildBuildingModel({ elements: [house, annex, upstairs], levels: [ground, upper] })
    const roofs = model.slabs.filter((s) => s.kind === 'roof')
    expect(roofs.map((r) => r.sourceId).sort()).toEqual([annex.id, upstairs.id].sort())
    expect(roofs.find((r) => r.sourceId === annex.id)?.baseY).toBe(2500 - 200)
  })

  it('le toit plat couvre les pièces du dernier niveau seulement', () => {
    const r0 = roomOn(ground, rect(0, 0, 4000, 3000))
    const r1 = roomOn(upper, rect(0, 0, 4000, 3000))
    const model = buildBuildingModel({ elements: [r0, r1], levels: [ground, upper] })
    const roofs = model.slabs.filter((s) => s.kind === 'roof')
    expect(roofs).toHaveLength(1)
    expect(roofs[0]).toMatchObject({ sourceId: r1.id, baseY: 2500 + 2500 - 200 })
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
    expect(bounds?.max.y).toBeCloseTo(2500) // le toit est pris entre les murs
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

describe('buildOpeningFills', () => {
  it('une fenêtre à deux vantaux (style par défaut) a un cadre, un montant central et deux vitres', () => {
    const wall = wallOn(ground, [0, 0, 4000, 0])
    const window = openingOn(wall, 'window', 2000, { width: 1200, height: 1000, sillHeight: 900 })
    const fills = buildOpeningFills(wall, [window], ground)
    expect(fills.filter((f) => f.kind === 'frame')).toHaveLength(5) // 4 côtés + montant central
    const glass = fills.filter((f) => f.kind === 'glass').sort((a, b) => a.center.x - b.center.x)
    expect(glass).toHaveLength(2)
    // Largeur libre 1080, montant central de 60 : deux vitres de 510, de part et d'autre du centre.
    expect(glass[0].center).toMatchObject({ x: 1715, y: 900 + 500, z: 0 })
    expect(glass[1].center).toMatchObject({ x: 2285, y: 900 + 500, z: 0 })
    expect(glass[0].size).toMatchObject({ x: 510, y: 1000 - 120 })
    expect(glass[0].sourceId).toBe(wall.id)
  })

  it('une fenêtre fixe ou à un vantail n\'a qu\'une vitre, sans montant', () => {
    const wall = wallOn(ground, [0, 0, 4000, 0])
    for (const style of ['fixed', 'casement1', 'tilt'] as const) {
      const window = {
        ...openingOn(wall, 'window', 2000, { width: 1200, height: 1000, sillHeight: 900 }),
        style,
      }
      const fills = buildOpeningFills(wall, [window], ground)
      expect(fills.filter((f) => f.kind === 'frame')).toHaveLength(4)
      const glass = fills.filter((f) => f.kind === 'glass')
      expect(glass).toHaveLength(1)
      expect(glass[0].size).toMatchObject({ x: 1080, y: 880 })
    }
  })

  it('une porte a un vantail jusqu’au sol et pas de traverse basse', () => {
    const wall = wallOn(ground, [0, 0, 4000, 0])
    const door = openingOn(wall, 'door', 1000, { width: 900, height: 2100, sillHeight: 0 })
    const fills = buildOpeningFills(wall, [door], ground)
    expect(fills.filter((f) => f.kind === 'frame')).toHaveLength(3)
    const leaf = fills.find((f) => f.kind === 'door')!
    expect(leaf.center.y - leaf.size.y / 2).toBe(0)
    expect(leaf.center.y + leaf.size.y / 2).toBe(2100 - 60)
  })

  it('ignore les ouvertures des autres murs', () => {
    const wall = wallOn(ground, [0, 0, 4000, 0])
    const other = wallOn(ground, [0, 1000, 4000, 1000])
    const window = openingOn(other, 'window', 2000)
    expect(buildOpeningFills(wall, [window], ground)).toEqual([])
  })
})

/** Surface (mm²) des triangles du maillage tournés vers `normal`. */
function areaFacing(positions: readonly number[], normal: { x: number; y: number; z: number }): number {
  let area = 0
  for (let i = 0; i < positions.length; i += 9) {
    const [ax, ay, az, bx, by, bz, cx, cy, cz] = positions.slice(i, i + 9)
    const e1 = { x: bx - ax, y: by - ay, z: bz - az }
    const e2 = { x: cx - ax, y: cy - ay, z: cz - az }
    const cross = { x: e1.y * e2.z - e1.z * e2.y, y: e1.z * e2.x - e1.x * e2.z, z: e1.x * e2.y - e1.y * e2.x }
    const length = Math.hypot(cross.x, cross.y, cross.z)
    if (length === 0) continue
    const dot = (cross.x * normal.x + cross.y * normal.y + cross.z * normal.z) / length
    if (dot > 0.999) area += length / 2
  }
  return area
}

describe('buildWallMesh', () => {
  it('un mur droit sans ouverture : 6 faces, toutes tournées vers l’extérieur', () => {
    const wall = wallOn(ground, [0, 0, 4000, 0])
    const mesh = buildWallMesh(wall, [], ground)!
    expect(mesh.positions).toHaveLength(6 * 6 * 3)
    expect(areaFacing(mesh.positions, { x: 0, y: 0, z: 1 })).toBeCloseTo(4000 * 2500)
    expect(areaFacing(mesh.positions, { x: 0, y: 0, z: -1 })).toBeCloseTo(4000 * 2500)
    expect(areaFacing(mesh.positions, { x: 0, y: 1, z: 0 })).toBeCloseTo(4000 * 200)
    expect(areaFacing(mesh.positions, { x: -1, y: 0, z: 0 })).toBeCloseTo(200 * 2500)
    // Chaque normale stockée est celle du triangle (sens trigonométrique vu de l'extérieur).
    for (let i = 0; i < mesh.positions.length; i += 9) {
      const n = { x: mesh.normals[i], y: mesh.normals[i + 1], z: mesh.normals[i + 2] }
      const triangle = mesh.positions.slice(i, i + 9)
      expect(areaFacing(triangle, n)).toBeGreaterThan(0)
    }
  })

  it('une fenêtre est découpée : façade moins l’ouverture, appui et sous-face du linteau', () => {
    const wall = wallOn(ground, [0, 0, 4000, 0])
    const window = openingOn(wall, 'window', 2000, { width: 1200, height: 1000, sillHeight: 900 })
    const mesh = buildWallMesh(wall, [window], ground)!
    expect(areaFacing(mesh.positions, { x: 0, y: 0, z: 1 })).toBeCloseTo(4000 * 2500 - 1200 * 1000)
    // Dessus du mur + appui de la fenêtre.
    expect(areaFacing(mesh.positions, { x: 0, y: 1, z: 0 })).toBeCloseTo(4000 * 200 + 1200 * 200)
    // Dessous du mur + sous-face du linteau.
    expect(areaFacing(mesh.positions, { x: 0, y: -1, z: 0 })).toBeCloseTo(4000 * 200 + 1200 * 200)
    // Bout libre du mur + tableau gauche de la fenêtre (vers -x), et pareil vers +x.
    expect(areaFacing(mesh.positions, { x: -1, y: 0, z: 0 })).toBeCloseTo(200 * 2500 + 200 * 1000)
    expect(areaFacing(mesh.positions, { x: 1, y: 0, z: 0 })).toBeCloseTo(200 * 2500 + 200 * 1000)
  })

  it('une porte touche le sol : pas de dessous dans l’ouverture', () => {
    const wall = wallOn(ground, [0, 0, 4000, 0])
    const door = openingOn(wall, 'door', 2000, { width: 900, height: 2100, sillHeight: 0 })
    const mesh = buildWallMesh(wall, [door], ground)!
    expect(areaFacing(mesh.positions, { x: 0, y: -1, z: 0 })).toBeCloseTo((4000 - 900) * 200 + 900 * 200)
    expect(areaFacing(mesh.positions, { x: 0, y: 0, z: 1 })).toBeCloseTo(4000 * 2500 - 900 * 2100)
  })

  it('aux angles d’un mur fermé, aucun chant n’est dessiné', () => {
    const wall = wallOn(ground, [0, 0, 4000, 0, 4000, 3000, 0, 3000, 0, 0])
    const mesh = buildWallMesh(wall, [], ground)!
    // 4 segments × (devant, derrière, dessus, dessous) = 16 faces, sans chant.
    expect(mesh.positions).toHaveLength(16 * 6 * 3)
  })

  it('suit l’altitude du niveau', () => {
    const wall = wallOn(upper, [0, 0, 4000, 0])
    const ys = buildWallMesh(wall, [], upper)!.positions.filter((_, i) => i % 3 === 1)
    expect(Math.min(...ys)).toBe(2500)
    expect(Math.max(...ys)).toBe(5000)
  })
})
