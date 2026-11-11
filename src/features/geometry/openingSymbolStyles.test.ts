import { describe, expect, it } from 'vitest'
import type { OpeningStyle } from '../../types/document'
import { OPENING_STYLES } from '../openings/styles'
import { openingSymbol } from './openingSymbol'

type Kind = 'door' | 'window' | 'bay'

const symbol = (kind: Kind, style?: OpeningStyle, width = 900) =>
  openingSymbol({ kind, style, width, hinge: 'start', side: 'left' }, 200)

describe('symboles 2D des styles', () => {
  it.each(['door', 'window', 'bay'] as const)(
    'chaque style de %s a un dessin distinct des autres',
    (kind) => {
      const drawings = OPENING_STYLES[kind].map(({ style }) =>
        JSON.stringify(symbol(kind, style, 1200)),
      )
      expect(new Set(drawings).size).toBe(drawings.length)
    },
  )

  it('sans style, le dessin est celui du style par défaut (aucun changement pour les anciens projets)', () => {
    expect(symbol('door')).toEqual(symbol('door', 'swing'))
    expect(symbol('window')).toEqual(symbol('window', 'casement2'))
    expect(symbol('bay')).toEqual(symbol('bay', 'bay-sliding'))
  })

  it('un style d\'un autre type retombe sur le dessin par défaut', () => {
    expect(symbol('door', 'casement2')).toEqual(symbol('door'))
  })

  it('la découpe du mur ne dépend pas du style', () => {
    for (const { style } of OPENING_STYLES.door) {
      expect(symbol('door', style).cut).toEqual(symbol('door').cut)
    }
  })

  it('le dessin reste dans la largeur de l\'ouverture pour les styles à battants (pas de dépassement latéral)', () => {
    for (const style of ['swing', 'double', 'swingBoth'] as const) {
      const { lines } = symbol('door', style)
      for (const line of lines) {
        for (let i = 0; i < line.length; i += 2) {
          expect(Math.abs(line[i])).toBeLessThanOrEqual(450 + 1e-6)
        }
      }
    }
  })

  it('la porte double a deux battants de la moitié de la largeur', () => {
    const { lines } = symbol('door', 'double', 1400)
    // 2 montants, puis (battant + arc) × 2
    expect(lines).toHaveLength(6)
    expect(lines[2]).toEqual([-700, 0, -700, 700])
    expect(lines[4]).toEqual([700, 0, 700, 700])
  })

  it('le va-et-vient s\'ouvre des deux côtés du mur', () => {
    const leaves = symbol('door', 'swingBoth').lines.filter((line) => line.length === 4 && line[0] === line[2])
    const ys = leaves.map((line) => line[3]).sort((a, b) => a - b)
    expect(ys).toContain(900)
    expect(ys).toContain(-900)
  })

  it('la galandage dessine en pointillé la place du vantail dans le mur, du côté des gonds', () => {
    const { dashed } = symbol('door', 'slidingPocket')
    expect(dashed).toHaveLength(1)
    const xs = dashed[0].filter((_, index) => index % 2 === 0)
    // gonds au début : le vantail rentre côté début (x négatif), sur une largeur de porte
    expect(Math.min(...xs)).toBe(-450 - 900)
    expect(Math.max(...xs)).toBe(-450)
  })

  it('la porte de garage sectionnelle a des rails en pointillé, la basculante un panneau qui sort', () => {
    expect(symbol('door', 'garageSectional', 2400).dashed.length).toBeGreaterThan(0)
    const tilt = symbol('door', 'garageTilt', 2400).dashed
    expect(tilt).toHaveLength(1)
    // Le panneau sort du côté opposé à l'ouverture des portes (y négatif pour side = left).
    expect(Math.min(...tilt[0].filter((_, index) => index % 2 === 1))).toBeLessThan(0)
  })

  it('une fenêtre fixe a un seul trait de vitrage plein, un soufflet un trait en pointillé', () => {
    const fixed = symbol('window', 'fixed')
    expect(fixed.dashed).toHaveLength(0)
    expect(fixed.lines).toContainEqual([-450, 0, 450, 0])
    expect(symbol('window', 'tilt').dashed).toEqual([[-450, 0, 450, 0]])
  })

  it('l\'ouverture libre a des seuils en pointillé sur les deux faces du mur', () => {
    expect(symbol('bay', 'free', 1000).dashed).toHaveLength(2)
  })

  it('l\'oscillo-battant ne change pas le plan', () => {
    const plain = openingSymbol({ kind: 'window', style: 'casement1', width: 700, hinge: 'start', side: 'left' }, 200)
    expect(plain).toEqual(symbol('window', 'casement1', 700))
  })
})
