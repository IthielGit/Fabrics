import { describe, expect, it } from 'vitest'
import { wallMaterialOfAssembly } from './toFabricsView'

const assembly = (...layers: { role: string; core?: boolean; material?: string }[]) => ({ layers: layers.map((l, i) => ({ id: `l${i}`, thickness: 0.02, ...l })) })

describe('wallMaterialOfAssembly : hachure d’un mur coupé d’après sa composition de Pascal', () => {
  it('couche porteuse (core) prioritaire', () => {
    expect(wallMaterialOfAssembly(assembly({ role: 'finish', material: 'stucco' }, { role: 'structure', core: true, material: 'brick' }))).toEqual({ material: 'brick' })
  })
  it('sinon la première couche structure', () => {
    expect(wallMaterialOfAssembly(assembly({ role: 'structure', material: 'cmu' }))).toEqual({ material: 'masonry' })
    expect(wallMaterialOfAssembly(assembly({ role: 'structure', material: 'concrete' }))).toEqual({ material: 'concrete' })
    expect(wallMaterialOfAssembly(assembly({ role: 'structure', material: 'wood' }))).toEqual({ material: 'wood' })
  })
  it('sans composition, sans couche porteuse ou matériau inconnu : rien (noir plein)', () => {
    expect(wallMaterialOfAssembly(undefined)).toEqual({})
    expect(wallMaterialOfAssembly(assembly({ role: 'finish', material: 'brick' }))).toEqual({})
    expect(wallMaterialOfAssembly(assembly({ role: 'structure', material: 'unobtainium' }))).toEqual({})
  })
})
