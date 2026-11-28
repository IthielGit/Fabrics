/**
 * M24, 24.2 — fichiers piégés : chaque fichier refusé l'est avant lecture, sans rien modifier, avec la
 * bonne raison ; les noms saisis par l'utilisateur ne peuvent rien injecter dans les fichiers exportés.
 */
import { strToU8, zipSync } from 'fflate'
import { describe, expect, it } from 'vitest'
import { fr } from '../../i18n/fr'
import type { Drawing } from '../building/views/drawing'
import { writeDxf } from '../export/dxf'
import { DxfReadError, MAX_DXF_PATHS, parseDxfText } from '../export/dxfImport'
import { drawingToSvg } from '../export/svg'
import { buildFabricsIfc } from '../ifc/exportIfc'
import { escapeCsvField } from '../measurements/csv'
import { readPriceFile } from '../pricing/readPriceFile'
import { XLSX_LIMITS } from '../pricing/xlsxRead'
import { house01 } from '../scene/migrate/fixtureDocuments'
import { fabricsToScene } from '../scene/migrate/fromFabrics'
import { settleScene } from '../scene/settle'
import { guardIfcFile, IMPORT_LIMITS, sniffKind } from './fileGuard'

const MB = 1024 * 1024
const text = (value: string) => new TextEncoder().encode(value)
const ends = (bytes: Uint8Array, sizeBytes = bytes.length) => ({ sizeBytes, head: bytes.slice(0, 4096), tail: bytes.slice(-4096) })

const house01Ifc = () => buildFabricsIfc(settleScene(fabricsToScene(house01()).scene), { projectName: 'Essai', labels: { levelSlab: 'Dalle' } }).ifc

describe('IFC : contrôle avant lecture (D24-7)', () => {
  it('un vrai IFC exporté par Fabrics passe', () => {
    expect(guardIfcFile(ends(text(house01Ifc())))).toEqual({ ok: true, slow: false })
  })

  it('une image PNG renommée en .ifc est refusée et reconnue', () => {
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13])
    expect(sniffKind(png)).toBe('png')
    expect(guardIfcFile(ends(png))).toEqual({ ok: false, reason: 'otherFormat', kind: 'png' })
  })

  it('un IFC tronqué (fin manquante) est refusé', () => {
    const ifc = house01Ifc()
    expect(guardIfcFile(ends(text(ifc.slice(0, Math.floor(ifc.length * 0.6)))))).toEqual({ ok: false, reason: 'truncated' })
  })

  it('un IFC trop gros est refusé sur sa taille seule ; au-delà de 30 Mo, l’import est annoncé long', () => {
    const ifc = text(house01Ifc())
    expect(guardIfcFile(ends(ifc, 180 * MB))).toEqual({ ok: false, reason: 'tooLarge', sizeBytes: 180 * MB, maxBytes: IMPORT_LIMITS.ifc.maxBytes })
    expect(guardIfcFile(ends(ifc, 40 * MB))).toEqual({ ok: true, slow: true })
  })

  it('un fichier vide, un texte quelconque, un ifcXML et un ifcZIP sont refusés', () => {
    expect(guardIfcFile(ends(new Uint8Array(0)))).toEqual({ ok: false, reason: 'empty' })
    expect(guardIfcFile(ends(text('Bonjour, ceci n’est pas un IFC')))).toEqual({ ok: false, reason: 'notIfc' })
    expect(guardIfcFile(ends(text('<?xml version="1.0"?><ifcXML/>')))).toEqual({ ok: false, reason: 'otherFormat', kind: 'xml' })
    expect(guardIfcFile(ends(zipSync({ 'a.ifc': strToU8(house01Ifc()) })))).toEqual({ ok: false, reason: 'otherFormat', kind: 'zip' })
  })
})

describe('autres fichiers importés', () => {
  it('un fond DXF de 25 000 traits est refusé (limite 20 000)', () => {
    const lines = Array.from({ length: 25_000 }, (_, i) => `0\nLINE\n8\n0\n10\n${i}\n20\n0\n11\n${i}\n21\n100`).join('\n')
    expect(25_000).toBeGreaterThan(MAX_DXF_PATHS)
    expect(() => parseDxfText(`0\nSECTION\n2\nENTITIES\n${lines}\n0\nENDSEC\n0\nEOF\n`)).toThrow(DxfReadError)
  })

  it('un classeur « bombe de décompression » est refusé sans être déplié en entier', () => {
    const huge = new Uint8Array(XLSX_LIMITS.maxXmlBytes + MB).fill(0x20)
    const bomb = zipSync({ '[Content_Types].xml': strToU8('<Types/>'), 'xl/worksheets/sheet1.xml': huge }, { level: 9 })
    expect(bomb.length).toBeLessThan(XLSX_LIMITS.maxFileBytes)
    const result = readPriceFile('prix.xlsx', bomb, 2000)
    expect(result.priceItems).toEqual([])
    expect(result.issues.map((issue) => issue.code)).toContain('tooLarge')
  })

  it('un classeur à macros (.xlsm) est refusé : rien n’est exécuté', () => {
    const xlsm = zipSync({ 'xl/vbaProject.bin': new Uint8Array([1, 2, 3]) })
    const result = readPriceFile('prix.xlsm', xlsm, 2000)
    expect(result.priceItems).toEqual([])
    expect(result.issues.map((issue) => issue.code)).toContain('notXlsx')
  })
})

describe('exports : aucun nom saisi ne peut injecter quoi que ce soit (D24-9)', () => {
  it('CSV : une désignation `=HYPERLINK(…)` est écrite comme du texte', () => {
    for (const formula of ['=HYPERLINK("http://x","clic")', '+1+1', '-2+3', '@SUM(A1)']) {
      expect(escapeCsvField(formula).replace(/^"/, '')).toMatch(/^ /)
    }
  })

  it('SVG : un nom de pièce `<script>` est échappé', () => {
    const drawing: Drawing = { width: 1000, height: 1000, polygons: [], lines: [], texts: [{ x: 0, y: 0, text: '<script>alert(1)</script> & "x"', size: 100 }] }
    const svg = drawingToSvg(drawing, { scale: 50, title: '</title><script>', layerNames: { ...fr.views.visibility.keys, base: fr.views.svgBaseLayer } })
    expect(svg).not.toContain('<script>')
    expect(svg).toContain('&lt;script&gt;alert(1)&lt;/script&gt; &amp; &quot;x&quot;')
  })

  it('DXF : un retour à la ligne dans un nom ne crée aucun code de groupe', () => {
    const dxf = writeDxf([{ name: 'TEXTES', color: 7 }], [{ kind: 'text', layer: 'TEXTES', x: 0, y: 0, height: 100, text: 'Salon\n0\nSECTION\n2\nENTITIES' }])
    expect(dxf).toContain('Salon 0 SECTION 2 ENTITIES')
    expect(dxf.split(/\r?\n/).filter((line) => line === 'SECTION').length).toBe(dxf.split(/\r?\n/).filter((line) => line === 'ENDSEC').length)
  })

  it('IFC : une apostrophe dans un nom de pièce ne ferme pas la chaîne STEP', () => {
    const document = house01()
    const room = document.elements.find((el) => el.type === 'room')!
    room.name = "Salon d'hiver'); #1=IFCWALL("
    const { ifc } = buildFabricsIfc(settleScene(fabricsToScene(document).scene), { projectName: 'Essai', labels: { levelSlab: 'Dalle' } })
    expect(ifc).toContain("Salon d''hiver''); #1=IFCWALL(")
    expect(ifc).not.toMatch(/'Salon d'hiver'/)
  })
})
