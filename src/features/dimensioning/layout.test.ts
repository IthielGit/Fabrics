import { describe, expect, it } from 'vitest'
import { dimensionObstacles, dimensionTextRow, labelBox, placeLabels } from './layout'

describe('mise en page des textes des cotes', () => {
  it('le chiffre tient entre les traits : au-dessus, au milieu', () => {
    expect(dimensionTextRow(3600, '3600', 180)).toBe('above')
  })

  it('petite cote : en alternance un rang plus haut ou sous la ligne', () => {
    expect(dimensionTextRow(200, '200', 180, 0)).toBe('above2')
    expect(dimensionTextRow(200, '200', 180, 1)).toBe('below')
    expect(dimensionTextRow(200, '200', 180, 2)).toBe('above2')
  })

  it('une étiquette occupe la largeur de sa plus longue ligne', () => {
    const box = labelBox(['F01', '1200 / 1350'], 0, 0, 100)
    expect(box.maxX - box.minX).toBeCloseTo(11 * 0.56 * 100 + 40)
    expect(box.maxY - box.minY).toBeCloseTo(2 * 125 + 20)
  })

  it('une étiquette qui en chevauche une autre prend son autre emplacement', () => {
    const placed = placeLabels(
      [
        { id: 'room', x: 0, y: 0, lines: ['Salle de bain', '5,50 m²'] },
        { id: 'door', x: 0, y: 100, lines: ['P01', '800 / 2100'], alternatives: [{ x: 0, y: 2000 }] },
      ],
      180,
    )
    expect(placed[0]).toEqual({ id: 'room', x: 0, y: 0, lines: ['Salle de bain', '5,50 m²'] })
    expect(placed[1]).toEqual({ id: 'door', x: 0, y: 2000, lines: ['P01', '800 / 2100'] })
  })

  it('sans emplacement libre : celui qui chevauche le moins', () => {
    const placed = placeLabels(
      [
        { id: 'a', x: 0, y: 0, lines: ['AAAAAAAA'] },
        { id: 'b', x: 0, y: 0, lines: ['B'], alternatives: [{ x: 300, y: 0 }] },
      ],
      100,
    )
    expect(placed[1].x).toBe(300)
  })

  it('une étiquette évite les lignes et les chiffres des cotes', () => {
    // Chaîne horizontale qui passe juste sous l'étiquette d'une pièce.
    const obstacles = dimensionObstacles([{ id: 'c', points: [-2000, 300, 2000, 300], offset: 0 }], 180)
    const [label] = placeLabels([{ id: 'room', x: 0, y: 300, lines: ['Chambre', '12,00 m²'] }], 180, obstacles)
    const box = labelBox(label.lines, label.x, label.y, 180)
    expect(box.maxY < 300 - 45 || box.minY > 300 + 45).toBe(true)
  })

  it('une étiquette de pièce reste dans sa pièce quand c’est possible', () => {
    const obstacles = dimensionObstacles([{ id: 'c', points: [0, 300, 4000, 300], offset: 0 }], 180)
    const bounds = { minX: 0, minY: 0, maxX: 4000, maxY: 3000 }
    const [label] = placeLabels([{ id: 'room', x: 2000, y: 300, lines: ['Chambre'], bounds }], 180, obstacles)
    expect(label.y).toBeGreaterThan(300)
    expect(label.y).toBeLessThan(3000)
    expect(label.bounds).toBeUndefined()
  })
})
