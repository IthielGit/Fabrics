import { describe, expect, it } from 'vitest'
import { closedWallAxisAround } from '../documents/construction'
import { createFurnitureElement, createRoomElement, createWallElement } from '../documents/elements'
import { furniturePlacement, setPlacement } from '../library/placement'
import {
  boxSnapLines,
  collectSnapLines,
  elementSnapLines,
  gridOnly,
  movingSnapLines,
  snapBox,
  snapLinesTo,
  type PlacementSnap,
} from './snapLines'

/** Une pièce préfabriquée : face intérieure de `a` à `b`, un mur fermé de 200 mm autour. */
function prefabWall(a: { x: number; y: number }, b: { x: number; y: number }) {
  return createWallElement('Mur', closedWallAxisAround(a, b, 200), 200, 2500)
}

const BEDROOM = { width: 3500, depth: 3200, shell: { thickness: 200, openings: [] } }
const BATHROOM = { width: 2500, depth: 2200, shell: { thickness: 200, openings: [] } }

describe('lignes d’aimantation', () => {
  it('un mur donne son axe et ses deux faces, sans trait ni étiquette', () => {
    const wall = createWallElement('M', [0, 1000, 4000, 1000], 200, 2500)
    const lines = elementSnapLines(wall)
    expect(lines.ys).toEqual(expect.arrayContaining([900, 1000, 1100]))
    expect(lines.ys.every((y) => y >= 900 && y <= 1100)).toBe(true)
  })

  it('un mur fermé donne ses faces extérieures, son axe et ses faces intérieures', () => {
    const lines = elementSnapLines(prefabWall({ x: 1000, y: 1000 }, { x: 4500, y: 4200 }))
    expect(lines.xs).toEqual(expect.arrayContaining([800, 900, 1000, 4500, 4600, 4700]))
    expect(lines.ys).toEqual(expect.arrayContaining([800, 900, 1000, 4200, 4300, 4400]))
  })

  it('une pièce donne ses sommets ; un meuble son emprise et son centre', () => {
    const room = createRoomElement('P', [0, 0, 4000, 0, 4000, 3000, 0, 3000])
    expect(elementSnapLines(room).xs).toEqual([0, 4000, 4000, 0])
    const bed = createFurnitureElement('Lit', 'bed', 100, 200, 1600, 2000)
    expect(elementSnapLines(bed)).toEqual({ xs: [100, 900, 1700], ys: [200, 1200, 2200] })
  })

  it('les éléments masqués et exclus n’attirent pas', () => {
    const shown = createFurnitureElement('A', 'bed', 0, 0, 1000, 1000)
    const hidden = { ...createFurnitureElement('B', 'bed', 5000, 5000, 1000, 1000), hidden: true }
    const lines = collectSnapLines([shown, hidden], new Set([shown.id]))
    expect(lines).toEqual({ xs: [], ys: [] })
  })

  it('un groupe s’aimante par son emprise et ses murs, pas par son mobilier', () => {
    const wall = prefabWall({ x: 0, y: 0 }, { x: 3000, y: 3000 })
    const chair = createFurnitureElement('Chaise', 'chair', 1234, 1234, 450, 450)
    const lines = movingSnapLines([wall, chair])
    expect(lines.xs).not.toContain(1234)
    expect(lines.xs).toEqual(expect.arrayContaining([-200, -100, 0, 3000, 3100, 3200]))
  })
})

describe('snapLinesTo', () => {
  const snap = (targets: { xs: number[]; ys: number[] }): PlacementSnap => ({
    targets,
    threshold: 10,
    grid: 100,
  })

  it('une cible dans la tolérance gagne et affiche un guide', () => {
    const result = snapLinesTo({ xs: [1003], ys: [] }, { x: 1003, y: 0 }, snap({ xs: [1000], ys: [] }))
    expect(result.dx).toBe(-3)
    expect(result.guides).toEqual([{ orientation: 'vertical', position: 1000 }])
  })

  it('sans cible, le coin suit la grille ; le résultat reste en mm entiers', () => {
    const result = snapLinesTo({ xs: [1240.6], ys: [57.2] }, { x: 1240.6, y: 57.2 }, snap({ xs: [], ys: [] }))
    expect(1240.6 + result.dx).toBe(1200)
    expect(57.2 + result.dy).toBe(100)
    expect(result.guides).toEqual([])
  })

  it('sans grille, le coin est arrondi au mm', () => {
    const result = snapLinesTo({ xs: [], ys: [] }, { x: 10.4, y: 20.6 }, gridOnly(null))
    expect(10.4 + result.dx).toBe(10)
    expect(20.6 + result.dy).toBe(21)
  })

  it('une cible hors tolérance est ignorée', () => {
    const result = snapBox({ x: 1020, y: 0, width: 500, height: 500 }, snap({ xs: [1000], ys: [] }))
    expect(result.x).toBe(1000) // par la grille, pas par la cible (20 mm > 10 mm)
    expect(result.guides).toEqual([])
  })
})

describe('pose alignée (cas signalé : chambre et salle de bain côte à côte)', () => {
  it('une pièce préfabriquée a ses faces sur la grille, quelle que soit sa taille', () => {
    // Avant : le centre suivait la grille, donc un mur de 3900 mm hors-tout tombait à 50 mm de la grille.
    const origin = setPlacement(BEDROOM, { x: 3000, y: 3000 }, 100)
    expect((origin.x - 200) % 100).toBe(0)
    expect((origin.y - 200) % 100).toBe(0)
    const bath = setPlacement(BATHROOM, { x: 7000, y: 3000 }, 100)
    expect((bath.x - 200) % 100).toBe(0)
    expect((bath.y - 200) % 100).toBe(0)
  })

  it('la salle de bain posée près de la chambre aligne le haut de son mur sur celui de la chambre', () => {
    const bedroomWall = prefabWall({ x: 1000, y: 1000 }, { x: 4500, y: 4200 }) // face ext. haute à 800
    const snap: PlacementSnap = {
      targets: collectSnapLines([bedroomWall]),
      threshold: 20,
      grid: 100,
    }
    // Curseur : face extérieure haute de la salle de bain à 812 mm, 12 mm trop bas.
    const center = { x: 6500, y: 812 + (2200 + 400) / 2 }
    const bath = setPlacement(BATHROOM, center, snap)
    expect(bath.y - 200).toBe(800)
    expect(bath.guides).toContainEqual({ orientation: 'horizontal', position: 800 })
  })

  it('un meuble se colle contre la face intérieure d’un mur', () => {
    const wall = createWallElement('M', [0, 1000, 5000, 1000], 200, 2500) // face basse à 1100
    const snap: PlacementSnap = { targets: collectSnapLines([wall]), threshold: 20, grid: 100 }
    const bed = furniturePlacement({ width: 1600, depth: 2000 }, { x: 2500, y: 1100 + 1000 + 9 }, snap)
    expect(bed.y).toBe(1100)
  })

  it('les lignes d’une boîte comprennent ses bords rentrés', () => {
    const lines = boxSnapLines({ x: 0, y: 0, width: 1000, height: 600 }, [100])
    expect(lines.xs).toEqual([0, 500, 1000, 100, 900])
    expect(lines.ys).toEqual([0, 300, 600, 100, 500])
  })
})
