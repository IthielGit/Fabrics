import { describe, expect, it } from 'vitest'
import type { CanvasElement } from '../../types/document'
import {
  colorPropsFor,
  getColorProp,
  getNumericProp,
  hexToRgba,
  isNoColor,
  numericPropsFor,
  rgbaToHex,
  setColorProp,
  setNumericProp,
} from './properties'
import {
  createEllipseElement,
  createImageElement,
  createLineElement,
  createRectElement,
  createRoomElement,
  createTextElement,
  createWallElement,
} from './elements'

describe('propriétés proposées selon le type', () => {
  it('le rectangle a un arrondi, pas la ligne ni le texte', () => {
    expect(numericPropsFor(createRectElement('R', 0, 0, 10, 10))).toContain('cornerRadius')
    expect(numericPropsFor(createLineElement('L', 0, 0, 10, 0, 4))).not.toContain('cornerRadius')
    expect(numericPropsFor(createTextElement('T', 0, 0, 'a', 48))).toContain('fontSize')
  })

  it('le texte n’a pas de hauteur modifiable', () => {
    expect(numericPropsFor(createTextElement('T', 0, 0, 'a', 48))).not.toContain('height')
  })

  it('les couleurs : remplissage + contour pour une forme, contour seul pour une ligne', () => {
    expect(colorPropsFor(createRectElement('R', 0, 0, 1, 1))).toEqual(['fill', 'stroke'])
    expect(colorPropsFor(createLineElement('L', 0, 0, 1, 0, 1))).toEqual(['stroke'])
    expect(colorPropsFor(createTextElement('T', 0, 0, 'a', 48))).toEqual(['fill'])
    expect(colorPropsFor(createImageElement('I', 'a', 0, 0, 1, 1))).toEqual([])
  })
})

describe('setNumericProp / getNumericProp', () => {
  it('modifie la position et la taille d’un rectangle', () => {
    let rect: CanvasElement = createRectElement('R', 10, 20, 100, 50)
    rect = setNumericProp(rect, 'x', 30)
    rect = setNumericProp(rect, 'width', 200)
    expect(rect).toMatchObject({ x: 30, y: 20, width: 200, height: 50 })
    expect(getNumericProp(rect, 'width')).toBe(200)
  })

  it('affiche une ellipse par son coin haut-gauche et sa taille', () => {
    const ellipse = createEllipseElement('E', 100, 50, 80, 40) // centre (140, 70)
    expect(getNumericProp(ellipse, 'x')).toBe(100)
    expect(getNumericProp(ellipse, 'y')).toBe(50)
    expect(getNumericProp(ellipse, 'width')).toBe(80)
    expect(getNumericProp(ellipse, 'height')).toBe(40)
  })

  it('élargir une ellipse garde son bord gauche en place', () => {
    const ellipse = createEllipseElement('E', 100, 50, 80, 40)
    const wider = setNumericProp(ellipse, 'width', 200)
    expect(getNumericProp(wider, 'x')).toBe(100)
    expect(getNumericProp(wider, 'width')).toBe(200)
  })

  it('déplacer une ellipse par son coin haut-gauche déplace son centre', () => {
    const ellipse = createEllipseElement('E', 0, 0, 80, 40)
    const moved = setNumericProp(ellipse, 'x', 10)
    expect(moved).toMatchObject({ x: 50, radiusX: 40 }) // centre = 10 + rayon
  })

  it('l’opacité s’exprime en pourcentage et reste entre 0 et 100', () => {
    const rect = createRectElement('R', 0, 0, 10, 10)
    expect(setNumericProp(rect, 'opacity', 50).opacity).toBe(0.5)
    expect(setNumericProp(rect, 'opacity', 250).opacity).toBe(1)
    expect(setNumericProp(rect, 'opacity', -5).opacity).toBe(0)
    expect(getNumericProp(setNumericProp(rect, 'opacity', 30), 'opacity')).toBe(30)
  })

  it('refuse une taille nulle ou négative', () => {
    const rect = createRectElement('R', 0, 0, 100, 50)
    expect(setNumericProp(rect, 'width', 0)).toMatchObject({ width: 1 })
    expect(setNumericProp(rect, 'height', -20)).toMatchObject({ height: 1 })
    expect(setNumericProp(rect, 'strokeWidth', -3)).toMatchObject({ strokeWidth: 0 })
  })

  it('ignore une valeur qui n’est pas un nombre', () => {
    const rect = createRectElement('R', 0, 0, 100, 50)
    expect(setNumericProp(rect, 'width', Number.NaN)).toBe(rect)
  })

  it('ne touche pas une propriété que le type n’a pas', () => {
    const line = createLineElement('L', 0, 0, 10, 0, 4)
    expect(setNumericProp(line, 'cornerRadius', 5)).toBe(line)
    expect(getNumericProp(line, 'cornerRadius')).toBeNull()
  })

  it('modifie la taille de police d’un texte', () => {
    const text = createTextElement('T', 0, 0, 'a', 48)
    expect(setNumericProp(text, 'fontSize', 72)).toMatchObject({ fontSize: 72 })
  })

  it('ne modifie pas l’élément d’origine', () => {
    const rect = createRectElement('R', 0, 0, 100, 50)
    setNumericProp(rect, 'width', 999)
    expect(rect.width).toBe(100)
  })
})

