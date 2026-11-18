import { createI18n } from '@pascal-app/core'
import { describe, expect, it } from 'vitest'
import { fabricsFr } from './fabricsMessages'
import './runtime' // enregistre le paquet « fabrics » en français

describe('textes de Fabrics dans le système de traduction de Pascal', () => {
  const scope = createI18n({ locale: 'fr' })

  it('rend un texte simple en français', () => {
    expect(scope._('fabrics.home.title')).toBe('Projets récents')
  })

  it('remplace une variable', () => {
    expect(scope._('fabrics.home.noSearchResult', { query: 'villa' })).toBe('Aucun projet ne correspond à « villa ».')
    expect(scope._('fabrics.projects.deleteMessage', { name: 'Maison' })).toContain('« Maison » sera supprimé')
  })

  it('connaît chaque identifiant déclaré', () => {
    for (const id of Object.keys(fabricsFr)) {
      expect(scope._(`fabrics.${id}`, { name: 'x', email: 'x', query: 'x' })).not.toBe(`fabrics.${id}`)
    }
  })
})
