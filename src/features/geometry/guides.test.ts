import { describe, expect, it } from 'vitest'
import { computeSnap } from './guides'

const box = (x: number, y: number, width: number, height: number) => ({ x, y, width, height })

describe('computeSnap', () => {
  const other = box(100, 100, 50, 50) // lignes x : 100, 125, 150 — lignes y : 100, 125, 150

  it('aimante le bord gauche sur le bord gauche d’un voisin', () => {
    // lignes x de la boîte : 103, 108, 113 → seul 103 → 100 est dans la tolérance
    const result = computeSnap(box(103, 300, 10, 10), [other], 8)
    expect(result.dx).toBe(-3)
    expect(result.guides).toContainEqual({ orientation: 'vertical', position: 100 })
  })

  it('aimante le centre sur le centre d’un voisin', () => {
    // lignes x : 118, 128, 138 → le centre 128 → 125
    const result = computeSnap(box(118, 300, 20, 10), [other], 8)
    expect(result.dx).toBe(-3)
    expect(result.guides).toContainEqual({ orientation: 'vertical', position: 125 })
  })

  it('aimante le bord droit sur le bord gauche d’un voisin', () => {
    // lignes x : 60, 78, 96 → le bord droit 96 → 100
    const result = computeSnap(box(60, 300, 36, 10), [other], 8)
    expect(result.dx).toBe(4)
  })

  it('ne fait rien au-delà de la tolérance', () => {
    const result = computeSnap(box(300, 300, 40, 40), [other], 8)
    expect(result).toEqual({ dx: 0, dy: 0, guides: [] })
  })

  it('choisit la correction la plus petite', () => {
    // lignes x : 103, 123, 143 → corrections possibles −3, +2, +7 : +2 gagne
    const result = computeSnap(box(103, 300, 40, 40), [other], 8)
    expect(result.dx).toBe(2)
  })

  it('aimante en x et en y à la fois', () => {
    // lignes x : 103, 106, 109 et lignes y idem → −3 sur chaque axe
    const result = computeSnap(box(103, 103, 6, 6), [other], 8)
    expect(result.dx).toBe(-3)
    expect(result.dy).toBe(-3)
    expect(result.guides).toEqual([
      { orientation: 'vertical', position: 100 },
      { orientation: 'horizontal', position: 100 },
    ])
  })

  it('s’aimante sur le centre de la page', () => {
    const page = box(0, 0, 1000, 1000)
    const result = computeSnap(box(495, 10, 10, 10), [page], 8) // centre x = 500
    expect(result.dx).toBe(0)
    expect(result.guides).toContainEqual({ orientation: 'vertical', position: 500 })
  })

  it('ne signale qu’une seule fois une position partagée par plusieurs voisins', () => {
    // a et b ont le même centre x (105), la boîte aussi : aucune correction, un seul guide à 105
    const a = box(100, 0, 10, 10)
    const b = box(100, 500, 10, 10)
    const result = computeSnap(box(102, 200, 6, 20), [a, b], 8)
    expect(result.dx).toBe(0)
    expect(result.guides.filter((g) => g.orientation === 'vertical')).toEqual([
      { orientation: 'vertical', position: 105 },
    ])
  })

  it('fonctionne sans aucune cible', () => {
    expect(computeSnap(box(0, 0, 10, 10), [], 8)).toEqual({ dx: 0, dy: 0, guides: [] })
  })
})
