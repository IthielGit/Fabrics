import { describe, expect, it } from 'vitest'
import { annotationGraphics } from './annotationGraphics'

describe('cotes automatiques en traits de dessin', () => {
  it('une cote horizontale : ligne, deux lignes d’attache, deux traits obliques, un texte droit', () => {
    const { lines, texts } = annotationGraphics(
      { dimensions: [{ id: 'd', points: [0, 0, 6000, 0], offset: -800 }], labels: [] },
      100,
    )
    expect(lines).toHaveLength(5)
    expect(lines[0]).toMatchObject({ x1: 0, y1: -800, x2: 6000, y2: -800 })
    expect(texts).toEqual([{ x: 3000, y: -835, text: '6000', size: 100, anchor: 'middle' }])
  })

  it('une cote verticale : texte tourné de -90°, lu de bas en haut', () => {
    const { texts } = annotationGraphics(
      { dimensions: [{ id: 'd', points: [0, 0, 0, 4200], offset: 800 }], labels: [] },
      100,
    )
    expect(texts[0].angle).toBe(-90)
    expect(texts[0].text).toBe('4200')
  })

  it('une chaîne intérieure (décalage nul) n’a pas de lignes d’attache', () => {
    const { lines } = annotationGraphics(
      { dimensions: [{ id: 'd', points: [0, 0, 200, 0], offset: 0 }], labels: [] },
      100,
    )
    expect(lines).toHaveLength(3)
  })

  it('une étiquette : une ligne de texte par ligne, la première en gras', () => {
    const { texts } = annotationGraphics(
      { dimensions: [], labels: [{ id: 'l', x: 0, y: 0, lines: ['Chambre', '4000 × 3000', '12,00 m²'] }] },
      100,
    )
    expect(texts.map((t) => [t.text, t.bold])).toEqual([
      ['Chambre', true],
      ['4000 × 3000', false],
      ['12,00 m²', false],
    ])
  })
})
