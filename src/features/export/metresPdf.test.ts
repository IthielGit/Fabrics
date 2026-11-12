import { describe, expect, it } from 'vitest'
import type { MetresTable } from '../measurements/tables'
import { buildMetresPdf, packThumbnails, type MetresPdfLabels } from './metresPdf'
import { sheetSize } from './pdfLayout'

const labels: MetresPdfLabels = {
  title: 'Métrés',
  units: 'Unités : longueurs en mm, surfaces en m²',
  note: 'Totaux sur les valeurs exactes.',
  continued: 'suite',
  cartouche: {
    projectName: 'Maison Dupont',
    subtitle: 'Métrés',
    dateLabel: 'Date',
    date: '11/11/2026',
    sheetLabel: 'Feuille',
    sheet: 'A4',
    pageLabel: 'Page',
  },
}

function table(rows: number): MetresTable {
  return {
    id: 't',
    title: 'Pièces',
    columns: [
      { header: 'Niveau', align: 'left' },
      { header: 'Nom', align: 'left' },
      { header: 'Surface au tracé (m²)', align: 'right' },
    ],
    rows: Array.from({ length: rows }, (_, i) => ['Rez', `Pièce ${i + 1}`, '12,40']),
    total: ['Total', '', String(rows * 12.4).replace('.', ',')],
  }
}

async function textOf(blob: Blob): Promise<string> {
  return new TextDecoder('latin1').decode(await blob.arrayBuffer())
}

/** Nombre de pages d'un PDF produit par jsPDF. */
const pageCount = (pdf: string) => (pdf.match(/\/Type\s*\/Page\b(?!s)/g) ?? []).length

describe('buildMetresPdf', () => {
  const sheet = sheetSize('a4', 'landscape')

  it('produit un PDF valide d’une page pour un petit tableau', async () => {
    const pdf = await textOf(await buildMetresPdf([table(5)], sheet, labels))
    expect(pdf.startsWith('%PDF-')).toBe(true)
    expect(pageCount(pdf)).toBe(1)
  })

  it('continue sur plusieurs pages quand le tableau est long', async () => {
    const pdf = await textOf(await buildMetresPdf([table(120)], sheet, labels))
    expect(pageCount(pdf)).toBeGreaterThan(2)
  })

  it('accepte un tableau sans ligne de total, des cellules vides et des noms très longs', async () => {
    const odd: MetresTable = {
      ...table(3),
      total: undefined,
      rows: [['Rez', 'x'.repeat(300), ''], ['', '', '']],
    }
    const blob = await buildMetresPdf([odd], sheetSize('a4', 'portrait'), labels)
    expect(blob.size).toBeGreaterThan(500)
  })

  it('gère un bâtiment sans aucun tableau', async () => {
    const blob = await buildMetresPdf([], sheet, labels)
    expect(blob.size).toBeGreaterThan(500)
  })
})

describe('PDF Client avec vignette du plan', () => {
  it('tient sur une page : vignette, tableau des pièces et cartouche', async () => {
    const { buildBuildingModel } = await import('../building/model')
    const { levelPlanDrawing } = await import('../building/views/drawing')
    const { createWallElement } = await import('../documents/elements')
    const { createLevel } = await import('../documents/levels')
    const level = createLevel('Rez', 0, 2500, 200)
    const wall = { ...createWallElement('Mur', [0, 0, 4000, 0, 4000, 3000, 0, 3000, 0, 0], 200, 2500), levelId: level.id }
    const plan = levelPlanDrawing(buildBuildingModel({ elements: [wall], levels: [level] }), level)
    expect(plan).not.toBeNull()
    const pdf = await textOf(await buildMetresPdf([table(6)], sheetSize('a4', 'portrait'), labels, [{ drawing: plan!, caption: 'Niveau : Rez' }]))
    expect(pdf.startsWith('%PDF-')).toBe(true)
    expect(pageCount(pdf)).toBe(1)
  })

  it('un plan très allongé ou très petit reste lisible et tient sur la page', async () => {
    const { buildBuildingModel } = await import('../building/model')
    const { levelPlanDrawing } = await import('../building/views/drawing')
    const { createWallElement } = await import('../documents/elements')
    const { createLevel } = await import('../documents/levels')
    const level = createLevel('Rez', 0, 2500, 200)
    const draw = (points: number[]) => {
      const wall = { ...createWallElement('Mur', points, 200, 2500), levelId: level.id }
      return levelPlanDrawing(buildBuildingModel({ elements: [wall], levels: [level] }), level)!
    }
    const thumbs = [
      { drawing: draw([0, 0, 30000, 0, 30000, 2000, 0, 2000, 0, 0]), caption: 'Niveau : Long' },
      { drawing: draw([0, 0, 800, 0, 800, 800, 0, 800, 0, 0]), caption: 'Niveau : Petit' },
    ]
    const pdf = await textOf(await buildMetresPdf([table(4)], sheetSize('a4', 'portrait'), labels, thumbs))
    expect(pageCount(pdf)).toBe(1)
  })
})

describe('packThumbnails', () => {
  const box = (width: number, height: number, captionWidth = 20) => ({ width, height, captionWidth })

  it('met deux petits plans côte à côte quand la place suffit', () => {
    const rows = packThumbnails([box(4000, 3000), box(4000, 3000)], 270)
    expect(rows).toHaveLength(1)
    expect(rows[0].map((p) => p.index)).toEqual([0, 1])
    expect(rows[0][1].x).toBeGreaterThan(rows[0][0].width)
  })

  it('passe à la rangée suivante quand la rangée est pleine', () => {
    const rows = packThumbnails([box(30000, 2000), box(30000, 2000)], 270)
    expect(rows.map((r) => r.length)).toEqual([1, 1])
  })

  it('réduit une vignette à la largeur et à la hauteur permises, proportions gardées', () => {
    const [[placed]] = packThumbnails([box(1000, 4000)], 270, 60)
    expect(placed.height).toBeCloseTo(60)
    expect(placed.width).toBeCloseTo(15)
    const [[wide]] = packThumbnails([box(40000, 1000)], 100, 60)
    expect(wide.width).toBeCloseTo(100)
  })

  it('une rangée ne dépasse jamais la largeur disponible', () => {
    const rows = packThumbnails(Array.from({ length: 9 }, () => box(5000, 4000, 40)), 200)
    for (const row of rows) {
      const last = row[row.length - 1]
      expect(last.x + Math.max(last.width, 40)).toBeLessThanOrEqual(200 + 1e-9)
    }
  })

  it('ignore un dessin vide', () => {
    expect(packThumbnails([box(0, 0)], 270)).toEqual([])
  })
})
