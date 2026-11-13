import { describe, expect, it } from 'vitest'
import { safeRedirectPath } from './redirect'

describe('safeRedirectPath', () => {
  it('garde un chemin interne, avec requête et ancre', () => {
    expect(safeRedirectPath('/')).toBe('/')
    expect(safeRedirectPath('/p/abc-123')).toBe('/p/abc-123')
    expect(safeRedirectPath('/p/abc?vue=3d#mur')).toBe('/p/abc?vue=3d#mur')
  })

  it("refuse ce qui n'est pas une chaîne", () => {
    expect(safeRedirectPath(undefined)).toBe('/')
    expect(safeRedirectPath(null)).toBe('/')
    expect(safeRedirectPath(42)).toBe('/')
    expect(safeRedirectPath({ from: '/p/1' })).toBe('/')
  })

  it('refuse les chemins relatifs et les URL absolues', () => {
    expect(safeRedirectPath('')).toBe('/')
    expect(safeRedirectPath('p/abc')).toBe('/')
    expect(safeRedirectPath('https://exemple.com/p/1')).toBe('/')
    expect(safeRedirectPath('javascript:alert(1)')).toBe('/')
  })

  it('refuse les chemins qui sortent du site', () => {
    expect(safeRedirectPath('//exemple.com')).toBe('/')
    expect(safeRedirectPath('/\\exemple.com')).toBe('/')
  })

  it("refuse les pages d'accès, même avec requête, ancre ou sous-chemin", () => {
    expect(safeRedirectPath('/bienvenue')).toBe('/')
    expect(safeRedirectPath('/bienvenue?x=1')).toBe('/')
    expect(safeRedirectPath('/bienvenue#haut')).toBe('/')
    expect(safeRedirectPath('/bienvenue/plus')).toBe('/')
    expect(safeRedirectPath('/connexion')).toBe('/')
    expect(safeRedirectPath('/connexion?mode=inscription')).toBe('/')
    expect(safeRedirectPath('/connexion#form')).toBe('/')
    expect(safeRedirectPath('/connexion/autre')).toBe('/')
  })

  it('garde les chemins qui ressemblent seulement aux pages d’accès', () => {
    expect(safeRedirectPath('/bienvenues')).toBe('/bienvenues')
    expect(safeRedirectPath('/connexions-utiles')).toBe('/connexions-utiles')
  })
})
