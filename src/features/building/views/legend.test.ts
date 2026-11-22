import { describe, expect, it } from 'vitest'
import { fr } from '../../../i18n/fr'
import { levelWallMaterials, materialLegend } from './legend'

describe('légende des hachures (M20 20.2)', () => {
  it('une case hachurée et un nom par matériau, dans l’ordre d’apparition, sans doublon', () => {
    const walls = [
      { type: 'wall', levelId: 'R1', material: 'brick' as const },
      { type: 'wall', levelId: 'R1', material: 'concrete' as const },
      { type: 'wall', levelId: 'R1', material: 'brick' as const },
      { type: 'wall', levelId: 'RDC', material: 'wood' as const },
      { type: 'wall', levelId: 'R1' },
    ]
    const materials = levelWallMaterials(walls, 'R1')
    expect(materials).toEqual(['brick', 'concrete'])
    const legend = materialLegend(materials, fr.materials.walls, 'Légende', 0, 0, 100)!
    expect(legend.texts.map((t) => t.text)).toEqual(['Légende', 'Brique', 'Béton'])
    expect(legend.polygons).toHaveLength(2)
    expect(legend.polygons.every((p) => (p.hatch ?? []).length > 0)).toBe(true)
  })

  it('aucun matériau : pas de légende', () => {
    expect(materialLegend([], fr.materials.walls, 'Légende', 0, 0, 100)).toBeNull()
  })
})
