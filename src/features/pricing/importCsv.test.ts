import { describe, expect, it } from 'vitest'
import { importCsv, parseCsvRows } from './importCsv'

const CSV = [
  'Type;Code;Catégorie;Désignation;Unité;Prix;Base;Sans TVA;Fournisseur;Date;Devise',
  'Matériau;M1;Liant;"Liant ""spécial""; sac";Sac;42 000;TTC;;Fourn A;01/10/2026;Ar',
  'matériau;M2;Granulat;Sable synthétique;m2;70000;TTC;oui;;2026-10-01;MGA',
  'Main-d’œuvre;;;Aide synthétique;J;16346,15;;;;;',
  'Poste;CAT-99-001;Essai;Poste synthétique;ml;1 234,5;;;;;',
  'Inconnu;X;;Ligne fausse;U;1;;;;;',
  'Matériel;;;Sans prix;J;;;;;;',
].join('\r\n')

describe('importCsv', () => {
  it('découpe un CSV avec guillemets et séparateur « ; »', () => {
    expect(parseCsvRows('a;"b;c";"d ""e"""\n1;2;3')).toEqual([
      ['a', 'b;c', 'd "e"'],
      ['1', '2', '3'],
    ])
    expect(parseCsvRows('a,b\n1,2')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ])
  })

  it('importe chaque type, calcule le HT et signale chaque correction', () => {
    const result = importCsv(CSV, 2000)
    expect(result.priceItems.map((i) => [i.kind, i.designation, i.unit, i.sourcePrice, i.priceHt, i.vatExempt, i.effectiveDate])).toEqual([
      ['material', 'Liant "spécial"; sac', 'Sac', 420000n, 350000n, false, '2026-10-01'],
      ['material', 'Sable synthétique', 'm²', 700000n, 700000n, true, '2026-10-01'],
      ['labour', 'Aide synthétique', 'J', null, 163462n, false, null],
      ['equipment', 'Sans prix', 'J', null, null, false, null],
    ])
    expect(result.workItems.map((w) => [w.code, w.unit, w.priceHt, w.sourceKey])).toEqual([
      ['CAT-99-001', 'ml', 12345n, 'CSV:work:CAT-99-001'],
    ])
    const codes = Object.fromEntries(result.issues.map((i) => [i.code, i.count]))
    expect(codes).toMatchObject({ csvRowInvalid: 1, priceMissing: 1, decimalsRounded: 1, unitNormalized: 1 })
    expect(result.issues.some((i) => i.level === 'blocking')).toBe(false)
  })

  it('bloque une devise étrangère', () => {
    const result = importCsv('type;désignation;unité;prix;devise\nmatériau;X;U;10;EUR', 2000)
    expect(result.issues.find((i) => i.code === 'currencyMismatch')?.level).toBe('blocking')
  })

  it('bloque un fichier sans les colonnes obligatoires', () => {
    const result = importCsv('nom;valeur\nx;1', 2000)
    expect(result.issues[0]).toMatchObject({ code: 'csvHeaderMissing', level: 'blocking' })
  })
})
