import { strFromU8, unzipSync } from 'fflate'
import { describe, expect, it } from 'vitest'
import type { MetresTable } from '../measurements/tables'
import { buildMetresXlsx, columnName, sheetName, xmlEscape } from './metresXlsx'

const table: MetresTable = {
  id: 'rooms',
  title: 'Pièces',
  note: 'Surface au tracé & périmètre',
  columns: [
    { header: 'Niveau', align: 'left' },
    { header: 'Nom', align: 'left' },
    { header: 'Surface au tracé (m²)', align: 'right' },
    { header: 'Périmètre (mm)', align: 'right' },
  ],
  rows: [
    ['Rez', '=SOMME(A1)', { text: '4,00', value: 4.004, unit: 'm2' }, { text: '8004', value: 8004, unit: 'mm' }],
    ['Étage 1', 'Salon <1> & "cuisine"', { text: '4,00', value: 4.004, unit: 'm2' }, { text: '8004', value: 8004, unit: 'mm' }],
  ],
  total: [
    'Total',
    '',
    { text: '8,01', value: 8.008, unit: 'm2' },
    { text: '16008', value: 16008, unit: 'mm' },
  ],
}

const files = (bytes: Uint8Array) =>
  Object.fromEntries(Object.entries(unzipSync(bytes)).map(([name, data]) => [name, strFromU8(data)]))

describe('buildMetresXlsx', () => {
  const info = { title: 'Métrés', rows: [['Projet', 'Maison'] as [string, string]] }
  const out = files(buildMetresXlsx([table], info, '2026-11-11T10:00:00Z'))

  it('contient les fichiers d’un classeur Excel', () => {
    for (const name of [
      '[Content_Types].xml',
      '_rels/.rels',
      'xl/workbook.xml',
      'xl/_rels/workbook.xml.rels',
      'xl/styles.xml',
      'xl/worksheets/sheet1.xml',
      'xl/worksheets/sheet2.xml',
      'docProps/core.xml',
    ]) {
      expect(out[name], name).toBeDefined()
    }
  })

  it('met un onglet d’information puis un onglet par tableau', () => {
    expect(out['xl/workbook.xml']).toContain('<sheet name="Métrés" sheetId="1" r:id="rId1"/>')
    expect(out['xl/workbook.xml']).toContain('<sheet name="Pièces" sheetId="2" r:id="rId2"/>')
    expect(out['xl/worksheets/sheet1.xml']).toContain('Maison')
  })

  it('écrit de vrais nombres, avec leur valeur exacte', () => {
    const sheet = out['xl/worksheets/sheet2.xml']
    expect(sheet).toContain('<v>4.004</v>')
    expect(sheet).toContain('<v>8004</v>')
  })

  it('met les totaux en formule SOMME sur les lignes du tableau', () => {
    const sheet = out['xl/worksheets/sheet2.xml']
    // Titre (ligne 1), note (2), en-tête (3), données (4 et 5), total (6).
    expect(sheet).toContain('<f>SUM(C4:C5)</f><v>8.008</v>')
    expect(sheet).toContain('<f>SUM(D4:D5)</f><v>16008</v>')
  })

  it('fige l’en-tête, ajoute un filtre et une mise en page paysage', () => {
    const sheet = out['xl/worksheets/sheet2.xml']
    expect(sheet).toContain('<pane ySplit="3" topLeftCell="A4" activePane="bottomLeft" state="frozen"/>')
    expect(sheet).toContain('<autoFilter ref="A3:D5"/>')
    expect(sheet).toContain('orientation="landscape"')
  })

  it('stocke le texte comme du texte : une formule saisie ne s’exécute pas', () => {
    const sheet = out['xl/worksheets/sheet2.xml']
    expect(sheet).toContain('t="inlineStr"><is><t xml:space="preserve">=SOMME(A1)</t>')
    expect(sheet).not.toContain('<f>SOMME')
  })

  it('échappe les caractères réservés du XML', () => {
    expect(out['xl/worksheets/sheet2.xml']).toContain('Salon &lt;1&gt; &amp; &quot;cuisine&quot;')
    expect(out['xl/worksheets/sheet2.xml']).toContain('Surface au tracé &amp; périmètre')
  })

  it('demande à Excel de recalculer les formules à l’ouverture', () => {
    expect(out['xl/workbook.xml']).toContain('fullCalcOnLoad="1"')
  })

  it('fonctionne sans onglet d’information et avec un tableau sans ligne', () => {
    const bytes = buildMetresXlsx([{ ...table, rows: [], total: undefined }])
    const sheet = files(bytes)['xl/worksheets/sheet1.xml']
    expect(sheet).not.toContain('autoFilter')
    expect(sheet).toContain('<sheetData>')
  })
})

describe('aides', () => {
  it('nomme les colonnes comme Excel', () => {
    expect([0, 25, 26, 27, 701, 702].map(columnName)).toEqual(['A', 'Z', 'AA', 'AB', 'ZZ', 'AAA'])
  })

  it('nettoie et rend uniques les noms d’onglets (31 caractères, sans caractères interdits)', () => {
    expect(sheetName('Symboles conventionnels (non à l’échelle) très longs', new Set())).toHaveLength(31)
    expect(sheetName('A/B:C', new Set())).toBe('A B C')
    expect(sheetName('Murs', new Set(['murs']))).toBe('Murs 2')
  })

  it('retire les caractères de contrôle interdits en XML', () => {
    expect(xmlEscape('a\u0001b<c>')).toBe('ab&lt;c&gt;')
  })
})
