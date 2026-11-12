import { describe, expect, it } from 'vitest'
import { authErrorKey } from './authErrors'

describe('authErrorKey', () => {
  it('reconnaît les codes Supabase', () => {
    expect(authErrorKey({ code: 'invalid_credentials' })).toBe('invalidCredentials')
    expect(authErrorKey({ code: 'email_not_confirmed' })).toBe('emailNotConfirmed')
    expect(authErrorKey({ code: 'weak_password' })).toBe('weakPassword')
    expect(authErrorKey({ code: 'same_password' })).toBe('samePassword')
    expect(authErrorKey({ code: 'over_email_send_rate_limit' })).toBe('rateLimit')
  })
  it('reconnaît une panne réseau', () => {
    expect(authErrorKey({ name: 'AuthRetryableFetchError' })).toBe('network')
    expect(authErrorKey({ message: 'Failed to fetch' })).toBe('network')
  })
  it('retombe sur un message général', () => {
    expect(authErrorKey({ message: 'quelque chose' })).toBe('generic')
    expect(authErrorKey({})).toBe('generic')
  })
})
