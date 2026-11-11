import { beforeEach, describe, expect, it } from 'vitest'
import { fr } from '../../i18n/fr'
import { useEditorStore } from '../../stores/editorStore'
import type { OpeningElement, RoomElement, WallElement } from '../../types/document'
import { createPlanProject } from '../documents/createProject'
import { rotateSelectionQuarterTurn } from '../geometry/rotateSelection'
import { elementBounds } from '../export/bounds'
import { openingGeometry } from '../geometry/openings'
import { polygonArea } from '../geometry/polygon'
import { getPlaceable, PREFABS } from './catalog/prefabs'
import { elementsForPrefab, prefabOpeningPlacement } from './placeSet'
import { BRANDS_FOR_TESTS } from './testBrands'

const names = {
  nameOf: (symbol: string) => symbol,
  roomName: 'Pièce',
  wallName: 'Mur 1',
  openingName: (kind: OpeningElement['kind']) => kind,
}

describe('pièces préfabriquées', () => {
  it('7 pièces : chambre, salle de bain, WC, cuisine, séjour, bureau, garage', () => {
    expect(PREFABS.map((p) => p.id)).toEqual([
      'prefab-bedroom',
      'prefab-bathroom',
      'prefab-wc',
      'prefab-kitchen',
      'prefab-living',
      'prefab-office',
      'prefab-garage',
    ])
  })

  it('chacune a un nom français, une catégorie et se retrouve par son identifiant', () => {
    for (const prefab of PREFABS) {
      expect(fr.library.symbols[prefab.id]?.name, prefab.id).toBeTruthy()
      expect(prefab.category).toBe('prefabs')
      expect(getPlaceable(prefab.id)).toBe(prefab)
    }
  })

  it('aucune marque ni référence commerciale', () => {
    for (const prefab of PREFABS) {
      const text = JSON.stringify(fr.library.symbols[prefab.id]).toLowerCase()
      for (const brand of BRANDS_FOR_TESTS) {
        expect(text.includes(brand), `${prefab.id} ${brand}`).toBe(false)
      }
    }
  })

  it('crée une pièce, un seul mur fermé, ses ouvertures et son mobilier, avec de nouveaux identifiants', () => {
    for (const prefab of PREFABS) {
      const elements = elementsForPrefab(prefab, { x: 1000, y: 2000 }, 2700, names)
      const walls = elements.filter((el): el is WallElement => el.type === 'wall')
      const rooms = elements.filter((el): el is RoomElement => el.type === 'room')
      const openings = elements.filter((el): el is OpeningElement => el.type === 'opening')
      expect(walls, prefab.id).toHaveLength(1)
      expect(rooms, prefab.id).toHaveLength(1)
      expect(openings, prefab.id).toHaveLength(prefab.shell!.openings.length)
      expect(elements.filter((el) => el.type === 'furniture')).toHaveLength(prefab.members.length)
      expect(new Set(elements.map((el) => el.id)).size).toBe(elements.length)
      // Mur fermé autour de la pièce ; les ouvertures pointent vers ce mur.
      expect(walls[0].points.slice(-2)).toEqual(walls[0].points.slice(0, 2))
      expect(walls[0].height).toBe(2700)
      expect(openings.every((o) => o.wallId === walls[0].id)).toBe(true)
      // La pièce a la surface de l'emprise.
      expect(polygonArea(rooms[0].points)).toBeCloseTo(prefab.width * prefab.depth)
    }
  })

  it('le mobilier reste dans la pièce', () => {
    for (const prefab of PREFABS) {
      const elements = elementsForPrefab(prefab, { x: 0, y: 0 }, 2700, names)
      for (const el of elements) {
        if (el.type !== 'furniture') continue
        const box = elementBounds(el)!
        const label = `${prefab.id} ${el.symbol}`
        expect(box.x, label).toBeGreaterThanOrEqual(-1)
        expect(box.y, label).toBeGreaterThanOrEqual(-1)
        expect(box.x + box.width, label).toBeLessThanOrEqual(prefab.width + 1)
        expect(box.y + box.height, label).toBeLessThanOrEqual(prefab.depth + 1)
      }
    }
  })

  it('les ouvertures tiennent dans leur mur, loin des angles, et ne se chevauchent pas', () => {
    for (const prefab of PREFABS) {
      const elements = elementsForPrefab(prefab, { x: 0, y: 0 }, 2700, names)
      const wall = elements.find((el): el is WallElement => el.type === 'wall')!
      const openings = elements.filter((el): el is OpeningElement => el.type === 'opening')
      for (const opening of openings) {
        expect(openingGeometry(opening, wall), `${prefab.id} ${opening.kind}`).not.toBeNull()
        const length = [prefab.width, prefab.depth][opening.segmentIndex % 2] + wall.thickness
        // Entre les deux angles intérieurs (une demi-épaisseur de chaque bout), sans les toucher.
        expect(opening.offset - opening.width / 2).toBeGreaterThanOrEqual(wall.thickness / 2 + 50)
        expect(opening.offset + opening.width / 2).toBeLessThanOrEqual(length - wall.thickness / 2 - 50)
        expect(opening.height).toBeLessThanOrEqual(wall.height)
        expect(opening.side).toBe('left') // s'ouvre vers l'intérieur
      }
      const bySegment = new Map<number, OpeningElement[]>()
      for (const opening of openings) {
        bySegment.set(opening.segmentIndex, [...(bySegment.get(opening.segmentIndex) ?? []), opening])
      }
      for (const list of bySegment.values()) {
        const sorted = [...list].sort((a, b) => a.offset - b.offset)
        for (let i = 1; i < sorted.length; i++) {
          expect(sorted[i].offset - sorted[i].width / 2).toBeGreaterThanOrEqual(
            sorted[i - 1].offset + sorted[i - 1].width / 2,
          )
        }
      }
    }
  })

  it('pose : l’emprise commence au point donné', () => {
    const bedroom = getPlaceable('prefab-bedroom')!
    const elements = elementsForPrefab(bedroom, { x: 1000, y: 2000 }, 2700, names)
    const room = elements.find((el): el is RoomElement => el.type === 'room')!
    expect(room.points.slice(0, 2)).toEqual([1000, 2000])
    const wall = elements.find((el): el is WallElement => el.type === 'wall')!
    expect(wall.points.slice(0, 2)).toEqual([900, 1900])
  })
})

