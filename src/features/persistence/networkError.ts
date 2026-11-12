/**
 * Vrai si l'erreur vient d'un problème de connexion (réseau coupé, serveur injoignable),
 * donc si réessayer plus tard a du sens. Une erreur de droits ou de données invalides
 * n'en est pas une : réessayer ne la ferait pas disparaître.
 */
export function isNetworkError(error: unknown): boolean {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return true
  if (!error || typeof error !== 'object') return false
  const { name, message, code } = error as { name?: unknown; message?: unknown; code?: unknown }
  if (typeof code === 'string' && code.length > 0 && code !== 'ECONNRESET') return false
  if (name === 'AuthRetryableFetchError') return true
  const text = typeof message === 'string' ? message : ''
  return /failed to fetch|network ?error|load failed|networkerror|fetch failed/i.test(text)
}
