import { strFromU8, unzipSync } from 'fflate'
import { describe, expect, it } from 'vitest'
import { createWallElement } from '../documents/elements'
import { createLevel } from '../documents/levels'
import { EXECUTION_LABELS } from '../../i18n/dimensioningLabels'
import { buildDxfFiles, dxfFontMm, packDxfFiles } from './dxfFiles'

const ground = createLevel('Rez-de-chaussée', 0, 2700, 200)
const upper = createLevel('Étage 1', 2700, 2700, 200)
const doc = {
  levels: [upper, ground],
  elements: [
    { ...createWallElement('Mur', [0, 0, 5000, 0], 200, 2700), levelId: ground.id },
    { ...createWallElement('Mur', [0, 0, 3000, 0], 200, 2700), levelId: upper.id },
  ],
}
const OPTIONS = { mode: 'none' as const, labels: EXECUTION_LABELS, fontMm: 125 }

describe('buildDxfFiles', () => {
  it('niveau affiché : un seul fichier nommé d’après le niveau', () => {
    const files = buildDxfFiles(doc, 'Maison', 'level', upper.id, OPTIONS)
    expect(files.map((f) => f.name)).toEqual(['Maison - Étage 1.dxf'])
  })

  it('tous les niveaux : un fichier par niveau, du plus bas au plus haut', () => {
    const files = buildDxfFiles(doc, 'Maison', 'building', ground.id, OPTIONS)
    expect(files.map((f) => f.name)).toEqual(['Maison - Rez-de-chaussée.dxf', 'Maison - Étage 1.dxf'])
  })

  it('deux niveaux du même nom ne s’écrasent pas', () => {
    const twin = { ...upper, name: ground.name }
    const files = buildDxfFiles({ ...doc, levels: [ground, twin] }, 'Maison', 'building', null, OPTIONS)
    expect(new Set(files.map((f) => f.name)).size).toBe(2)
  })
})

describe('packDxfFiles', () => {
  it('un seul fichier reste un .dxf ; plusieurs vont dans un .zip', async () => {
    const files = buildDxfFiles(doc, 'Maison', 'building', null, OPTIONS)
    expect(packDxfFiles(files.slice(0, 1), 'Maison.zip')?.name).toBe('Maison - Rez-de-chaussée.dxf')
    const packed = packDxfFiles(files, 'Maison.zip')
    expect(packed?.name).toBe('Maison.zip')
    const entries = unzipSync(new Uint8Array(await packed!.blob.arrayBuffer()))
    expect(Object.keys(entries)).toHaveLength(2)
    expect(strFromU8(entries['Maison - Étage 1.dxf'])).toContain('$INSUNITS')
    expect(packDxfFiles([], 'x.zip')).toBeNull()
  })
})

describe('dxfFontMm', () => {
  it('2,5 mm sur le papier à l’échelle du projet', () => {
    expect(dxfFontMm(50)).toBe(125)
    expect(dxfFontMm(100)).toBe(250)
    expect(dxfFontMm(undefined)).toBe(125)
  })
})
