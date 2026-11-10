import { beforeEach, describe, expect, it } from 'vitest'
import { clearClipboard, copyToClipboard, takePasteCopies } from './clipboard'
import { createRectElement } from './elements'

beforeEach(() => clearClipboard())

describe('presse-papiers', () => {
  it('est vide au départ', () => {
    expect(takePasteCopies('px')).toEqual({ status: 'empty' })
  })

  it('colle des copies avec de nouveaux identifiants, décalées', () => {
    const rect = createRectElement('R', 100, 100, 50, 50)
    copyToClipboard([rect], 'px')
    const result = takePasteCopies('px')
    expect(result.status).toBe('ok')
    if (result.status !== 'ok') return
    expect(result.elements).toHaveLength(1)
    expect(result.elements[0].id).not.toBe(rect.id)
    expect(result.elements[0]).toMatchObject({ x: 120, y: 120 })
  })

  it('décale davantage à chaque collage', () => {
    copyToClipboard([createRectElement('R', 0, 0, 10, 10)], 'px')
    const first = takePasteCopies('px')
    const second = takePasteCopies('px')
    if (first.status !== 'ok' || second.status !== 'ok') throw new Error('collage attendu')
    expect(first.elements[0].x).toBe(20)
    expect(second.elements[0].x).toBe(40)
  })

  it('refuse de coller entre un visuel (px) et un plan (mm)', () => {
    copyToClipboard([createRectElement('R', 0, 0, 10, 10)], 'px')
    expect(takePasteCopies('mm')).toEqual({ status: 'unit-mismatch' })
  })

  it('n’est pas modifié si l’élément d’origine change après la copie', () => {
    const rect = createRectElement('R', 0, 0, 10, 10)
    copyToClipboard([rect], 'px')
    rect.x = 999
    const result = takePasteCopies('px')
    if (result.status !== 'ok') throw new Error('collage attendu')
    expect(result.elements[0].x).toBe(20)
  })

  it('copier une liste vide vide le presse-papiers', () => {
    copyToClipboard([createRectElement('R', 0, 0, 10, 10)], 'px')
    copyToClipboard([], 'px')
    expect(takePasteCopies('px')).toEqual({ status: 'empty' })
  })
})
