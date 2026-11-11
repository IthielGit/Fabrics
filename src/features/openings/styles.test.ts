import { describe, expect, it } from 'vitest'
import { OPENING_DEFAULTS } from '../documents/elements'
import {
  defaultStyle,
  hasPocketRoom,
  isStyleAllowed,
  OPENING_STYLES,
  openingStyle,
  QUICK_SIZES,
  quickSizesFor,
  styleSize,
  supportsTiltTurn,
} from './styles'

describe('catalogue des styles', () => {
  it('propose 8 styles de porte, 5 de fenêtre et 3 de baie, sans doublon', () => {
    expect(OPENING_STYLES.door).toHaveLength(8)
    expect(OPENING_STYLES.window).toHaveLength(5)
    expect(OPENING_STYLES.bay).toHaveLength(3)
    const all = [...OPENING_STYLES.door, ...OPENING_STYLES.window, ...OPENING_STYLES.bay].map(
      (def) => def.style,
    )
    expect(new Set(all).size).toBe(all.length)
  })

  it('le premier style de chaque type est le dessin d\'avant, à la taille par défaut d\'avant', () => {
    expect(defaultStyle('door')).toBe('swing')
    expect(defaultStyle('window')).toBe('casement2')
    expect(defaultStyle('bay')).toBe('bay-sliding')
    for (const kind of ['door', 'window', 'bay'] as const) {
      expect(styleSize(kind, defaultStyle(kind))).toEqual(OPENING_DEFAULTS[kind])
    }
  })

  it('donne les tailles par défaut de la roadmap', () => {
    expect(styleSize('door', 'double')).toEqual({ width: 1400, height: 2100, sillHeight: 0 })
    expect(styleSize('door', 'garageSectional')).toEqual({ width: 2400, height: 2000, sillHeight: 0 })
    expect(styleSize('window', 'casement1')).toEqual({ width: 700, height: 1200, sillHeight: 900 })
    expect(styleSize('window', 'sliding')).toEqual({ width: 1500, height: 1200, sillHeight: 900 })
    expect(styleSize('window', 'tilt')).toEqual({ width: 600, height: 400, sillHeight: 1600 })
    expect(styleSize('bay', 'free')).toEqual({ width: 1000, height: 2100, sillHeight: 0 })
  })

  it('refuse un style d\'un autre type', () => {
    expect(isStyleAllowed('door', 'double')).toBe(true)
    expect(isStyleAllowed('door', 'casement2')).toBe(false)
    expect(isStyleAllowed('window', 'free')).toBe(false)
    expect(styleSize('window', 'swing')).toBeNull()
  })

  it('une ouverture sans style, ou avec un style invalide, a le style par défaut', () => {
    expect(openingStyle({ kind: 'door' })).toBe('swing')
    expect(openingStyle({ kind: 'window', style: 'garageTilt' })).toBe('casement2')
    expect(openingStyle({ kind: 'bay', style: 'free' })).toBe('free')
  })

  it('l\'oscillo-battant existe pour les fenêtres à vantaux seulement', () => {
    expect(supportsTiltTurn('casement1')).toBe(true)
    expect(supportsTiltTurn('casement2')).toBe(true)
    expect(supportsTiltTurn('fixed')).toBe(false)
    expect(supportsTiltTurn('sliding')).toBe(false)
    expect(supportsTiltTurn('swing')).toBe(false)
  })
})

describe('tailles rapides', () => {
  it('reprennent la roadmap, chacune avec un style permis pour son type', () => {
    const byId = Object.fromEntries(QUICK_SIZES.map((quick) => [quick.id, quick]))
    expect(byId.entryDoor).toMatchObject({ kind: 'door', style: 'swing', width: 1000, height: 2150 })
    expect(byId.frenchWindow1).toMatchObject({ kind: 'window', sillHeight: 0, height: 2150 })
    expect(byId.frenchWindow2).toMatchObject({ kind: 'window', sillHeight: 0, height: 2150 })
    expect(byId.shopWindow).toMatchObject({ kind: 'bay', style: 'bay-fixed', width: 3000, height: 2200 })
    expect(byId.passThrough).toMatchObject({
      kind: 'bay',
      style: 'free',
      width: 600,
      height: 600,
      sillHeight: 1000,
    })
    for (const quick of QUICK_SIZES) expect(isStyleAllowed(quick.kind, quick.style)).toBe(true)
  })

  it('sont rangées par type', () => {
    expect(quickSizesFor('door').map((q) => q.id)).toEqual(['entryDoor'])
    expect(quickSizesFor('window').map((q) => q.id)).toEqual(['frenchWindow1', 'frenchWindow2'])
    expect(quickSizesFor('bay').map((q) => q.id)).toEqual(['shopWindow', 'passThrough'])
  })
})

describe('hasPocketRoom (galandage)', () => {
  it('accepte une porte avec assez de mur libre d\'un côté', () => {
    expect(hasPocketRoom(2000, 900, 4000, [])).toBe(true)
    expect(hasPocketRoom(500, 900, 4000, [])).toBe(true) // peu de place avant, beaucoup après
  })

  it('refuse un mur trop court des deux côtés', () => {
    expect(hasPocketRoom(750, 900, 1500, [])).toBe(false)
  })

  it('compte le mur libre jusqu\'à la voisine, pas jusqu\'au bout du segment', () => {
    // Porte 900 au centre de 4000 ; voisines collées de chaque côté : aucune place.
    const neighbours = [
      { from: 700, to: 1550 },
      { from: 2450, to: 3300 },
    ]
    expect(hasPocketRoom(2000, 900, 4000, neighbours)).toBe(false)
    // Une seule voisine collée : il reste la place de l'autre côté.
    expect(hasPocketRoom(2000, 900, 4000, [neighbours[0]])).toBe(true)
  })

  it('accepte exactement la largeur', () => {
    expect(hasPocketRoom(1350, 900, 2700, [])).toBe(true) // 900 mm de chaque côté
  })
})
