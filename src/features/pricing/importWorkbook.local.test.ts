/**
 * Essai sur le vrai classeur de l'utilisateur (`tmp/prix/Biblio de prix.xlsx`), s'il est présent sur
 * cette machine. Le dossier `tmp/` n'est jamais versionné : ailleurs (CI), cet essai est sauté.
 * Seuls des nombres de lignes et des contrôles de cohérence sont vérifiés, aucun prix n'est écrit ici.
 */
import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { importWorkbook } from './importWorkbook'
import { readXlsx } from './xlsxRead'

const PATH = 'tmp/prix/Biblio de prix.xlsx'

describe.skipIf(!existsSync(PATH))('classeur réel de l’utilisateur (local seulement)', () => {
  it('importe matériaux, matériel, main-d’œuvre et les 320 postes avec leur sous-détail', () => {
    const result = importWorkbook(readXlsx(new Uint8Array(readFileSync(PATH))), 2000)
    const count = (kind: string) => result.priceItems.filter((item) => item.kind === kind).length
    const summary = {
      material: count('material'),
      equipment: count('equipment'),
      labour: count('labour'),
      work: result.workItems.length,
      workWithoutPrice: result.workItems.filter((w) => w.priceHt === null).length,
      workWithoutComponents: result.workItems.filter((w) => w.components.length === 0).length,
      priceDate: result.priceDate,
      issues: result.issues.map((i) => `${i.level} ${i.code} ×${i.count} ${i.examples.map((e) => `[${e.sheet}!${e.row} ${e.detail}]`).slice(0, 3).join(' ')}`),
    }
    console.log(JSON.stringify(summary, null, 2))
    expect(result.workItems).toHaveLength(320)
    expect(summary.workWithoutPrice).toBe(0)
    expect(result.priceDate).toBe('2026-10-01')
    expect(result.issues.filter((i) => i.level === 'blocking')).toEqual([])
  })
})