describe('propriétés des éléments de plan', () => {
  it('un mur n’a que l’opacité comme propriété numérique générique', () => {
    expect(numericPropsFor(createWallElement('M', [0, 0, 1000, 0], 200, 2500))).toEqual(['opacity'])
    expect(numericPropsFor(createRoomElement('P', [0, 0, 1, 0, 1, 1]))).toEqual(['opacity'])
  })

  it('mur et pièce ont une couleur de remplissage', () => {
    expect(colorPropsFor(createWallElement('M', [0, 0, 1000, 0], 200, 2500))).toEqual(['fill'])
    expect(colorPropsFor(createRoomElement('P', [0, 0, 1, 0, 1, 1]))).toEqual(['fill'])
  })

  it('une pièce garde un remplissage translucide quand on change sa couleur', () => {
    const room = createRoomElement('P', [0, 0, 1, 0, 1, 1])
    const red = setColorProp(room, 'fill', '#ff0000')
    expect(red).toMatchObject({ fill: 'rgba(255, 0, 0, 0.18)' })
    expect(getColorProp(red, 'fill')).toBe('#ff0000')
  })

  it('affiche la couleur d’une pièce en hexadécimal', () => {
    expect(getColorProp(createRoomElement('P', [0, 0, 1, 0, 1, 1]), 'fill')).toBe('#6366f1')
  })

  it('convertit hexadécimal ↔ rgba', () => {
    expect(hexToRgba('#6366f1', 0.5)).toBe('rgba(99, 102, 241, 0.5)')
    expect(hexToRgba('rouge', 0.5)).toBeNull()
    expect(rgbaToHex('rgba(99, 102, 241, 0.18)')).toBe('#6366f1')
    expect(rgbaToHex('rgb(0,0,0)')).toBe('#000000')
    expect(rgbaToHex('bleu')).toBeNull()
  })
})

describe('couleurs', () => {
  it('lit et modifie le remplissage', () => {
    const rect = createRectElement('R', 0, 0, 10, 10)
    const red = setColorProp(rect, 'fill', '#ff0000')
    expect(getColorProp(red, 'fill')).toBe('#ff0000')
  })

  it('ignore une couleur que le type n’a pas', () => {
    const line = createLineElement('L', 0, 0, 10, 0, 4)
    expect(getColorProp(line, 'fill')).toBeNull()
    expect(setColorProp(line, 'fill', '#ff0000')).toBe(line)
  })

  it('reconnaît « aucune couleur »', () => {
    expect(isNoColor('transparent')).toBe(true)
    expect(isNoColor('')).toBe(true)
    expect(isNoColor('#ffffff')).toBe(false)
  })
})
