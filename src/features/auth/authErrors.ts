/** Traduit une erreur Supabase Auth en clé de message français (voir `fr.auth.errors`). */

export type AuthErrorKey =
  | 'invalidCredentials'
  | 'emailNotConfirmed'
  | 'weakPassword'
  | 'samePassword'
  | 'rateLimit'
  | 'network'
  | 'generic'

interface AuthErrorLike {
  code?: string
  message?: string
  name?: string
}

export function authErrorKey(error: AuthErrorLike): AuthErrorKey {
  switch (error.code) {
    case 'invalid_credentials':
      return 'invalidCredentials'
    case 'email_not_confirmed':
      return 'emailNotConfirmed'
    case 'weak_password':
      return 'weakPassword'
    case 'same_password':
      return 'samePassword'
    case 'over_email_send_rate_limit':
    case 'over_request_rate_limit':
      return 'rateLimit'
  }
  if (error.name === 'AuthRetryableFetchError' || /failed to fetch|network/i.test(error.message ?? '')) {
    return 'network'
  }
  return 'generic'
}
