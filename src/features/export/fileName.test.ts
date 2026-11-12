import { describe, expect, it } from 'vitest'
import { exportFileName, sanitizeFileName } from './fileName'

describe('sanitizeFileName', () => {
  it('retire les caractères interdits et les points ou espaces en fin de nom', () => {
    expect(sanitizeFileName('Plan: étage/1 ?. ', 'plan')).toBe('Plan étage 1')
  })

  it('utilise le nom de secours si rien ne reste', () => {
    expect(sanitizeFileName('  ***  ', 'plan')).toBe('plan')
  })
})

describe('exportFileName', () => {
  it('ajoute l’extension', () => {
    expect(exportFileName('Affiche', 'png', 'visuel')).toBe('Affiche.png')
  })

  it('ne double pas une extension déjà saisie', () => {
    expect(exportFileName('Affiche.PDF', 'pdf', 'visuel')).toBe('Affiche.PDF')
  })

  it('garde l’extension si le nom est vide', () => {
    expect(exportFileName('', 'jpg', 'visuel')).toBe('visuel.jpg')
  })

  it('ajoute le suffixe de version avant l’extension, sans le doubler', () => {
    expect(exportFileName('Maison', 'xlsx', 'metres', '-client')).toBe('Maison-client.xlsx')
    expect(exportFileName('Maison.xlsx', 'xlsx', 'metres', '-client')).toBe('Maison-client.xlsx')
    expect(exportFileName('Maison-Client', 'pdf', 'metres', '-client')).toBe('Maison-Client.pdf')
    expect(exportFileName('', 'csv', 'metres', '-execution')).toBe('metres-execution.csv')
  })
})
