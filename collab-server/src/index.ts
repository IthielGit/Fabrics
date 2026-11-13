// Point d'entrée du Worker : vérifie la demande de connexion, puis la confie à la salle du projet.
//
//   wss://<worker>/room/<projectId>   avec   Sec-WebSocket-Protocol: fabrics-collab, <jeton Supabase>

import { lookupRole, parseRoomPath, readTokenFromProtocols } from './auth'
import type { Env } from './env'
import { ROLE_HEADER } from './room'

export { CollabRoom } from './room'

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    if (url.pathname === '/') return new Response('Fabrics — serveur temps réel', { status: 200 })

    const projectId = parseRoomPath(url.pathname)
    if (!projectId) return new Response('Introuvable', { status: 404 })
    if (request.headers.get('Upgrade')?.toLowerCase() !== 'websocket') {
      return new Response('Connexion WebSocket attendue', { status: 426 })
    }
    if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
      return new Response('Serveur mal configuré (Supabase)', { status: 500 })
    }

    const token = readTokenFromProtocols(request.headers.get('Sec-WebSocket-Protocol'))
    if (!token) return new Response('Jeton manquant', { status: 401 })

    const lookup = await lookupRole({ url: env.SUPABASE_URL, anonKey: env.SUPABASE_ANON_KEY }, token, projectId)
    if (!lookup.ok) return new Response('Accès refusé', { status: lookup.status })

    // On recopie la demande avec le rôle vérifié : un en-tête de même nom envoyé par le client est écrasé.
    const headers = new Headers(request.headers)
    headers.set(ROLE_HEADER, lookup.role)
    const stub = env.COLLAB_ROOM.get(env.COLLAB_ROOM.idFromName(projectId))
    return stub.fetch(new Request(request.url, { method: 'GET', headers }))
  },
} satisfies ExportedHandler<Env>
