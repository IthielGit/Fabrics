import { describe, expect, it } from 'vitest'
import type { CanvasElement, OpeningElement, RoomElement, WallElement } from '../../types/document'
import { computeAutoNames, displayNames, isAutoName, withDisplayNames } from './autoNames'

const BASE = { rotation: 0, opacity: 1, locked: false, hidden: false, x: 0, y: 0, levelId: 'L1' }

function room(id: string, name: string, points: number[], extra: Partial<RoomElement> = {}): RoomElement {
  return { ...BASE, id, name, type: 'room', points, fill: '#0000', showLabel: true, ...extra }
}

function wall(id: string, points: number[], extra: Partial<WallElement> = {}): WallElement {
  return { ...BASE, id, name: 'Mur 1', type: 'wall', points, thickness: 200, height: 2500, fill: '#444', ...extra }
}

function opening(id: string, wallId: string, extra: Partial<OpeningElement> = {}): OpeningElement {
  return {
    ...BASE,
    id,
    name: 'Porte 1',
    type: 'opening',
    kind: 'door',
    wallId,
    segmentIndex: 0,
    offset: 1500,
    width: 900,
    height: 2100,
    sillHeight: 0,
    hinge: 'start',
    side: 'left',
    ...extra,
  }
}

// Cuisine (0..4000) et Séjour (4000..9000), sur 3000 de haut. Axe y vers le bas.
const CUISINE = room('cuisine', 'Cuisine', [0, 0, 4000, 0, 4000, 3000, 0, 3000])
const SEJOUR = room('sejour', 'Séjour', [4000, 0, 9000, 0, 9000, 3000, 4000, 3000])
// Mur mitoyen, tracé de haut en bas : sa gauche (normale) est vers -x, côté Cuisine.
const MIDDLE = wall('middle', [4000, 0, 4000, 3000])
// Mur du haut, de gauche à droite : sa gauche est vers +y (dans les pièces).
const TOP = wall('top', [0, 0, 9000, 0])

describe('isAutoName', () => {
  it('reconnaît les noms vides et les anciens noms par défaut', () => {
    expect(isAutoName('')).toBe(true)
    expect(isAutoName('  ')).toBe(true)
    expect(isAutoName('Mur 1')).toBe(true)
    expect(isAutoName('Mur 1 1')).toBe(true)
    expect(isAutoName('Porte 12')).toBe(true)
    expect(isAutoName('Fenêtre 2')).toBe(true)
    expect(isAutoName('Baie 3')).toBe(true)
    expect(isAutoName('Mur')).toBe(true)
  })

  it('garde un nom tapé à la main', () => {
    expect(isAutoName('Mur porteur')).toBe(false)
    expect(isAutoName('Façade sud')).toBe(false)
    expect(isAutoName('Mur extérieur Cuisine')).toBe(false)
  })
})

describe('computeAutoNames — murs', () => {
  it('nomme un mur mitoyen d’après les deux pièces, dans l’ordre de lecture', () => {
    const names = computeAutoNames([CUISINE, SEJOUR, MIDDLE])
    expect(names.get('middle')).toBe('Mur Cuisine / Séjour')
  })

  it('nomme un mur qui n’a des pièces que d’un côté « Mur extérieur … »', () => {
    const names = computeAutoNames([CUISINE, SEJOUR, TOP])
    expect(names.get('top')).toBe('Mur extérieur Cuisine, Séjour')
  })

  it('nomme un mur sans pièce « Mur isolé »', () => {
    expect(computeAutoNames([wall('alone', [20000, 0, 25000, 0])]).get('alone')).toBe('Mur isolé')
  })

  it('au-delà de deux pièces : les deux plus grandes, puis « +N »', () => {
    const bureau = room('bureau', 'Bureau', [9000, 0, 10000, 0, 10000, 3000, 9000, 3000])
    const names = computeAutoNames([CUISINE, SEJOUR, bureau, wall('top', [0, 0, 10000, 0])])
    // Le bureau (3 m²) est le plus petit : il est compté dans « +1 ».
    expect(names.get('top')).toBe('Mur extérieur Cuisine, Séjour +1')
  })

  it('deux côtés et trois pièces : « Mur Cuisine / Séjour +1 »', () => {
    const cellier = room('cellier', 'Cellier', [3000, 3000, 5000, 3000, 5000, 4000, 3000, 4000])
    // Mur horizontal sous Cuisine et Séjour, avec le cellier au-dessous.
    const names = computeAutoNames([CUISINE, SEJOUR, cellier, wall('w', [0, 3000, 9000, 3000])])
    expect(names.get('w')).toBe('Mur Cuisine / Séjour +1')
  })

  it('numérote les murs qui auraient le même nom, dans l’ordre de lecture', () => {
    const left = wall('left', [0, 3000, 0, 0])
    const bottom = wall('bottom', [4000, 3000, 0, 3000])
    const names = computeAutoNames([CUISINE, left, bottom])
    expect(names.get('left')).toBe('Mur extérieur Cuisine 1')
    expect(names.get('bottom')).toBe('Mur extérieur Cuisine 2')
  })

  it('sépare le numéro par un tiret quand la pièce finit par un nombre', () => {
    const chambre = { ...CUISINE, name: 'Chambre 1' }
    const names = computeAutoNames([chambre, wall('left', [0, 3000, 0, 0]), wall('bottom', [4000, 3000, 0, 3000])])
    expect(names.get('left')).toBe('Mur extérieur Chambre 1 – 1')
  })

  it('une pièce sans nom devient « Pièce 1 »', () => {
    const names = computeAutoNames([{ ...CUISINE, name: '' }, SEJOUR, MIDDLE])
    expect(names.get('middle')).toBe('Mur Pièce 1 / Séjour')
  })

  it('compte les pièces masquées', () => {
    const names = computeAutoNames([{ ...CUISINE, hidden: true }, SEJOUR, MIDDLE])
    expect(names.get('middle')).toBe('Mur Cuisine / Séjour')
  })

  it('ne regarde que les pièces du même niveau', () => {
    const names = computeAutoNames([{ ...CUISINE, levelId: 'L2' }, SEJOUR, MIDDLE])
    expect(names.get('middle')).toBe('Mur extérieur Séjour')
  })
})

