import { describe, expect, it } from 'vitest'
import { cartoucheFields, type CartoucheTexts } from './cartouche'

const texts: CartoucheTexts = {
  scaleLabel: 'Échelle',
  scaleLabelFit: 'Échelle indicative',
  scale: (n) => `1:${n}`,
  scaleFit: (n) => `env. 1:${n}`,
  dateLabel: 'Date',
  sheetLabel: 'Feuille',
}

describe('cartoucheFields', () => {
  it('donne l’échelle, la date et la feuille', () => {
    expect(
      cartoucheFields({ exactScale: true, denominator: 50, date: '11/11/2026', format: 'a3' }, texts),
    ).toEqual([
      { label: 'Échelle', value: '1:50' },
      { label: 'Date', value: '11/11/2026' },
      { label: 'Feuille', value: 'A3' },
    ])
  })

  it('marque l’échelle comme indicative quand le plan est ajusté à la page', () => {
    const [scale] = cartoucheFields(
      { exactScale: false, denominator: 87, date: '11/11/2026', format: 'a4' },
      texts,
    )
    expect(scale).toEqual({ label: 'Échelle indicative', value: 'env. 1:87' })
  })
})
