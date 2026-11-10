import { describe, expect, it } from 'vitest'
import { createImageElement, createRectElement } from '../documents/elements'
import { calibrateImage, calibrationFactor, findImageAt, imageContainsPoint } from './calibration'
import { pointDistance } from './polygon'

describe('calibrationFactor', () => {
  it('distance réelle ÷ distance mesurée', () => {
    // 700 mm mesurés entre A et B pour 3 500 mm réels → ×5
    expect(calibrationFactor({ x: 0, y: 0 }, { x: 700, y: 0 }, 3500)).toBe(5)
    expect(calibrationFactor({ x: 0, y: 0 }, { x: 300, y: 400 }, 2500)).toBe(5)
  })

  it('refuse deux points confondus ou une distance invalide', () => {
    expect(calibrationFactor({ x: 1, y: 1 }, { x: 1, y: 1 }, 3500)).toBeNull()
    expect(calibrationFactor({ x: 0, y: 0 }, { x: 1, y: 0 }, 0)).toBeNull()
    expect(calibrationFactor({ x: 0, y: 0 }, { x: 1, y: 0 }, -5)).toBeNull()
    expect(calibrationFactor({ x: 0, y: 0 }, { x: 1, y: 0 }, Number.NaN)).toBeNull()
  })
})

describe('calibrateImage', () => {
  it('agrandit l’image autour du point A, qui reste fixe', () => {
    const image = createImageElement('I', 'a', 0, 0, 1000, 500)
    const a = { x: 100, y: 100 }
    const result = calibrateImage(image, a, 2)
    expect(result).toMatchObject({ x: -100, y: -100, width: 2000, height: 1000 })
    // Le point A est resté au même endroit de l'image (10 % de la largeur, 20 % de la hauteur)
    expect((a.x - result.x) / result.width).toBeCloseTo(0.1)
    expect((a.y - result.y) / result.height).toBeCloseTo(0.2)
  })

  it('réduit l’image quand le facteur est inférieur à 1', () => {
    const image = createImageElement('I', 'a', 200, 200, 1000, 1000)
    const result = calibrateImage(image, { x: 200, y: 200 }, 0.5)
    expect(result).toMatchObject({ x: 200, y: 200, width: 500, height: 500 })
  })

  it('une image calibrée sur 3,50 m donne 3,50 m entre les deux mêmes points (± 1 cm)', () => {
    // Plan scanné posé à (500, 300) : deux points de l'image, mesurés à 700 mm l'un de l'autre.
    const image = createImageElement('Plan', 'a', 500, 300, 4000, 3000)
    const a = { x: 1000, y: 800 }
    const b = { x: 1700, y: 800 }
    const factor = calibrationFactor(a, b, 3500)!
    const calibrated = calibrateImage(image, a, factor)

    // B se trouve toujours au même endroit de l'image : on recalcule sa position dans le document.
    const bRatio = { x: (b.x - image.x) / image.width, y: (b.y - image.y) / image.height }
    const bAfter = {
      x: calibrated.x + bRatio.x * calibrated.width,
      y: calibrated.y + bRatio.y * calibrated.height,
    }
    expect(Math.abs(pointDistance(a, bAfter) - 3500)).toBeLessThan(10)
  })

  it('conserve la rotation et ne modifie pas l’image d’origine', () => {
    const image = { ...createImageElement('I', 'a', 0, 0, 100, 100), rotation: 30 }
    const result = calibrateImage(image, { x: 0, y: 0 }, 3)
    expect(result.rotation).toBe(30)
    expect(image.width).toBe(100)
  })
})

describe('imageContainsPoint / findImageAt', () => {
  const image = createImageElement('I', 'a', 100, 100, 400, 200)

  it('détecte un point dans l’image', () => {
    expect(imageContainsPoint(image, { x: 300, y: 200 })).toBe(true)
    expect(imageContainsPoint(image, { x: 100, y: 100 })).toBe(true) // coin
  })

  it('détecte un point hors de l’image', () => {
    expect(imageContainsPoint(image, { x: 50, y: 200 })).toBe(false)
    expect(imageContainsPoint(image, { x: 300, y: 400 })).toBe(false)
  })

  it('tient compte de la rotation', () => {
    // Rotation de 90° autour du coin haut-gauche : l'image occupe x ∈ [-100, 100], y ∈ [100, 500]
    const rotated = { ...image, rotation: 90 }
    expect(imageContainsPoint(rotated, { x: 0, y: 300 })).toBe(true)
    expect(imageContainsPoint(rotated, { x: 300, y: 200 })).toBe(false)
  })

  it('renvoie l’image la plus haute au point donné', () => {
    const below = createImageElement('Dessous', 'a', 0, 0, 1000, 1000)
    const above = createImageElement('Dessus', 'b', 0, 0, 1000, 1000)
    expect(findImageAt([below, above], { x: 10, y: 10 })?.name).toBe('Dessus')
  })

  it('ignore les images masquées et les éléments qui ne sont pas des images', () => {
    const hidden = { ...createImageElement('Cachée', 'a', 0, 0, 1000, 1000), hidden: true }
    const rect = createRectElement('R', 0, 0, 1000, 1000)
    expect(findImageAt([hidden, rect], { x: 10, y: 10 })).toBeUndefined()
  })
})
