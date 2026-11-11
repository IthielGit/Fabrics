import { describe, expect, it } from 'vitest'
import { furniturePlacement } from './placement'
import { normalizeText, searchSymbols, type SymbolSearchText } from './search'
import type { SymbolDef } from './types'

const base = {
  category: 'kitchen' as const,
  width: 600,
  depth: 600,
  min: { width: 300, depth: 300 },
  max: { width: 1200, depth: 1200 },
  resize: 'free' as const,
  mirrorable: false,
  height: 850,
  draw: () => [],
}
const symbols: SymbolDef[] = ['dishwasher', 'fridge', 'bed', 'sofa'].map((id) => ({ ...base, id }))

const TEXTS: Record<string, SymbolSearchText> = {
  dishwasher: { name: 'Lave-vaisselle', keywords: ['vaisselle', 'electromenager'], category: 'Cuisine' },
  fridge: { name: 'Réfrigérateur', keywords: ['frigo', 'froid'], category: 'Cuisine' },
  bed: { name: 'Lit 160 × 200', keywords: ['couchage', 'chambre'], category: 'Chambre' },
  sofa: { name: 'Canapé 3 places', keywords: ['divan', 'salon'], category: 'Séjour et salon' },
}
const textOf = (symbol: SymbolDef) => TEXTS[symbol.id]
const ids = (query: string) => searchSymbols(symbols, query, textOf).map((s) => s.id)

describe('normalizeText', () => {
  it('retire les accents, la casse et la ponctuation', () => {
    expect(normalizeText('  Réfrigérateur ')).toBe('refrigerateur')
    expect(normalizeText('Lave-vaisselle')).toBe('lave vaisselle')
    expect(normalizeText("L'ÉTAGÈRE")).toBe('l etagere')
  })
})

describe('searchSymbols', () => {
  it('une recherche vide renvoie tout, dans l’ordre du catalogue', () => {
    expect(ids('')).toEqual(['dishwasher', 'fridge', 'bed', 'sofa'])
    expect(ids('   ')).toEqual(['dishwasher', 'fridge', 'bed', 'sofa'])
  })

  it('« lave vaisselle » trouve « Lave-vaisselle » (sans tiret, sans accent, sans casse)', () => {
    expect(ids('lave vaisselle')).toEqual(['dishwasher'])
    expect(ids('LAVE-VAISSELLE')).toEqual(['dishwasher'])
    expect(ids('refrigerateur')).toEqual(['fridge'])
    expect(ids('canape')).toEqual(['sofa'])
  })

  it('cherche aussi dans les mots-clés et la catégorie', () => {
    expect(ids('divan')).toEqual(['sofa'])
    expect(ids('frigo')).toEqual(['fridge'])
    expect(ids('cuisine').sort()).toEqual(['dishwasher', 'fridge'])
  })

  it('tous les mots doivent être trouvés', () => {
    expect(ids('cuisine frigo')).toEqual(['fridge'])
    expect(ids('cuisine divan')).toEqual([])
  })

  it('le nom passe avant un mot-clé, et le début du nom avant le milieu', () => {
    const list: SymbolDef[] = ['a', 'b', 'c'].map((id) => ({ ...base, id }))
    const text: Record<string, SymbolSearchText> = {
      a: { name: 'Meuble', keywords: ['table'], category: 'X' },
      b: { name: 'Grande table', keywords: [], category: 'X' },
      c: { name: 'Table', keywords: [], category: 'X' },
    }
    const result = searchSymbols(list, 'table', (s) => text[s.id]).map((s) => s.id)
    expect(result).toEqual(['c', 'b', 'a'])
  })

  it('aucun résultat → liste vide', () => {
    expect(ids('zzz')).toEqual([])
  })
})

describe('furniturePlacement', () => {
  const bed = { width: 1600, depth: 2000 }

  it('centre l’objet sur le point', () => {
    expect(furniturePlacement(bed, { x: 5000, y: 4000 }, null)).toMatchObject({ x: 4200, y: 3000 })
  })

  it('aimante le coin à la grille', () => {
    expect(furniturePlacement(bed, { x: 5040, y: 3960 }, 100)).toMatchObject({ x: 4200, y: 3000 })
    expect(furniturePlacement(bed, { x: 5060, y: 3960 }, 100)).toMatchObject({ x: 4300, y: 3000 })
    // 450 × 450 : le coin tombe sur la grille (le centre, lui, est à 225 mm du coin).
    expect(furniturePlacement({ width: 450, depth: 450 }, { x: 1000, y: 1000 }, 100)).toMatchObject({
      x: 800,
      y: 800,
    })
  })

  it('donne des mm entiers', () => {
    expect(furniturePlacement({ width: 451, depth: 451 }, { x: 1000.4, y: 1000.4 }, null)).toMatchObject({
      x: 775,
      y: 775,
    })
  })
})
