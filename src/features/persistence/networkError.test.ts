import { describe, expect, it } from 'vitest'
import { isNetworkError } from './networkError'

describe('isNetworkError', () => {
  it('reconnaît les messages de réseau coupé des navigateurs', () => {
    expect(isNetworkError(new TypeError('Failed to fetch'))).toBe(true)
    expect(isNetworkError({ message: 'TypeError: Failed to fetch' })).toBe(true)
    expect(isNetworkError({ message: 'Load failed' })).toBe(true)
    expect(isNetworkError({ message: 'NetworkError when attempting to fetch resource.' })).toBe(true)
  })
  it('ne prend pas une erreur de droits ou de données pour une panne', () => {
    expect(isNetworkError({ code: '42501', message: 'new row violates row-level security policy' })).toBe(false)
    expect(isNetworkError({ message: 'Payload too large' })).toBe(false)
    expect(isNetworkError(null)).toBe(false)
    expect(isNetworkError('texte')).toBe(false)
  })
})
