import { describe, expect, it } from 'vitest'
import { pascalDisplayName } from './pascalDisplayName'

describe('pascalDisplayName', () => {
  it('traduit une pièce du catalogue de Pascal en gardant son numéro', () => {
    expect(pascalDisplayName('Bedroom 2')).toBe('Chambre 2')
    expect(pascalDisplayName('Kitchen')).toBe('Cuisine')
  })

  it('traduit les noms par défaut des outils', () => {
    expect(pascalDisplayName('Roof 1')).toBe('Toiture 1')
    expect(pascalDisplayName('Staircase 3')).toBe('Escalier 3')
    expect(pascalDisplayName('Wall 12')).toBe('Mur 12')
  })

  it('laisse tel quel un nom tapé par l’utilisateur', () => {
    expect(pascalDisplayName('Séjour côté jardin')).toBe('Séjour côté jardin')
    expect(pascalDisplayName('Wall street')).toBe('Wall street')
    expect(pascalDisplayName('')).toBe('')
  })

  it('ignore les clés héritées des objets JavaScript', () => {
    expect(pascalDisplayName('constructor')).toBe('constructor')
    expect(pascalDisplayName('__proto__ 2')).toBe('__proto__ 2')
  })
})
