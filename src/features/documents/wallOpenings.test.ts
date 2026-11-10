import { describe, expect, it } from 'vitest'
import type { CanvasElement, OpeningElement, WallElement } from '../../types/document'
import { createOpeningElement, createWallElement } from './elements'
import {
  includeWallOpenings,
  openingIdsOfWalls,
  reconcileOpenings,
  withWallOpeningIds,
} from './wallOpenings'

function wall(id: string, points: number[]): WallElement {
  return { ...createWallElement('Mur', points, 200, 2500), id }
}

function door(id: string, wallId: string, offset: number, segmentIndex = 0): OpeningElement {
  return {
    ...createOpeningElement('door', 'Porte', { wallId, segmentIndex, offset, side: 'left' }),
    id,
  }
}

const w1 = wall('w1', [0, 0, 4000, 0])
const w2 = wall('w2', [0, 3000, 4000, 3000])
const d1 = door('d1', 'w1', 1000)
const d2 = door('d2', 'w2', 1000)

describe('openingIdsOfWalls / withWallOpeningIds', () => {
  it('retrouve les ouvertures des murs donnés', () => {
    expect(openingIdsOfWalls([w1, w2, d1, d2], new Set(['w1']))).toEqual(['d1'])
  })

  it('supprimer un mur ajoute ses ouvertures, pas celles des autres murs', () => {
    expect([...withWallOpeningIds([w1, w2, d1, d2], ['w1'])].sort()).toEqual(['d1', 'w1'])
  })

  it('garde les identifiants demandés même sans ouverture', () => {
    expect([...withWallOpeningIds([w1], ['w1'])]).toEqual(['w1'])
  })
})

describe('includeWallOpenings', () => {
  it('ajoute les ouvertures des murs sélectionnés', () => {
    const result = includeWallOpenings([w1, w2, d1, d2], [w1])
    expect(result.map((el) => el.id)).toEqual(['w1', 'd1'])
  })

  it('n’ajoute pas deux fois une ouverture déjà sélectionnée', () => {
    const result = includeWallOpenings([w1, d1], [w1, d1])
    expect(result.map((el) => el.id)).toEqual(['w1', 'd1'])
  })

  it('ne change pas une sélection sans mur', () => {
    expect(includeWallOpenings([w1, d1], [d1]).map((el) => el.id)).toEqual(['d1'])
  })
})

describe('reconcileOpenings', () => {
  const moveWall = (el: WallElement, points: number[]): WallElement => ({ ...el, points })

  it('renvoie la même liste quand aucun mur ne change de forme', () => {
    const next: CanvasElement[] = [w1, d1]
    expect(reconcileOpenings([w1, d1], next)).toBe(next)
  })

  it('ne touche à rien quand un mur est seulement déplacé', () => {
    const next: CanvasElement[] = [moveWall(w1, [500, 200, 4500, 200]), d1]
    expect(reconcileOpenings([w1, d1], next)).toBe(next)
  })

  it('ne touche à rien quand l’épaisseur change', () => {
    const next: CanvasElement[] = [{ ...w1, thickness: 300 }, d1]
    expect(reconcileOpenings([w1, d1], next)).toBe(next)
  })

  it('garde l’ouverture en place quand le mur s’allonge', () => {
    const result = reconcileOpenings([w1, d1], [moveWall(w1, [0, 0, 6000, 0]), d1])
    expect(result[1]).toMatchObject({ id: 'd1', segmentIndex: 0, offset: 1000 })
  })

  it('ramène l’ouverture sur le mur quand il raccourcit', () => {
    const far = door('d1', 'w1', 3500)
    const result = reconcileOpenings([w1, far], [moveWall(w1, [0, 0, 2000, 0]), far])
    expect(result[1]).toMatchObject({ offset: 1550 })
  })

  it('supprime l’ouverture qui ne tient plus', () => {
    const result = reconcileOpenings([w1, d1], [moveWall(w1, [0, 0, 500, 0]), d1])
    expect(result.map((el) => el.id)).toEqual(['w1'])
  })

  it('passe sur le bon segment quand on ajoute un sommet', () => {
    const far = door('d1', 'w1', 3000)
    const result = reconcileOpenings([w1, far], [moveWall(w1, [0, 0, 2000, 0, 4000, 0]), far])
    expect(result[1]).toMatchObject({ segmentIndex: 1, offset: 1000 })
  })

  it('ne touche pas aux ouvertures des autres murs', () => {
    const result = reconcileOpenings([w1, w2, d1, d2], [moveWall(w1, [0, 0, 500, 0]), w2, d1, d2])
    expect(result.map((el) => el.id)).toEqual(['w1', 'w2', 'd2'])
    expect(result[2]).toBe(d2)
  })

  it('rejoue un geste depuis son début : une ouverture écartée un instant revient', () => {
    const base: CanvasElement[] = [w1, d1]
    // Le mur est réduit à 500 : l'ouverture disparaît…
    const short = reconcileOpenings(base, [moveWall(w1, [0, 0, 500, 0]), d1])
    expect(short.map((el) => el.id)).toEqual(['w1'])
    // … puis rallongé : en repartant de la base, elle retrouve sa place d'origine.
    const longAgain = reconcileOpenings(base, [moveWall(w1, [0, 0, 4000, 1]), d1])
    expect(longAgain.map((el) => el.id)).toEqual(['w1', 'd1'])
  })

  it('évite le chevauchement entre deux ouvertures du même mur', () => {
    const a = door('a', 'w1', 500)
    const b = door('b', 'w1', 1500)
    const result = reconcileOpenings([w1, a, b], [moveWall(w1, [0, 0, 2400, 0]), a, b])
    expect(result).toHaveLength(3)
    const [, first, second] = result as [WallElement, OpeningElement, OpeningElement]
    expect(second.offset - second.width / 2).toBeGreaterThanOrEqual(first.offset + first.width / 2)
  })

  it('supprime la seconde ouverture quand les deux ne tiennent plus ensemble', () => {
    const a = door('a', 'w1', 500)
    const b = door('b', 'w1', 1500)
    const result = reconcileOpenings([w1, a, b], [moveWall(w1, [0, 0, 1800, 0]), a, b])
    expect(result.map((el) => el.id)).toEqual(['w1', 'a'])
  })
})
