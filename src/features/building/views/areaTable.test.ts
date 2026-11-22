import { describe, expect, it } from 'vitest'
import { fr } from '../../../i18n/fr'
import type { Measurements } from '../../measurements/measurements'
import { areaTableDrawing, levelAreaTable, withAreaTable } from './areaTable'
import type { Drawing } from './drawing'

const metres = (rooms: { name: string; area: number }[]) => ({ rooms }) as unknown as Measurements

describe('tableau des surfaces d’un niveau (M20 20.1b)', () => {
  it('une ligne par pièce, surfaces des métrés en m², total balcon compris', () => {
    const table = levelAreaTable(metres([{ name: 'Chambre', area: 12_000_000 }, { name: 'Balcon', area: 18_626_208 }]), 'R+1', fr.views.areaTable)!
    expect(table.title).toBe('Pièces Niveau R+1')
    expect(table.header).toEqual(['Pièces', 'Surface'])
    expect(table.rows).toEqual([
      ['Chambre', '12,00 m²'],
      ['Balcon', '18,63 m²'],
    ])
    expect(table.totalTitle).toBe('Total Niveau R+1')
    expect(table.total).toEqual(['Niveau R+1', '30,63 m²'])
  })

  it('pas de tableau pour un niveau sans pièce', () => {
    expect(levelAreaTable(metres([]), 'RDC', fr.views.areaTable)).toBeNull()
  })

  it('dessin : deux cadres, tous les textes, à la position demandée', () => {
    const table = levelAreaTable(metres([{ name: 'Chambre', area: 12e6 }]), 'RDC', fr.views.areaTable)!
    const d = areaTableDrawing(table, 1000, 500, 100)
    expect(d.texts.map((t) => t.text)).toEqual(['Pièces Niveau RDC', 'Pièces', 'Surface', 'Chambre', '12,00 m²', 'Total Niveau RDC', 'Pièces', 'Surface', 'Niveau RDC', '12,00 m²'])
    expect(Math.min(...d.lines.map((l) => Math.min(l.x1, l.x2)))).toBe(1000)
    expect(Math.min(...d.lines.map((l) => Math.min(l.y1, l.y2)))).toBe(500)
    expect(d.width).toBeGreaterThan(0)
  })

  it('posé à droite du plan sans déplacer le plan', () => {
    const plan: Drawing = { width: 10_000, height: 8000, polygons: [], lines: [{ x1: 0, y1: 0, x2: 10_000, y2: 0 }], texts: [] }
    const table = levelAreaTable(metres([{ name: 'Chambre', area: 12e6 }]), 'RDC', fr.views.areaTable)
    const out = withAreaTable(plan, table, 100)
    expect(out.lines[0]).toEqual(plan.lines[0])
    expect(out.width).toBeGreaterThan(plan.width)
    expect(Math.min(...out.lines.slice(1).map((l) => Math.min(l.x1, l.x2)))).toBeGreaterThan(plan.width)
    expect(withAreaTable(plan, null, 100)).toBe(plan)
  })
})
