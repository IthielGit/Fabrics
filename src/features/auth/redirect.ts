/** Pages publiques d'accès : y revenir après connexion n'aurait aucun sens. */
const EXCLUDED_PATHS = ['/bienvenue', '/connexion']

/**
 * Chemin interne sûr vers lequel renvoyer l'utilisateur après connexion.
 * Refuse tout ce qui pourrait sortir du site (`//hote`, `/\hote`, URL absolue)
 * ou ramener vers une page d'accès ; dans ce cas, renvoie vers l'accueil.
 */
export function safeRedirectPath(value: unknown): string {
  if (typeof value !== 'string') return '/'
  if (!value.startsWith('/')) return '/'
  if (value.startsWith('//') || value.startsWith('/\\')) return '/'
  const pathname = value.split(/[?#]/, 1)[0]
  const excluded = EXCLUDED_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  )
  return excluded ? '/' : value
}
