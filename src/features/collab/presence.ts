// Présence des autres participants (M14, lot E). Fonctions pures, testées sans réseau.
// Tout ce qui vient du réseau est traité comme non fiable : `parsePresence` nettoie et borne.

export interface PresenceUser {
  /** Identifiant du compte : sert à ne compter qu'une fois une personne ouverte dans deux onglets. */
  id: string
  name: string
  /** Couleur du curseur et de la sélection (`#rrggbb`). */
  color: string
  /** Photo du compte (adresse https), si le compte en a une. */
  avatarUrl?: string
}

export interface PresenceCursor {
  x: number
  y: number
}

/** Ce que chaque participant publie sur lui-même. */
export interface PresenceState {
  user: PresenceUser
  /** Position du curseur dans le document ; `null` quand la souris est hors du canevas. */
  cursor: PresenceCursor | null
  /** Niveau affiché par la personne (plans) : curseur et sélection ne se montrent que sur le même niveau. */
  levelId: string | null
  selection: string[]
}

export interface Peer extends PresenceState {
  /** Identifiant de connexion Yjs (une personne peut en avoir plusieurs). */
  clientId: number
}

const MAX_NAME = 60
const MAX_ID = 100
export const MAX_SELECTION = 200
const MAX_COORD = 1e9
const COLOR_RE = /^#[0-9a-f]{6}$/i

/** Couleurs assez foncées pour que le texte blanc du nom reste lisible. */
const PALETTE = [
  '#4f46e5',
  '#db2777',
  '#0d9488',
  '#d97706',
  '#7c3aed',
  '#dc2626',
  '#0369a1',
  '#65a30d',
  '#c026d3',
  '#b45309',
]

function hash(text: string): number {
  let h = 5381
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) >>> 0
  return h
}

/** Couleur stable pour un compte : la même sur tous les écrans. */
export function colorForUser(userId: string): string {
  return PALETTE[hash(userId) % PALETTE.length]
}

/** Une adresse d'image n'est acceptée qu'en https (jamais `javascript:`, `data:` ni http). */
export function safeAvatarUrl(value: unknown): string | undefined {
  if (typeof value !== 'string' || value.length > 2048) return undefined
  try {
    const url = new URL(value)
    return url.protocol === 'https:' ? url.toString() : undefined
  } catch {
    return undefined
  }
}

function firstText(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return ''
}

/** Sous-ensemble du compte Supabase dont on a besoin (pas de dépendance au type complet). */
export interface AccountInfo {
  id: string
  email?: string | null
  user_metadata?: Record<string, unknown> | null
}

/**
 * Nom et photo à montrer aux autres : ceux du compte Google (ou autre) s'il y en a, sinon la
 * partie de l'adresse e-mail avant le `@`. L'adresse complète n'est jamais partagée.
 */
export function userFromAccount(account: AccountInfo, fallbackName: string): PresenceUser {
  const meta = account.user_metadata ?? {}
  const fromEmail = account.email?.split('@')[0] ?? ''
  const name = firstText(meta.full_name, meta.name, meta.user_name, fromEmail, fallbackName).slice(0, MAX_NAME)
  return {
    id: account.id,
    name,
    color: colorForUser(account.id),
    avatarUrl: safeAvatarUrl(meta.avatar_url) ?? safeAvatarUrl(meta.picture),
  }
}

/** Une ou deux initiales (« Marie Dupont » → « MD »). */
export function initialsOf(name: string): string {
  const words = name
    .trim()
    .split(/[\s._-]+/)
    .filter(Boolean)
  if (words.length === 0) return '?'
  const letters = words.length === 1 ? [...words[0]].slice(0, 2) : [[...words[0]][0], [...words[1]][0]]
  return letters.join('').toUpperCase()
}

function finite(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && Math.abs(value) <= MAX_COORD
}

/** Nettoie un état de présence reçu ; `null` s'il est inutilisable. */
export function parsePresence(raw: unknown): PresenceState | null {
  if (typeof raw !== 'object' || raw === null) return null
  const record = raw as Record<string, unknown>
  const user = record.user
  if (typeof user !== 'object' || user === null) return null
  const u = user as Record<string, unknown>
  if (typeof u.id !== 'string' || !u.id || u.id.length > MAX_ID) return null
  const name = typeof u.name === 'string' ? u.name.trim().slice(0, MAX_NAME) : ''
  if (!name) return null
  const color = typeof u.color === 'string' && COLOR_RE.test(u.color) ? u.color : colorForUser(u.id)

  const c = record.cursor
  const cursor =
    typeof c === 'object' && c !== null && finite((c as PresenceCursor).x) && finite((c as PresenceCursor).y)
      ? { x: (c as PresenceCursor).x, y: (c as PresenceCursor).y }
      : null

  const selection = Array.isArray(record.selection)
    ? record.selection
        .filter((id): id is string => typeof id === 'string' && id.length > 0 && id.length <= MAX_ID)
        .slice(0, MAX_SELECTION)
    : []
  const levelId =
    typeof record.levelId === 'string' && record.levelId.length <= MAX_ID ? record.levelId : null

  return { user: { id: u.id, name, color, avatarUrl: safeAvatarUrl(u.avatarUrl) }, cursor, levelId, selection }
}

/** Les autres participants (pas moi), triés par identifiant de connexion pour un ordre stable. */
export function listPeers(states: ReadonlyMap<number, unknown>, selfClientId: number): Peer[] {
  const peers: Peer[] = []
  for (const [clientId, raw] of states) {
    if (clientId === selfClientId) continue
    const state = parsePresence(raw)
    if (state) peers.push({ clientId, ...state })
  }
  return peers.sort((a, b) => a.clientId - b.clientId)
}

/** Une entrée par personne (un compte ouvert dans deux onglets compte une fois), hors moi-même. */
export function uniqueUsers(peers: readonly Peer[], selfUserId: string | null): PresenceUser[] {
  const seen = new Map<string, PresenceUser>()
  for (const peer of peers) {
    if (peer.user.id === selfUserId || seen.has(peer.user.id)) continue
    seen.set(peer.user.id, peer.user)
  }
  return [...seen.values()]
}
