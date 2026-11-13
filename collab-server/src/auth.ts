// Authentification d'une connexion : chemin de la salle, jeton Supabase et rôle sur le projet.
// Le Worker n'a aucun secret : il interroge Supabase avec le jeton de la personne et la clé
// publique `anon`. Les règles RLS et la fonction `my_project_role` font le reste.

import type { Role } from './protocol'

/** Sous-protocole WebSocket annoncé par le client, suivi de son jeton de session. */
export const SUBPROTOCOL = 'fabrics-collab'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
// Un jeton JWT : trois parties en base64url séparées par des points.
const JWT = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/

/** `/room/<projectId>` → identifiant du projet en minuscules, sinon `null`. */
export function parseRoomPath(pathname: string): string | null {
  const match = /^\/room\/([^/]+)\/?$/.exec(pathname)
  if (!match || !UUID.test(match[1])) return null
  return match[1].toLowerCase()
}

/**
 * Le navigateur ne peut pas ajouter d'en-tête à une WebSocket : le jeton voyage dans
 * `Sec-WebSocket-Protocol` (`fabrics-collab, <jeton>`), jamais dans l'adresse (qui finit
 * dans les journaux).
 */
export function readTokenFromProtocols(header: string | null): string | null {
  if (!header) return null
  const parts = header.split(',').map((part) => part.trim())
  if (parts.length !== 2 || parts[0] !== SUBPROTOCOL) return null
  return JWT.test(parts[1]) ? parts[1] : null
}

/** Réponse JSON de `my_project_role` → rôle, ou `null` si aucun accès. */
export function parseRole(value: unknown): Role | null {
  return value === 'owner' || value === 'editor' || value === 'viewer' ? value : null
}

export interface SupabaseConfig {
  url: string
  anonKey: string
}

export type RoleLookup =
  | { ok: true; role: Role }
  /** 401 : jeton absent, invalide ou expiré. 403 : aucun accès au projet. 502 : Supabase injoignable. */
  | { ok: false; status: 401 | 403 | 502 }

/** Demande à Supabase le rôle de la personne (identifiée par son jeton) sur le projet. */
export async function lookupRole(
  config: SupabaseConfig,
  token: string,
  projectId: string,
  fetcher: typeof fetch = fetch,
): Promise<RoleLookup> {
  let response: Response
  try {
    response = await fetcher(`${config.url.replace(/\/+$/, '')}/rest/v1/rpc/my_project_role`, {
      method: 'POST',
      headers: {
        apikey: config.anonKey,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ p_project_id: projectId }),
    })
  } catch {
    return { ok: false, status: 502 }
  }
  if (response.status === 401 || response.status === 403) return { ok: false, status: 401 }
  if (!response.ok) return { ok: false, status: 502 }
  let body: unknown
  try {
    body = await response.json()
  } catch {
    return { ok: false, status: 502 }
  }
  const role = parseRole(body)
  return role ? { ok: true, role } : { ok: false, status: 403 }
}
