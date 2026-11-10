import { describe, expect, it } from 'vitest'
import type { CanvasElement, Level, OpeningElement, RoomElement, WallElement } from '../../types/document'
import {
  copyLevelWalls,
  elementsOfLevel,
  elementsOnLevel,
  insertLevelAbove,
  levelBelow,
  moveLevel,
  newTopLevel,
  nextLevelName,
  removeLevel,
  restackLevels,
  updateLevel,
  validActiveLevelId,
} from './levels'

const level = (id: string, elevation: number, height = 2700): Level => ({
  id,
  name: id,
  elevation,
  height,
  slabThickness: 200,
})

const BASE = { rotation: 0, opacity: 1, locked: false, hidden: false, x: 0, y: 0 }

const wall = (id: string, levelId?: string): WallElement => ({
  ...BASE,
  id,
  name: id,
  type: 'wall',
  points: [0, 0, 4000, 0],
  thickness: 200,
  height: 2700,
  fill: '#444',
  levelId,
})

const room = (id: string, levelId?: string): RoomElement => ({
  ...BASE,
  id,
  name: id,
  type: 'room',
  points: [0, 0, 4000, 0, 4000, 3000, 0, 3000],
  fill: '#0f0',
  showLabel: true,
  levelId,
})

const door = (id: string, wallId: string, levelId?: string): OpeningElement => ({
  ...BASE,
  id,
  name: id,
  type: 'opening',
  kind: 'door',
  wallId,
  segmentIndex: 0,
  offset: 2000,
  width: 900,
  height: 2100,
  sillHeight: 0,
  hinge: 'start',
  side: 'left',
  levelId,
})

const THREE = [level('A', 0), level('B', 2700), level('C', 5400)]

describe('niveaux : liste', () => {
  it('ajoute un niveau au sommet, à l’altitude du plancher du dessus', () => {
    const top = newTopLevel(THREE, 'Étage 3')
    expect(top.elevation).toBe(8100)
    expect(top.height).toBe(2700)
    expect(top.name).toBe('Étage 3')
  })

  it('un plan sans niveau reçoit un niveau à l’altitude 0', () => {
    expect(newTopLevel([], 'RDC').elevation).toBe(0)
  })

  it('numérote les étages d’après le nombre de niveaux', () => {
    expect(nextLevelName([level('A', 0)], (n) => `Étage ${n}`)).toBe('Étage 1')
    expect(nextLevelName(THREE, (n) => `Étage ${n}`)).toBe('Étage 3')
  })

  it('restackLevels empile à partir d’un indice sans toucher aux niveaux du dessous', () => {
    const out = restackLevels([level('A', 0), level('B', 9999), level('C', 1)], 1)
    expect(out.map((l) => l.elevation)).toEqual([0, 9999, 12699])
  })

  it('insère une copie juste au-dessus de sa source et remonte les niveaux plus hauts', () => {
    const out = insertLevelAbove(THREE, 'A', level('A2', 0))
    expect(out.map((l) => l.id)).toEqual(['A', 'A2', 'B', 'C'])
    expect(out.map((l) => l.elevation)).toEqual([0, 2700, 5400, 8100])
  })

  it('monte et descend un niveau en recalculant les altitudes', () => {
    const tall = [level('A', 0, 3000), level('B', 3000, 2500)]
    const up = moveLevel(tall, 'A', 'up')
    expect(up.map((l) => l.id)).toEqual(['B', 'A'])
    expect(up.map((l) => l.elevation)).toEqual([0, 2500])
    expect(moveLevel(up, 'A', 'down').map((l) => l.id)).toEqual(['A', 'B'])
  })

  it('refuse de sortir de la liste (même référence)', () => {
    expect(moveLevel(THREE, 'C', 'up')).toBe(THREE)
    expect(moveLevel(THREE, 'A', 'down')).toBe(THREE)
    expect(moveLevel(THREE, 'inconnu', 'up')).toBe(THREE)
  })

  it('modifie le nom, l’altitude et la hauteur ; la liste reste triée par altitude', () => {
    const out = updateLevel(THREE, 'A', { name: '  Sous-sol  ', elevation: 6000, height: 2400 })
    expect(out.map((l) => l.id)).toEqual(['B', 'C', 'A'])
    const a = out.find((l) => l.id === 'A')!
    expect(a).toMatchObject({ name: 'Sous-sol', elevation: 6000, height: 2400 })
  })

  it('ignore les valeurs invalides et ne change rien si tout est identique', () => {
    expect(updateLevel(THREE, 'A', { name: '   ', height: Number.NaN })).toBe(THREE)
    expect(updateLevel(THREE, 'A', { name: 'A', elevation: 0 })).toBe(THREE)
    expect(updateLevel(THREE, 'A', { height: 5 })[0].height).toBe(100) // hauteur minimale
  })

  it('supprime un niveau et redescend ceux du dessus', () => {
    const out = removeLevel(THREE, 'B')
    expect(out.map((l) => l.id)).toEqual(['A', 'C'])
    expect(out.map((l) => l.elevation)).toEqual([0, 2700])
  })

  it('garde toujours au moins un niveau', () => {
    const single = [level('A', 0)]
    expect(removeLevel(single, 'A')).toBe(single)
    expect(removeLevel(THREE, 'inconnu')).toBe(THREE)
  })

  it('trouve le niveau du dessous', () => {
    expect(levelBelow(THREE, 'B')?.id).toBe('A')
    expect(levelBelow(THREE, 'A')).toBeUndefined()
  })

  it('le niveau actif retombe sur le plus bas s’il n’existe plus', () => {
    expect(validActiveLevelId(THREE, 'B')).toBe('B')
    expect(validActiveLevelId(THREE, 'disparu')).toBe('A')
    expect(validActiveLevelId(THREE, null)).toBe('A')
    expect(validActiveLevelId(undefined, 'A')).toBeNull()
  })
})

describe('niveaux : éléments', () => {
  const elements: CanvasElement[] = [wall('w0', 'A'), wall('w1', 'B'), room('common')]

  it('elementsOnLevel garde les éléments du niveau et ceux communs à tous', () => {
    expect(elementsOnLevel(elements, 'A').map((e) => e.id)).toEqual(['w0', 'common'])
  })

  it('elementsOfLevel ne garde que ceux du niveau', () => {
    expect(elementsOfLevel(elements, 'B').map((e) => e.id)).toEqual(['w1'])
  })

  it('copie les murs (avec leurs ouvertures) mais pas les pièces', () => {
    const source: CanvasElement[] = [
      wall('w0', 'A'),
      door('d0', 'w0', 'A'),
      room('r0', 'A'),
      wall('autre', 'B'),
    ]
    const copies = copyLevelWalls(source, 'A', 'NEW')
    expect(copies.map((c) => c.type)).toEqual(['wall', 'opening'])
    expect(copies.every((c) => c.levelId === 'NEW')).toBe(true)
    // Nouveaux identifiants, et l'ouverture suit la copie du mur.
    const [copiedWall, copiedDoor] = copies as [WallElement, OpeningElement]
    expect(copiedWall.id).not.toBe('w0')
    expect(copiedDoor.wallId).toBe(copiedWall.id)
    // Même position que l'original.
    expect(copiedWall.points).toEqual([0, 0, 4000, 0])
  })
})
