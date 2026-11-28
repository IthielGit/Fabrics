/**
 * Contrôle des fichiers importés avant lecture (M24, 24.2, D24-7) : taille d'abord, puis le début (et
 * la fin) du fichier. Seuls quelques octets sont lus : un fichier refusé n'est jamais converti, et rien
 * n'est exécuté. Fonctions pures ; les phrases sont composées par l'interface.
 */

const MB = 1024 * 1024

/** Limites des fichiers importés (D24-7). Les limites déjà en place avant M24 restent dans leur module. */
export const IMPORT_LIMITS = {
  ifc: { maxBytes: 100 * MB, slowBytes: 30 * MB },
  backup: { maxBytes: 100 * MB },
} as const

/** Octets lus au début et à la fin d'un fichier pour le reconnaître. */
export const SNIFF_BYTES = 4096

export type SniffedKind = 'png' | 'jpeg' | 'gif' | 'webp' | 'pdf' | 'zip' | 'gzip' | 'xml' | 'unknown'

const startsWith = (bytes: Uint8Array, signature: readonly number[], at = 0) =>
  bytes.length >= at + signature.length && signature.every((b, i) => bytes[at + i] === b)

/** Type réel d'un fichier d'après ses premiers octets (pour dire « c'est une image PNG renommée »). */
export function sniffKind(head: Uint8Array): SniffedKind {
  if (startsWith(head, [0x89, 0x50, 0x4e, 0x47])) return 'png'
  if (startsWith(head, [0xff, 0xd8, 0xff])) return 'jpeg'
  if (startsWith(head, [0x47, 0x49, 0x46, 0x38])) return 'gif'
  if (startsWith(head, [0x52, 0x49, 0x46, 0x46]) && startsWith(head, [0x57, 0x45, 0x42, 0x50], 8)) return 'webp'
  if (startsWith(head, [0x25, 0x50, 0x44, 0x46])) return 'pdf'
  if (startsWith(head, [0x50, 0x4b, 0x03, 0x04])) return 'zip'
  if (startsWith(head, [0x1f, 0x8b])) return 'gzip'
  if (/^\s*<\?xml/.test(asciiText(head.subarray(0, 64)))) return 'xml'
  return 'unknown'
}

function asciiText(bytes: Uint8Array): string {
  let text = ''
  for (const byte of bytes) text += byte < 0x80 ? String.fromCharCode(byte) : ' '
  return text
}

/** Début d'un fichier IFC lisible (texte STEP, ISO 10303-21), BOM et espaces tolérés. */
const STEP_HEADER = /^﻿?\s*ISO-10303-21\s*;/
const STEP_END = /END-ISO-10303-21\s*;\s*$/

export type IfcGuardResult =
  | { ok: true; slow: boolean }
  | { ok: false; reason: 'empty' }
  | { ok: false; reason: 'tooLarge'; sizeBytes: number; maxBytes: number }
  | { ok: false; reason: 'otherFormat'; kind: Exclude<SniffedKind, 'unknown'> }
  | { ok: false; reason: 'notIfc' }
  | { ok: false; reason: 'truncated' }

/**
 * Décide si un fichier IFC peut être converti, d'après sa taille, ses premiers et ses derniers octets.
 * `slow` : au-delà de 30 Mo, prévenir que l'import peut prendre plusieurs minutes.
 */
export function guardIfcFile(file: { sizeBytes: number; head: Uint8Array; tail: Uint8Array }): IfcGuardResult {
  const { sizeBytes, head, tail } = file
  if (sizeBytes === 0) return { ok: false, reason: 'empty' }
  if (sizeBytes > IMPORT_LIMITS.ifc.maxBytes) {
    return { ok: false, reason: 'tooLarge', sizeBytes, maxBytes: IMPORT_LIMITS.ifc.maxBytes }
  }
  const kind = sniffKind(head)
  if (kind !== 'unknown') return { ok: false, reason: 'otherFormat', kind }
  if (!STEP_HEADER.test(asciiText(head))) return { ok: false, reason: 'notIfc' }
  if (!STEP_END.test(asciiText(tail))) return { ok: false, reason: 'truncated' }
  return { ok: true, slow: sizeBytes > IMPORT_LIMITS.ifc.slowBytes }
}

/** Lit seulement le début et la fin d'un fichier du navigateur (rien d'autre n'est chargé). */
export async function readFileEnds(file: Blob): Promise<{ sizeBytes: number; head: Uint8Array; tail: Uint8Array }> {
  const head = new Uint8Array(await file.slice(0, SNIFF_BYTES).arrayBuffer())
  const tail = new Uint8Array(await file.slice(Math.max(0, file.size - SNIFF_BYTES)).arrayBuffer())
  return { sizeBytes: file.size, head, tail }
}

/** Taille lisible en Mo, arrondie à l'unité (ex. « 180 Mo »). */
export function megabytes(bytes: number): string {
  return `${Math.round(bytes / MB)} Mo`
}
