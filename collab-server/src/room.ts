// Durable Object : une salle par projet. Garde le `Y.Doc` en mémoire, relaie les mises à jour et la
// présence, et sauvegarde l'état dans son stockage SQLite. Les WebSocket sont « hibernables » : quand
// personne n'envoie rien, l'objet peut être mis en veille sans couper les connexions.

import { DurableObject } from 'cloudflare:workers'
import * as decoding from 'lib0/decoding'
import * as Y from 'yjs'
import { SUBPROTOCOL } from './auth'
import type { Env } from './env'
import { COMPACT_AFTER, restoreDoc, splitIntoChunks } from './persistence'
import {
  applyAwarenessEntries,
  type AwarenessEntry,
  decodeAwarenessUpdate,
  encodeAwarenessMessage,
  encodeSyncStep1,
  encodeUpdateMessage,
  handleSyncMessage,
  MESSAGE_AWARENESS,
  MESSAGE_SYNC,
  type Role,
  removalEntries,
} from './protocol'

/** En-tête interne posé par le Worker après vérification du rôle (jamais celui du client). */
export const ROLE_HEADER = 'X-Fabrics-Role'

/** Données attachées à chaque WebSocket ; elles survivent à la mise en veille. */
interface Attachment {
  role: Role
  /** Identifiants de présence (awareness) annoncés par cette connexion. */
  clientIds: number[]
}

export class CollabRoom extends DurableObject<Env> {
  private doc = new Y.Doc()
  private awareness = new Map<number, AwarenessEntry>()
  private pendingUpdates = 0

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env)
    void ctx.blockConcurrencyWhile(async () => {
      this.load()
    })
  }

  private load(): void {
    const sql = this.ctx.storage.sql
    sql.exec('CREATE TABLE IF NOT EXISTS snapshot (seq INTEGER PRIMARY KEY, data BLOB NOT NULL)')
    sql.exec('CREATE TABLE IF NOT EXISTS updates (seq INTEGER PRIMARY KEY AUTOINCREMENT, data BLOB NOT NULL)')
    const chunks = sql
      .exec<{ data: ArrayBuffer }>('SELECT data FROM snapshot ORDER BY seq')
      .toArray()
      .map((row) => new Uint8Array(row.data))
    const updates = sql
      .exec<{ data: ArrayBuffer }>('SELECT data FROM updates ORDER BY seq')
      .toArray()
      .map((row) => new Uint8Array(row.data))
    this.doc = restoreDoc(chunks, updates)
    this.pendingUpdates = updates.length
    this.doc.on('update', (update: Uint8Array, origin: unknown) => this.onDocUpdate(update, origin))
  }

  private onDocUpdate(update: Uint8Array, origin: unknown): void {
    this.ctx.storage.sql.exec('INSERT INTO updates (data) VALUES (?)', update)
    this.pendingUpdates++
    if (this.pendingUpdates >= COMPACT_AFTER) this.compact()
    const message = encodeUpdateMessage(update)
    for (const ws of this.ctx.getWebSockets()) {
      if (ws !== origin) send(ws, message)
    }
  }

  private compact(): void {
    const state = Y.encodeStateAsUpdate(this.doc)
    this.ctx.storage.transactionSync(() => {
      const sql = this.ctx.storage.sql
      sql.exec('DELETE FROM snapshot')
      splitIntoChunks(state).forEach((chunk, seq) => {
        sql.exec('INSERT INTO snapshot (seq, data) VALUES (?, ?)', seq, chunk)
      })
      sql.exec('DELETE FROM updates')
    })
    this.pendingUpdates = 0
  }

  async fetch(request: Request): Promise<Response> {
    const role = request.headers.get(ROLE_HEADER) as Role | null
    if (role !== 'owner' && role !== 'editor' && role !== 'viewer') {
      return new Response('Rôle manquant', { status: 403 })
    }
    const [client, server] = Object.values(new WebSocketPair())
    this.ctx.acceptWebSocket(server)
    const attachment: Attachment = { role, clientIds: [] }
    server.serializeAttachment(attachment)
    // Le serveur ouvre la synchronisation, puis donne la présence des autres participants.
    send(server, encodeSyncStep1(this.doc))
    if (this.awareness.size > 0) send(server, encodeAwarenessMessage([...this.awareness.values()]))
    return new Response(null, {
      status: 101,
      webSocket: client,
      headers: { 'Sec-WebSocket-Protocol': SUBPROTOCOL },
    })
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    if (typeof message === 'string') return // le protocole Yjs est binaire
    const attachment = ws.deserializeAttachment() as Attachment
    try {
      const decoder = decoding.createDecoder(new Uint8Array(message))
      const type = decoding.readVarUint(decoder)
      if (type === MESSAGE_SYNC) {
        const result = handleSyncMessage(decoder, this.doc, attachment.role, ws)
        // Toujours renvoyer l'étape 2, même vide : le client attend cette réponse pour se dire synchronisé.
        if (result.kind === 'reply' && result.reply) send(ws, result.reply)
      } else if (type === MESSAGE_AWARENESS) {
        const update = decoding.readVarUint8Array(decoder)
        const ids = applyAwarenessEntries(this.awareness, decodeAwarenessUpdate(update))
        const known = new Set(attachment.clientIds)
        if (ids.some((id) => !known.has(id))) {
          ws.serializeAttachment({ ...attachment, clientIds: [...new Set([...attachment.clientIds, ...ids])] })
        }
        const relay = new Uint8Array(message)
        for (const other of this.ctx.getWebSockets()) {
          if (other !== ws) send(other, relay)
        }
      }
    } catch (error) {
      console.warn('Message illisible ignoré', error)
    }
  }

  async webSocketClose(ws: WebSocket, code: number, reason: string): Promise<void> {
    this.forget(ws)
    try {
      ws.close(code === 1005 || code === 1006 ? 1000 : code, reason)
    } catch {
      // déjà fermée
    }
  }

  async webSocketError(ws: WebSocket): Promise<void> {
    this.forget(ws)
  }

  /** Annonce aux autres le départ des participants de cette connexion. */
  private forget(ws: WebSocket): void {
    const attachment = ws.deserializeAttachment() as Attachment | null
    if (!attachment || attachment.clientIds.length === 0) return
    const removal = removalEntries(this.awareness, attachment.clientIds)
    applyAwarenessEntries(this.awareness, removal)
    const message = encodeAwarenessMessage(removal)
    for (const other of this.ctx.getWebSockets()) {
      if (other !== ws) send(other, message)
    }
  }
}

function send(ws: WebSocket, message: Uint8Array): void {
  try {
    ws.send(message)
  } catch {
    // connexion en cours de fermeture : le message est perdu, le client se resynchronisera
  }
}
