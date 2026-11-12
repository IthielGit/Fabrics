import { describe, expect, it } from 'vitest'
import { isSupabaseConfigured } from './supabase'

describe('isSupabaseConfigured', () => {
  it('est faux sans variables', () => {
    expect(isSupabaseConfigured(undefined, undefined)).toBe(false)
  })
  it('est faux si une variable est vide ou ne contient que des espaces', () => {
    expect(isSupabaseConfigured('https://x.supabase.co', '')).toBe(false)
    expect(isSupabaseConfigured('  ', 'cle')).toBe(false)
  })
  it('est vrai avec les deux variables', () => {
    expect(isSupabaseConfigured('https://x.supabase.co', 'cle')).toBe(true)
  })
})
