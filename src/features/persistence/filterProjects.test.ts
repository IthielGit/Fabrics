import { describe, expect, it } from 'vitest'
import { filterProjectsByName, normalizeSearchText } from './filterProjects'

const projects = [
  { id: '1', name: 'Maison Éléonore' },
  { id: '2', name: 'Affiche été 2026' },
  { id: '3', name: 'Plan sans titre' },
]

describe('recherche de projets', () => {
  it('ignore la casse et les accents', () => {
    expect(filterProjectsByName(projects, 'ELEONORE').map((p) => p.id)).toEqual(['1'])
    expect(filterProjectsByName(projects, 'ete').map((p) => p.id)).toEqual(['2'])
    expect(normalizeSearchText('  Ça Va  ')).toBe('ca va')
  })
  it('demande tous les mots, dans n’importe quel ordre', () => {
    expect(filterProjectsByName(projects, '2026 affiche').map((p) => p.id)).toEqual(['2'])
    expect(filterProjectsByName(projects, 'plan maison')).toEqual([])
  })
  it('une recherche vide garde tout, dans l’ordre', () => {
    expect(filterProjectsByName(projects, '   ').map((p) => p.id)).toEqual(['1', '2', '3'])
  })
})
