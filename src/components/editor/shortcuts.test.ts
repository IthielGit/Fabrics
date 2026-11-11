import { describe, expect, it } from 'vitest'
import { resolveShortcut, type KeyInput } from './shortcuts'

const key = (k: string, mods: Partial<KeyInput> = {}): KeyInput => ({
  key: k,
  ctrlKey: false,
  metaKey: false,
  shiftKey: false,
  altKey: false,
  ...mods,
})

describe('resolveShortcut', () => {
  it('choisit les outils avec V, R, O, L, T', () => {
    expect(resolveShortcut(key('t'))).toBe('tool-text')
    expect(resolveShortcut(key('v'))).toBe('tool-select')
    expect(resolveShortcut(key('r'))).toBe('tool-rect')
    expect(resolveShortcut(key('o'))).toBe('tool-ellipse')
    expect(resolveShortcut(key('l'))).toBe('tool-line')
  })

  it('choisit les outils de plan avec W, P, D (D seul ≠ Ctrl+D)', () => {
    expect(resolveShortcut(key('w'))).toBe('tool-wall')
    expect(resolveShortcut(key('p'))).toBe('tool-room')
    expect(resolveShortcut(key('d'))).toBe('tool-dimension')
    expect(resolveShortcut(key('d', { ctrlKey: true }))).toBe('duplicate')
  })

  it('choisit l’outil Axe avec A (Ctrl+A reste « tout sélectionner »)', () => {
    expect(resolveShortcut(key('a'))).toBe('tool-axis')
    expect(resolveShortcut(key('a', { ctrlKey: true }))).toBe('select-all')
  })

  it('choisit les outils Porte et Fenêtre avec B et F', () => {
    expect(resolveShortcut(key('b'))).toBe('tool-door')
    expect(resolveShortcut(key('f'))).toBe('tool-window')
    expect(resolveShortcut(key('b', { ctrlKey: true }))).toBeNull()
  })

  it('ignore la casse (Verr. Maj. activé)', () => {
    expect(resolveShortcut(key('R'))).toBe('tool-rect')
  })

  it('pivote avec Maj + R', () => {
    expect(resolveShortcut(key('R', { shiftKey: true }))).toBe('rotate')
  })

  it('supprime avec Suppr et Retour arrière', () => {
    expect(resolveShortcut(key('Delete'))).toBe('delete')
    expect(resolveShortcut(key('Backspace'))).toBe('delete')
  })

  it('annule avec Ctrl+Z et rétablit avec Ctrl+Maj+Z', () => {
    expect(resolveShortcut(key('z', { ctrlKey: true }))).toBe('undo')
    expect(resolveShortcut(key('Z', { ctrlKey: true, shiftKey: true }))).toBe('redo')
  })

  it('rétablit aussi avec Ctrl+Y', () => {
    expect(resolveShortcut(key('y', { ctrlKey: true }))).toBe('redo')
  })

  it('accepte Cmd (Mac) comme Ctrl', () => {
    expect(resolveShortcut(key('z', { metaKey: true }))).toBe('undo')
    expect(resolveShortcut(key('d', { metaKey: true }))).toBe('duplicate')
  })

  it('duplique avec Ctrl+D', () => {
    expect(resolveShortcut(key('d', { ctrlKey: true }))).toBe('duplicate')
  })

  it('ajuste à l’écran avec Ctrl+0', () => {
    expect(resolveShortcut(key('0', { ctrlKey: true }))).toBe('fit-view')
  })

  it('ne confond pas une lettre seule avec une commande Ctrl', () => {
    expect(resolveShortcut(key('z'))).toBeNull()
    expect(resolveShortcut(key('q'))).toBeNull()
    expect(resolveShortcut(key('c'))).toBeNull()
  })

  it('copie, colle et sélectionne tout', () => {
    expect(resolveShortcut(key('c', { ctrlKey: true }))).toBe('copy')
    expect(resolveShortcut(key('v', { ctrlKey: true }))).toBe('paste')
    expect(resolveShortcut(key('a', { ctrlKey: true }))).toBe('select-all')
    expect(resolveShortcut(key('v', { metaKey: true }))).toBe('paste')
  })

  it('déplace avec les flèches (Maj gardée par l’appelant pour le pas ×10)', () => {
    expect(resolveShortcut(key('ArrowLeft'))).toBe('nudge-left')
    expect(resolveShortcut(key('ArrowRight', { shiftKey: true }))).toBe('nudge-right')
    expect(resolveShortcut(key('ArrowUp'))).toBe('nudge-up')
    expect(resolveShortcut(key('ArrowDown'))).toBe('nudge-down')
  })

  it('ignore les combinaisons avec Alt et les touches inconnues', () => {
    expect(resolveShortcut(key('r', { altKey: true }))).toBeNull()
    expect(resolveShortcut(key('x'))).toBeNull()
    expect(resolveShortcut(key('x', { ctrlKey: true }))).toBeNull()
  })

  it('reconnaît Échap', () => {
    expect(resolveShortcut(key('Escape'))).toBe('escape')
  })
})
