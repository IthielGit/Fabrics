import { describe, expect, it } from 'vitest'
import { createPlatformElement } from '../documents/elements'
import { buildBuildingModel, buildPlatform } from './model'

const RECT = [0, 0, 4000, 0, 4000, 3000, 0, 3000]
const GROUND = { id: 'n0', name: 'Rez-de-chaussée', elevation: 0, height: 2700, slabThickness: 200 }
const UPPER = { id: 'n1', name: 'Étage 1', elevation: 2900, height: 2700, slabThickness: 200 }

describe('plateforme en 3D', () => {
  it('le dessus est à la hauteur voulue et le volume fait l’épaisseur', () => {
    const slab = buildPlatform(createPlatformElement('P', RECT), GROUND)!
    expect(slab.kind).toBe('platform')
    expect(slab.baseY + slab.thickness).toBe(450) // dessus
    expect(slab.thickness).toBe(450)
    expect(slab.outline).toHaveLength(4)
  })

  it('suit l’altitude du niveau', () => {
    const slab = buildPlatform(createPlatformElement('P', RECT), UPPER)!
    expect(slab.baseY + slab.thickness).toBe(2900 + 450)
  })

  it('une épaisseur plus faible laisse le dessous libre', () => {
    const platform = { ...createPlatformElement('P', RECT), thickness: 100 }
    const slab = buildPlatform(platform, GROUND)!
    expect(slab.baseY).toBe(350)
    expect(slab.thickness).toBe(100)
  })

  it('l’épaisseur ne dépasse jamais la hauteur du dessus : jamais sous le plancher', () => {
    const platform = { ...createPlatformElement('P', RECT, 300), thickness: 900 }
    const slab = buildPlatform(platform, GROUND)!
    expect(slab.baseY).toBe(0)
    expect(slab.thickness).toBe(300)
  })

  it('le modèle du bâtiment l’inclut, sans toucher aux dalles ni aux toits', () => {
    const platform = { ...createPlatformElement('P', RECT), levelId: GROUND.id }
    const model = buildBuildingModel({ elements: [platform], levels: [GROUND] })
    expect(model.slabs.map((s) => s.kind)).toEqual(['platform'])
    expect(model.bounds).not.toBeNull()
    expect(model.bounds!.max.y).toBe(450)
  })

  it('une plateforme masquée n’apparaît pas', () => {
    const platform = { ...createPlatformElement('P', RECT), levelId: GROUND.id, hidden: true }
    expect(buildBuildingModel({ elements: [platform], levels: [GROUND] }).slabs).toHaveLength(0)
  })
})
