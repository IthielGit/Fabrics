import { sanitizeFileName } from '../export/fileName'
import { formatDecimal, mm2ToM2, mmToCm, mmToM } from '../units/format'
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

const m = (mm: number) => formatDecimal(mmToM(mm))
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
      row(escapeCsvField(room.name), m2(room.area), m(room.perimeter)),
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
        m(wall.length),
        formatDecimal(mmToCm(wall.thickness), 1),
        m(wall.height),
        m2(wall.wallArea),
      ),
    ),
    row(escapeCsvField(labels.total), m(totals.wallLength), '', '', m2(totals.wallArea)),
  ]
  return CSV_BOM + lines.join(LINE_BREAK) + LINE_BREAK
}
