import { describe, expect, it } from 'vitest'
import { formatRelativeTime } from './relativeTime'

const NOW = new Date('2026-11-10T12:00:00.000Z')
const ago = (seconds: number) => new Date(NOW.getTime() - seconds * 1000).toISOString()

describe('formatRelativeTime', () => {
  it('affiche « maintenant » pour moins d’une minute', () => {
    expect(formatRelativeTime(ago(10), NOW)).toBe('maintenant')
  })

  it('affiche les minutes', () => {
    expect(formatRelativeTime(ago(5 * 60), NOW)).toBe('il y a 5 minutes')
  })

  it('affiche les heures', () => {
    expect(formatRelativeTime(ago(3 * 3600), NOW)).toBe('il y a 3 heures')
  })

  it('affiche « hier » puis les jours', () => {
    expect(formatRelativeTime(ago(24 * 3600), NOW)).toBe('hier')
    expect(formatRelativeTime(ago(3 * 24 * 3600), NOW)).toBe('il y a 3 jours')
  })

  it('affiche la date complète au-delà de 30 jours', () => {
    expect(formatRelativeTime('2026-03-03T12:00:00.000Z', NOW)).toBe('3 mars 2026')
  })
})
