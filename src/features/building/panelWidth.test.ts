import { describe, expect, it } from 'vitest'
import {
  VIEWER_DEFAULT_WIDTH,
  VIEWER_MIN_WIDTH,
  VIEWER_RESERVED_WIDTH,
  clampViewerWidth,
} from './panelWidth'

describe('clampViewerWidth', () => {
  it('garde une largeur raisonnable telle quelle', () => {
    expect(clampViewerWidth(500, 1600)).toBe(500)
  })

  it('ne descend pas sous le minimum', () => {
    expect(clampViewerWidth(100, 1600)).toBe(VIEWER_MIN_WIDTH)
  })

  it('laisse de la place au plan et aux panneaux', () => {
    expect(clampViewerWidth(5000, 1600)).toBe(1600 - VIEWER_RESERVED_WIDTH)
  })

  it('sur une fenêtre très étroite, le minimum l’emporte', () => {
    expect(clampViewerWidth(600, 700)).toBe(VIEWER_MIN_WIDTH)
  })

  it('arrondit au pixel', () => {
    expect(clampViewerWidth(400.6, 1600)).toBe(401)
  })

  it('une valeur invalide revient à la largeur par défaut', () => {
    expect(clampViewerWidth(Number.NaN, 1600)).toBe(VIEWER_DEFAULT_WIDTH)
    expect(clampViewerWidth(Number.NaN, 800)).toBe(VIEWER_MIN_WIDTH)
  })
})
