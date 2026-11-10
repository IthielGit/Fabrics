import { sanitizeFileName } from '../export/fileName'
import { formatDecimal, mm2ToM2 } from '../units/format'
import type { BuildingMeasurements, Measurements } from './measurements'

/** Intitulés du fichier (français, fournis par `src/i18n/fr.ts`). */
export interface CsvLabels {
  level: string
  /** Libellé de la ligne qui totalise tous les niveaux. */
  building: string
  elevation: string
  levelHeight: string
  levelTotals: string
  roomsTotal: string
  wallsTotal: string
  rooms: string
  walls: string
  name: string
  area: string
  perimeter: string
  length: string
  thickness: string
  height: string
  /** Surface murale brute. */
  wallArea: string
  openingsArea: string
  wallNetArea: string
  openings: string
  kind: string
  wall: string
  width: string
  sillHeight: string
  doors: string
  windows: string
  bays: string
  /** Nom de chaque type d'ouverture. */
  kinds: Record<'door' | 'window' | 'bay', string>
  /** Intitulés du tableau du mobilier (absent : pas de tableau). */
  furniture?: {
    title: string
    nominalTitle: string
    zoneTitle: string
    category: string
    depth: string
    count: string
  }
}

/** Une ligne du tableau du mobilier : un objet de la bibliothèque, regroupé par taille. */
export interface FurnitureCsvRow {
  category: string
  name: string
  /** Largeur et profondeur, en mm. */
  width: number
  depth: number
  count: number
  /** `furniture` : mobilier ; `nominal` : symbole conventionnel ; `zone` : surface de référence. */
  kind: 'furniture' | 'nominal' | 'zone'
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
 * Les tableaux des pièces, des murs (surfaces brute et nette) et des ouvertures ont une colonne
 * « Niveau » ; un dernier tableau donne les totaux de chaque niveau et ceux du bâtiment.
 */
export function measurementsToCsv(
  building: BuildingMeasurements,
  labels: CsvLabels,
  furniture: readonly FurnitureCsvRow[] = [],
): string {
  const { levels, total } = building
  const text = escapeCsvField
  const lines: string[] = []

  /** Une ligne par élément, précédée du nom de son niveau. */
  const perLevel = <T>(
    pick: (m: Measurements) => T[],
    format: (item: T) => string[],
  ): string[] =>
    levels.flatMap(({ level, measurements }) =>
      pick(measurements).map((item) => row(text(level.name), ...format(item))),
    )

  lines.push(
    row(text(labels.rooms)),
    row(text(labels.level), text(labels.name), text(labels.area), text(labels.perimeter)),
    ...perLevel(
      (m) => m.rooms,
      (room) => [text(room.name), m2(room.area), mm(room.perimeter)],
    ),
    '',
    row(text(labels.walls)),
    row(
      text(labels.level),
      text(labels.name),
      text(labels.length),
      text(labels.thickness),
      text(labels.height),
      text(labels.wallArea),
      text(labels.openingsArea),
      text(labels.wallNetArea),
    ),
    ...perLevel(
      (m) => m.walls,
      (wall) => [
        text(wall.name),
        mm(wall.length),
        mm(wall.thickness),
        mm(wall.height),
        m2(wall.wallArea),
        m2(wall.openingsArea),
        m2(wall.netArea),
      ],
    ),
  )

  if (total.openings.length > 0) {
    lines.push(
      '',
      row(text(labels.openings)),
      row(
        text(labels.level),
        text(labels.name),
        text(labels.kind),
        text(labels.wall),
        text(labels.width),
        text(labels.height),
        text(labels.sillHeight),
        text(labels.area),
      ),
      ...perLevel(
        (m) => m.openings,
        (opening) => [
          text(opening.name),
          text(labels.kinds[opening.kind]),
          text(opening.wallName),
          mm(opening.width),
          mm(opening.height),
          mm(opening.sillHeight),
          m2(opening.area),
        ],
      ),
    )
  }

  // Mobilier : liste (catégorie, nom, taille, nombre), jamais ajoutée aux surfaces ni aux longueurs.
  // Les symboles conventionnels et les zones de référence sont comptés à part.
  const furnitureLabels = labels.furniture
  if (furnitureLabels) {
    const tables: [FurnitureCsvRow['kind'], string][] = [
      ['furniture', furnitureLabels.title],
      ['nominal', furnitureLabels.nominalTitle],
      ['zone', furnitureLabels.zoneTitle],
    ]
    for (const [kind, title] of tables) {
      const rows = furniture.filter((item) => item.kind === kind)
      if (rows.length === 0) continue
      lines.push(
        '',
        row(text(title)),
        row(text(furnitureLabels.category), text(labels.name), text(labels.width), text(furnitureLabels.depth), text(furnitureLabels.count)),
        ...rows.map((item) =>
          row(text(item.category), text(item.name), mm(item.width), mm(item.depth), String(item.count)),
        ),
      )
    }
  }

  // Totaux : une ligne par niveau, puis le bâtiment (= la somme des niveaux).
  const totalsRow = (title: string, altitude: string, floorHeight: string, m: Measurements) =>
    row(
      text(title),
      altitude,
      floorHeight,
      m2(m.totals.roomArea),
      mm(m.totals.wallLength),
      m2(m.totals.wallArea),
      m2(m.totals.openingsArea),
      m2(m.totals.wallNetArea),
      String(m.totals.doors),
      String(m.totals.windows),
      String(m.totals.bays),
    )
  lines.push(
    '',
    row(text(labels.levelTotals)),
    row(
      text(labels.level),
      text(labels.elevation),
      text(labels.levelHeight),
      text(labels.roomsTotal),
      text(labels.wallsTotal),
      text(labels.wallArea),
      text(labels.openingsArea),
      text(labels.wallNetArea),
      text(labels.doors),
      text(labels.windows),
      text(labels.bays),
    ),
    ...levels.map(({ level, measurements }) =>
      totalsRow(level.name, mm(level.elevation), mm(level.height), measurements),
    ),
    totalsRow(labels.building, '', '', total),
  )

  return CSV_BOM + lines.join(LINE_BREAK) + LINE_BREAK
}
