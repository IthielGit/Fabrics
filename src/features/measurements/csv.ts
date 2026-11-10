import { sanitizeFileName } from '../export/fileName'
import { formatDecimal, mm2ToM2 } from '../units/format'
import type { Measurements } from './measurements'

/** Intitulés du fichier (français, fournis par `src/i18n/fr.ts`). */
export interface CsvLabels {
  rooms: string
  walls: string
  name: string
  area: string
  perimeter: string
  length: string
  thickness: string
  height: string
  wallArea: string
  total: string
}

/**
 * Nom du fichier CSV : `<nom du projet>-<suffixe>.csv`, sans caractères interdits par Windows
 * (`\ / : * ? " < > |`) ni points ou espaces en fin de nom.
 */
export function csvFileName(projectName: string, suffix: string, fallback: string): string {
  return `${sanitizeFileName(projectName, fallback)}-${suffix}.csv`
}

const SEPARATOR = ';'
const LINE_BREAK = '\r\n'
/** Excel et LibreOffice lisent l'UTF-8 (accents) grâce à ce caractère invisible en début de fichier. */
export const CSV_BOM = '﻿'

/**
 * Protège un champ texte : guillemets si nécessaire, et apostrophe devant `= + - @` pour qu'un
 * tableur n'exécute pas un nom de calque comme une formule.
 */
export function escapeCsvField(value: string): string {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value
  return /[;"\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe
}

function row(...fields: string[]): string {
  return fields.join(SEPARATOR)
}

/** Longueurs en mm entiers (Métrique architectural), surfaces en m². */
const mm = (value: number) => formatDecimal(value, 0)
const m2 = (mm2: number) => formatDecimal(mm2ToM2(mm2))

/**
 * Métrés au format CSV : séparateur `;`, décimales à virgule, UTF-8 avec BOM, fins de ligne CRLF.
 * Deux tableaux (pièces, murs) avec leurs totaux.
 */
export function measurementsToCsv(measurements: Measurements, labels: CsvLabels): string {
  const { rooms, walls, totals } = measurements
  const lines: string[] = [
    row(escapeCsvField(labels.rooms)),
    row(
      escapeCsvField(labels.name),
      escapeCsvField(labels.area),
      escapeCsvField(labels.perimeter),
    ),
    ...rooms.map((room) =>
      row(escapeCsvField(room.name), m2(room.area), mm(room.perimeter)),
    ),
    row(escapeCsvField(labels.total), m2(totals.roomArea), ''),
    '',
    row(escapeCsvField(labels.walls)),
    row(
      escapeCsvField(labels.name),
      escapeCsvField(labels.length),
      escapeCsvField(labels.thickness),
      escapeCsvField(labels.height),
      escapeCsvField(labels.wallArea),
    ),
    ...walls.map((wall) =>
      row(
        escapeCsvField(wall.name),
        mm(wall.length),
        mm(wall.thickness),
        mm(wall.height),
        m2(wall.wallArea),
      ),
    ),
    row(escapeCsvField(labels.total), mm(totals.wallLength), '', '', m2(totals.wallArea)),
  ]
  return CSV_BOM + lines.join(LINE_BREAK) + LINE_BREAK
}