describe('position d’une ouverture le long du mur fermé', () => {
  const interior = { width: 4000, depth: 3000 }

  it('haut et droite : depuis le début du côté', () => {
    expect(prefabOpeningPlacement({ side: 'top', at: 1000 }, interior, 200)).toEqual({
      segmentIndex: 0,
      offset: 1100,
    })
    expect(prefabOpeningPlacement({ side: 'right', at: 500 }, interior, 200)).toEqual({
      segmentIndex: 1,
      offset: 600,
    })
  })

  it('bas et gauche : le mur tourne dans le sens horaire, donc depuis le coin opposé', () => {
    expect(prefabOpeningPlacement({ side: 'bottom', at: 1000 }, interior, 200)).toEqual({
      segmentIndex: 2,
      offset: 3100,
    })
    expect(prefabOpeningPlacement({ side: 'left', at: 500 }, interior, 200)).toEqual({
      segmentIndex: 3,
      offset: 2600,
    })
  })
})

describe('poser une pièce préfabriquée dans le plan', () => {
  const store = () => useEditorStore.getState()

  beforeEach(() => {
    store().loadProject(createPlanProject('Maison'))
  })

  it('un seul « annuler » retire tout, un seul « rétablir » remet tout', () => {
    const bedroom = getPlaceable('prefab-bedroom')!
    const placed = elementsForPrefab(bedroom, { x: 0, y: 0 }, 2700, names)
    store().addElements(placed)
    expect(store().project!.document.elements).toHaveLength(placed.length)
    expect(store().selectedIds).toHaveLength(placed.length)
    expect(store().history.past).toHaveLength(1)
    store().undo()
    expect(store().project!.document.elements).toHaveLength(0)
    store().redo()
    expect(store().project!.document.elements).toHaveLength(placed.length)
  })

  it('Maj + R : tourne la pièce d’un quart de tour avec ses ouvertures et son mobilier', () => {
    const bedroom = getPlaceable('prefab-bedroom')!
    store().addElements(elementsForPrefab(bedroom, { x: 0, y: 0 }, 2700, names))
    const selection = store().project!.document.elements
    const before = Object.fromEntries(
      selection.filter((el) => el.type === 'opening').map((el) => [el.id, el]),
    )
    store().replaceElements(rotateSelectionQuarterTurn(selection))
    const after = store().project!.document.elements
    // L'emprise de la pièce passe de 3500 × 3200 à 3200 × 3500.
    const room = after.find((el): el is RoomElement => el.type === 'room')!
    const box = elementBounds(room)!
    expect([box.width, box.height]).toEqual([3200, 3500])
    // Les ouvertures sont restées sur leur mur, à la même place relative.
    const openings = after.filter((el): el is OpeningElement => el.type === 'opening')
    expect(openings).toHaveLength(2)
    for (const opening of openings) {
      const original = before[opening.id] as OpeningElement
      expect(opening.segmentIndex).toBe(original.segmentIndex)
      expect(opening.offset).toBe(original.offset)
    }
    // Les meubles ont tourné d'un quart de tour.
    for (const el of after) if (el.type === 'furniture') expect(el.rotation % 90).toBe(0)
    expect(store().history.past).toHaveLength(2) // la pose, puis la rotation : un seul pas chacune
  })
})