describe('computeAutoNames — ouvertures', () => {
  it('une porte prend le nom de la pièce vers laquelle elle s’ouvre', () => {
    const toKitchen = opening('d1', 'middle', { side: 'left' })
    const toLiving = opening('d2', 'middle', { side: 'right' })
    const names = computeAutoNames([CUISINE, SEJOUR, MIDDLE, toKitchen])
    expect(names.get('d1')).toBe('Porte Cuisine 1')
    expect(computeAutoNames([CUISINE, SEJOUR, MIDDLE, toLiving]).get('d2')).toBe('Porte Séjour 1')
  })

  it('numérote les portes d’une même pièce dans l’ordre de lecture', () => {
    const a = opening('a', 'middle', { offset: 2500 })
    const b = opening('b', 'middle', { offset: 600 })
    const names = computeAutoNames([CUISINE, SEJOUR, MIDDLE, a, b])
    expect(names.get('b')).toBe('Porte Cuisine 1')
    expect(names.get('a')).toBe('Porte Cuisine 2')
  })

  it('une fenêtre prend la pièce côté intérieur, quel que soit son côté', () => {
    const w = opening('f', 'top', { kind: 'window', side: 'right', offset: 6000, sillHeight: 900, height: 1200 })
    expect(computeAutoNames([CUISINE, SEJOUR, TOP, w]).get('f')).toBe('Fenêtre Séjour 1')
  })

  it('les baies comptent avec les fenêtres', () => {
    const f = opening('f', 'top', { kind: 'window', offset: 5000 })
    const b = opening('b', 'top', { kind: 'bay', offset: 7500 })
    const names = computeAutoNames([CUISINE, SEJOUR, TOP, f, b])
    expect(names.get('f')).toBe('Fenêtre Séjour 1')
    expect(names.get('b')).toBe('Baie Séjour 2')
  })

  it('une ouverture sans pièce garde un numéro simple', () => {
    const w = wall('alone', [20000, 0, 25000, 0])
    const names = computeAutoNames([w, opening('d', 'alone'), opening('f', 'alone', { kind: 'window', offset: 3500 })])
    expect(names.get('d')).toBe('Porte 1')
    expect(names.get('f')).toBe('Fenêtre 1')
  })

  it('suit le renommage d’une pièce', () => {
    const f = opening('f', 'top', { kind: 'window', offset: 6000 })
    const renamed = { ...SEJOUR, name: 'Salon' }
    expect(computeAutoNames([CUISINE, renamed, TOP, f]).get('f')).toBe('Fenêtre Salon 1')
  })
})

describe('displayNames et withDisplayNames', () => {
  it('garde un nom tapé à la main, remplace un nom par défaut ou vide', () => {
    const custom = { ...MIDDLE, name: 'Refend' }
    const elements: CanvasElement[] = [CUISINE, SEJOUR, custom, { ...TOP, name: '' }]
    const names = displayNames(elements)
    expect(names.get('middle')).toBe('Refend')
    expect(names.get('top')).toBe('Mur extérieur Cuisine, Séjour')
    expect(names.has('cuisine')).toBe(false)
  })

  it('renvoie les mêmes objets quand rien ne change', () => {
    const custom = { ...MIDDLE, name: 'Refend' }
    const out = withDisplayNames([CUISINE, custom])
    expect(out[0]).toBe(CUISINE)
    expect(out[1]).toBe(custom)
    const renamed = withDisplayNames([CUISINE, SEJOUR, MIDDLE])
    expect(renamed[2].name).toBe('Mur Cuisine / Séjour')
  })
})
