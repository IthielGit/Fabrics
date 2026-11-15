// Adresse du serveur temps réel (M14). Fonctions pures, testées.

/** Protocole annoncé au serveur ; le jeton Supabase voyage juste après (jamais dans l'adresse). */
export const COLLAB_PROTOCOL = 'fabrics-collab'

/**
 * Base des salles à partir de `VITE_COLLAB_URL` (`https://…` ou `wss://…`, avec ou sans `/` final) :
 * `wss://<serveur>/room`. Retourne `null` si l'adresse est absente ou invalide (collaboration désactivée).
 */
export function collabRoomBase(value: string | undefined): string | null {
  const trimmed = value?.trim()
  if (!trimmed) return null
  try {
    const url = new URL(trimmed)
    if (url.protocol === 'https:') url.protocol = 'wss:'
    else if (url.protocol === 'http:') url.protocol = 'ws:'
    else if (url.protocol !== 'wss:' && url.protocol !== 'ws:') return null
    const path = url.pathname.replace(/\/+$/, '')
    return `${url.protocol}//${url.host}${path}/room`
  } catch {
    return null
  }
}

/** Sous-protocoles WebSocket attendus par le serveur : `fabrics-collab, <jeton>`. */
export function collabProtocols(accessToken: string): string[] {
  return [COLLAB_PROTOCOL, accessToken]
}
