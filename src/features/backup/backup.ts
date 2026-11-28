/**
 * Sauvegarde d'un projet dans un seul fichier `.fabrics` (M24, 24.3, D24-3) : une archive ZIP qui
 * contient le projet (scène pour un plan), ses images, son devis et ses versions figées, une version de
 * format et l'empreinte SHA-256 de chaque fichier. Lue seulement par Fabrics, contrôlée avant toute
 * création de projet (D24-7). Restaurer ne remplace jamais rien : c'est toujours une copie.
 */
import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate'
import type { Project } from '../../types/document'
import { migrateProject, toStoredProject, type StoredProject } from '../documents/migrations'
import { IMPORT_LIMITS, sniffKind } from '../imports/fileGuard'
import { duplicateIds } from '../measurements/controls'
import type { EstimateVersion, FrozenEstimate, ProjectEstimateRecord } from '../pricing/estimateVersions'

export const BACKUP_FORMAT = 'fabrics-backup'
export const BACKUP_VERSION = 1
export const BACKUP_EXTENSION = '.fabrics'

/** Devis du projet tel que sauvegardé. Sans `withPrices`, aucun prix ni montant (D24-3, D23-8). */
export interface BackupEstimate {
  libraryId: string
  workspaceName: string
  withPrices: boolean
  record: ProjectEstimateRecord | null
  versions: EstimateVersion[]
}

export interface BackupContent {
  project: Project
  estimate: BackupEstimate | null
  /** Images du projet, par identifiant. */
  assets: Record<string, Uint8Array>
}

interface Manifest {
  format: typeof BACKUP_FORMAT
  version: number
  createdAt: string
  projectName: string
  projectKind: Project['kind']
  /** Empreinte SHA-256 de chaque fichier de l'archive (sauf ce manifeste). */
  files: Record<string, string>
}

export type BackupReadResult =
  | { ok: true; project: Project; estimate: BackupEstimate | null; assets: Record<string, Uint8Array>; createdAt: string }
  | { ok: false; reason: 'tooLarge' | 'notBackup' | 'newerVersion' | 'damaged' | 'duplicateIds' }

const PROJECT_FILE = 'project.json'
const ESTIMATE_FILE = 'estimate.json'
const ASSET_DIR = 'assets/'
/** Contenu déplié maximal : bien au-delà d'un vrai projet, en deçà d'une bombe de décompression. */
const MAX_UNZIPPED_BYTES = 400 * 1024 * 1024

