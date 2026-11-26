import { describe, expect, it } from 'vitest'
import { matchesQuery, searchItems } from './search'

const items = [
  { code: '1.1', designation: 'Ciment synthétique CEM I', category: 'CIMENT', supplier: 'Fournisseur A' },
  { code: '2.1', designation: 'Brique pleine', category: 'MAÇONNERIE', supplier: '' },
]

describe('recherche dans la bibliothèque', () => {
  it('cherche chaque mot, sans accents ni majuscules', () => {
    expect(matchesQuery(items[0], 'ciment synthetique')).toBe(true)
    expect(matchesQuery(items[1], 'maconnerie')).toBe(true)
    expect(matchesQuery(items[0], 'ciment brique')).toBe(false)
    expect(matchesQuery(items[0], '  ')).toBe(true)
    expect(matchesQuery(items[0], 'fournisseur')).toBe(true)
  })

  it('limite le nombre de lignes affichées et compte toutes les correspondances', () => {
    expect(searchItems(items, '', 1)).toEqual({ shown: [items[0]], matchCount: 2 })
  })
})
