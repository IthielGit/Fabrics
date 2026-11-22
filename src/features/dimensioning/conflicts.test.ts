import { describe, expect, it } from 'vitest'
import { textBox, textConflicts } from './conflicts'

describe('conflits d’annotations (M20 20.2)', () => {
  it('deux textes qui se recouvrent forment un conflit ; deux textes éloignés non', () => {
    const t = (x: number, y: number, text = '3500') => ({ x, y, text, size: 100, anchor: 'middle' as const })
    expect(textConflicts({ texts: [t(0, 0), t(50, 0)] })).toEqual([[0, 1]])
    expect(textConflicts({ texts: [t(0, 0), t(1000, 0)] })).toEqual([])
  })

  it('taille imprimée : un nom en gras est agrandi à 10 pt (1:50 → 176 mm de dessin)', () => {
    const name = { x: 0, y: 0, text: 'Chambre', size: 125, bold: true }
    const box = textBox(name, 50)
    // 7 caractères × 0,64 em × 176,4 mm ≈ 790 mm, moins 10 % de marge.
    expect(box.x1 - box.x0).toBeGreaterThan(690)
    expect(textBox(name, 1).x1 - textBox(name, 1).x0).toBeLessThan(600)
  })

  it('un texte vertical (−90°) a un cadre vertical', () => {
    const box = textBox({ x: 0, y: 0, text: '12345', size: 100, angle: -90, anchor: 'middle' })
    expect(box.y1 - box.y0).toBeGreaterThan(box.x1 - box.x0)
  })
})
