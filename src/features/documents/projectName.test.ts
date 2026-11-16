import { describe, expect, it } from 'vitest'
import { defaultProjectName, displayProjectName, uniqueName } from './projectName'

const date = new Date(2026, 10, 16, 14, 32) // 16 novembre 2026, 14:32 (heure locale)

describe('defaultProjectName', () => {
  it('donne un nom daté au plan et au visuel', () => {
    expect(defaultProjectName('plan', date)).toBe('Plan du 16 nov. à 14:32')
    expect(defaultProjectName('design', date)).toBe('Visuel du 16 nov. à 14:32')
  })

  it('ajoute un numéro si le nom existe déjà', () => {
    expect(defaultProjectName('plan', date, ['Plan du 16 nov. à 14:32'])).toBe('Plan du 16 nov. à 14:32 (2)')
  })
})

describe('uniqueName', () => {
  it('cherche le premier numéro libre', () => {
    expect(uniqueName('Exemple', [])).toBe('Exemple')
    expect(uniqueName('Exemple', ['Exemple', 'Exemple (2)'])).toBe('Exemple (3)')
  })
})

describe('displayProjectName', () => {
  it('remplace un ancien nom « sans titre » par sa date de création', () => {
    expect(displayProjectName({ name: 'Plan sans titre', kind: 'plan', createdAt: date.toISOString() })).toBe(
      'Plan du 16 nov. à 14:32',
    )
    expect(displayProjectName({ name: 'Visuel sans titre', kind: 'design', createdAt: date.toISOString() })).toBe(
      'Visuel du 16 nov. à 14:32',
    )
  })

  it('garde un nom choisi par l’utilisateur', () => {
    expect(displayProjectName({ name: 'Maison Dupont', kind: 'plan', createdAt: date.toISOString() })).toBe(
      'Maison Dupont',
    )
  })
})
