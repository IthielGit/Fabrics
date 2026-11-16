import { describe, expect, it } from 'vitest'
import type { RoomElement } from '../../types/document'
import {
  allOfType,
  sharedColor,
  sharedColorProps,
  sharedValue,
  withDimensionOffset,
  withDimensionVisibleIn,
  withFalseCeiling,
  withShowLabel,
  withWallHeight,
  withWallThickness,
} from './commonValues'
import {
  createDimensionElement,
  createImageElement,
  createLineElement,
  createRectElement,
  createRoomElement,
  createTextElement,
  createWallElement,
} from './elements'
import { setColorProp } from './properties'

const square = [0, 0, 1000, 0, 1000, 1000, 0, 1000]

describe('sharedValue', () => {
  it('renvoie la valeur commune, « mixed » si elle diffère, undefined sans élément', () => {
    expect(sharedValue([200, 200, 200])).toBe(200)
    expect(sharedValue([200, 300])).toBe('mixed')
    expect(sharedValue([])).toBeUndefined()
  })
})

describe('couleurs modifiables ensemble', () => {
  it('garde seulement les couleurs que tous les éléments ont', () => {
    const room = createRoomElement('P', square)
    const wall = createWallElement('M', [0, 0, 1000, 0], 200, 2500)
    const rect = createRectElement('R', 0, 0, 10, 10)
    const line = createLineElement('L', 0, 0, 10, 0, 1)
    expect(sharedColorProps([room, wall])).toEqual(['fill'])
    expect(sharedColorProps([rect, room])).toEqual(['fill'])
    expect(sharedColorProps([rect, line])).toEqual(['stroke'])
    expect(sharedColorProps([room, createImageElement('I', 'a', 0, 0, 1, 1)])).toEqual([])
    expect(sharedColorProps([])).toEqual([])
  })

  it('compare les pièces sur leur couleur, pas sur leur transparence', () => {
    const a = setColorProp(createRoomElement('A', square), 'fill', '#22c55e')
    const b = setColorProp(createRoomElement('B', square), 'fill', '#22c55e')
    const c = setColorProp(createRoomElement('C', square), 'fill', '#ef4444')
    expect(sharedColor([a, b], 'fill')).toBe('#22c55e')
    expect(sharedColor([a, c], 'fill')).toBe('mixed')
  })
})

describe('allOfType', () => {
  it('vrai seulement si tous les éléments sont du type', () => {
    const room = createRoomElement('P', square)
    expect(allOfType([room, room], 'room')).toBe(true)
    expect(allOfType([room, createTextElement('T', 0, 0, 'a', 10)], 'room')).toBe(false)
    expect(allOfType([], 'room')).toBe(false)
  })
})

describe('changements groupés', () => {
  it('pièces : nom et surface affichés, faux plafond', () => {
    const room = createRoomElement('P', square)
    expect(withShowLabel(room, false)).toMatchObject({ showLabel: false })
    const withCeiling = withFalseCeiling(room, true) as RoomElement
    expect(withCeiling.falseCeiling).toBe(true)
    expect('falseCeiling' in withFalseCeiling(withCeiling, false)).toBe(false)
  })

  it('murs : épaisseur et hauteur en mm entiers, au moins 1 mm', () => {
    const wall = createWallElement('M', [0, 0, 1000, 0], 200, 2500)
    expect(withWallThickness(wall, 250.4)).toMatchObject({ thickness: 250 })
    expect(withWallThickness(wall, -5)).toMatchObject({ thickness: 1 })
    expect(withWallHeight(wall, 2700)).toMatchObject({ height: 2700 })
    expect(withWallHeight(wall, Number.NaN)).toBe(wall)
  })

  it('cotes : décalage et version visible', () => {
    const dimension = createDimensionElement('C', [0, 0, 1000, 0])
    expect(withDimensionOffset(dimension, 600)).toMatchObject({ offset: 600 })
    expect(withDimensionVisibleIn(dimension, 'client')).toMatchObject({ visibleIn: 'client' })
    expect('visibleIn' in withDimensionVisibleIn(dimension, undefined)).toBe(false)
  })

  it('laisse les autres types inchangés', () => {
    const rect = createRectElement('R', 0, 0, 10, 10)
    expect(withShowLabel(rect, true)).toBe(rect)
    expect(withFalseCeiling(rect, true)).toBe(rect)
    expect(withWallThickness(rect, 100)).toBe(rect)
    expect(withWallHeight(rect, 100)).toBe(rect)
    expect(withDimensionOffset(rect, 100)).toBe(rect)
    expect(withDimensionVisibleIn(rect, 'client')).toBe(rect)
  })
})