async function sha256(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', bytes as Uint8Array<ArrayBuffer>)
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

const EMPTY = ''

/** Ligne et totaux d'une version figée, sans aucun prix ni montant (quantités et postes gardés). */
function withoutPrices(snapshot: FrozenEstimate): FrozenEstimate {
  return {
    ...snapshot,
    lines: snapshot.lines.map((line) => ({ ...line, unitPriceHt: null, salePriceHt: null, amountHt: null })),
    totalHt: EMPTY,
    vat: EMPTY,
    totalTtc: EMPTY,
    debours: EMPTY,
  }
}

/** Devis prêt à sauvegarder : les prix ne restent que pour un admin de l'espace. */
export function backupEstimate(input: Omit<BackupEstimate, 'versions'> & { versions: EstimateVersion[] }): BackupEstimate {
  if (input.withPrices) return input
  return { ...input, versions: input.versions.map((v) => ({ ...v, snapshot: withoutPrices(v.snapshot) })) }
}

export async function buildBackup(content: BackupContent, now: Date = new Date()): Promise<Uint8Array> {
  const files: Record<string, Uint8Array> = { [PROJECT_FILE]: strToU8(JSON.stringify(toStoredProject(content.project))) }
  if (content.estimate) files[ESTIMATE_FILE] = strToU8(JSON.stringify(content.estimate))
  for (const [id, bytes] of Object.entries(content.assets)) files[`${ASSET_DIR}${id}`] = bytes
  const hashes: Record<string, string> = {}
  for (const [name, bytes] of Object.entries(files)) hashes[name] = await sha256(bytes)
  const manifest: Manifest = {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    createdAt: now.toISOString(),
    projectName: content.project.name,
    projectKind: content.project.kind,
    files: hashes,
  }
  return zipSync({ 'manifest.json': strToU8(JSON.stringify(manifest)), ...files }, { level: 6 })
}

function parseJson<T>(bytes: Uint8Array | undefined): T | null {
  if (!bytes) return null
  try {
    return JSON.parse(strFromU8(bytes)) as T
  } catch {
    return null
  }
}

/** Lit et contrôle une sauvegarde ; rien n'est créé ici. */
export async function readBackup(bytes: Uint8Array): Promise<BackupReadResult> {
  if (bytes.byteLength > IMPORT_LIMITS.backup.maxBytes) return { ok: false, reason: 'tooLarge' }
  if (sniffKind(bytes.subarray(0, 16)) !== 'zip') return { ok: false, reason: 'notBackup' }
  let files: Record<string, Uint8Array>
  let total = 0
  try {
    files = unzipSync(bytes, {
      filter: (file) => {
        total += file.originalSize
        if (total > MAX_UNZIPPED_BYTES) throw new Error('too large')
        return file.name === 'manifest.json' || file.name === PROJECT_FILE || file.name === ESTIMATE_FILE || file.name.startsWith(ASSET_DIR)
      },
    })
  } catch {
    return { ok: false, reason: total > MAX_UNZIPPED_BYTES ? 'tooLarge' : 'damaged' }
  }
  const manifest = parseJson<Manifest>(files['manifest.json'])
  if (!manifest || manifest.format !== BACKUP_FORMAT) return { ok: false, reason: 'notBackup' }
  if (typeof manifest.version !== 'number' || manifest.version > BACKUP_VERSION) return { ok: false, reason: 'newerVersion' }
  // Chaque fichier annoncé est présent, intact, et rien d'autre n'est lu.
  const names = Object.keys(files).filter((name) => name !== 'manifest.json')
  if (names.length !== Object.keys(manifest.files ?? {}).length) return { ok: false, reason: 'damaged' }
  for (const name of names) {
    if (manifest.files[name] !== (await sha256(files[name]))) return { ok: false, reason: 'damaged' }
  }
  const stored = parseJson<StoredProject>(files[PROJECT_FILE])
  if (!stored || (stored.kind !== 'plan' && stored.kind !== 'design') || !stored.document) return { ok: false, reason: 'damaged' }
  let project: Project
  try {
    project = migrateProject(stored)
  } catch {
    return { ok: false, reason: 'damaged' }
  }
  if (duplicateIds([...project.document.elements, ...(project.document.levels ?? [])]).length > 0) {
    return { ok: false, reason: 'duplicateIds' }
  }
  const assets: Record<string, Uint8Array> = {}
  for (const name of names) if (name.startsWith(ASSET_DIR)) assets[name.slice(ASSET_DIR.length)] = files[name]
  return { ok: true, project, estimate: parseJson<BackupEstimate>(files[ESTIMATE_FILE]), assets, createdAt: manifest.createdAt }
}

/** JJ/MM/AAAA. */
function frenchDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`
}

/** Copie restaurée : nouvel identifiant, nom « … (restauré le JJ/MM/AAAA) » ; l'original n'est jamais touché. */
export function restoredProject(project: Project, now: Date = new Date()): Project {
  const iso = now.toISOString()
  return { ...project, id: crypto.randomUUID(), name: `${project.name} (restauré le ${frenchDate(now)})`, createdAt: iso, updatedAt: iso }
}

/** Nom du fichier de sauvegarde : « Maison - sauvegarde 2026-11-28.fabrics ». */
export function backupFileName(projectName: string, now: Date = new Date()): string {
  const safe = projectName.replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim() || 'projet'
  return `${safe} - sauvegarde ${now.toISOString().slice(0, 10)}${BACKUP_EXTENSION}`
}
