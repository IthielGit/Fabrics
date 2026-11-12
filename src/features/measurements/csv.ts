import type { OpeningStyle, RoofShape } from '../../types/document'
import type { RoofProblem } from '../building/roof'
import { sanitizeFileName } from '../export/fileName'
import { formatDecimal, mm2ToM2, mm3ToM3 } from '../units/format'
import type { BuildingMeasurements } from './measurements'
import { buildMetresTables, cellText, mm, wallRefs, type CeilingLabels, type MetresTable } from './tables'

/** Intitulés du fichier (français, fournis par `src/i18n/fr.ts`). */
export interface CsvLabels {
  level: string
  /** Libellé de la ligne qui totalise tous les niveaux. */
  building: string
  /** Libellé des lignes de total d'un tableau. */
  total: string
  /** Colonne « Réf. » d'un mur (M01…), d'une porte (P01…) ou d'une fenêtre (F01…) et « Réf. du mur » d'une ouverture. */
  ref: string
  wallRef: string
  elevation: string
  levelHeight: string
  levelTotals: string
  roomsTotal: string
  wallsTotal: string
  rooms: string
  walls: string
  name: string
  area: string
  /** Surface d'une pièce au tracé (avant déduction des trémies). */
  roomTraceArea: string
  /** Tableau « Plafonds ». */
  ceilings: CeilingLabels
  perimeter: string
  /** Colonnes « Trémie » et « Surface nette » du tableau des pièces. */
  voidArea: string
  roomNetArea: string
  length: string
  thickness: string
  height: string
  /** Surface murale brute d'une face, sur l'axe. */
  wallArea: string
  openingsArea: string
  wallNetArea: string
  /** Murs sur les deux faces : longueur des faces, surfaces brute et nette, volume. */
  facesLength: string
  facesArea: string
  facesNetArea: string
  wallVolume: string
  /** Explication des colonnes du tableau des murs. */
  wallsNote: string
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
  /** Colonne « Style » du tableau des ouvertures et nom de chaque style. */
  style: string
  styles: Record<OpeningStyle, string>
  /** Intitulés du tableau des escaliers (absent : pas de tableau). */
  stairs?: {
    title: string
    shape: string
    shapes: Record<'straight' | 'l' | 'u', string>
    width: string
    risers: string
    riserHeight: string
    treads: string
    treadDepth: string
    remark: string
    tooShort: (requiredRun: number) => string
    noLevelAbove: string
  }
  /** Intitulés du tableau des plateformes (absent : pas de tableau). */
  platforms?: {
    title: string
    elevation: string
    thickness: string
    volume: string
    totalArea: string
    totalVolume: string
  }
  /** Intitulés du tableau des toitures (absent : pas de tableau). */
  roofs?: {
    title: string
    note: string
    shape: string
    shapes: Record<RoofShape, string>
    pitch: string
    overhang: string
    projectedArea: string
    realArea: string
    ridge: string
    eaves: string
    hips: string
    gables: string
    remark: string
    problems: Record<RoofProblem, string>
  }
  /** Intitulés du tableau des cheminées (absent : pas de tableau). */
  chimneys?: {
    title: string
    depth: string
    overhang: string
  }
  /** En-tête du fichier : projet, date, unités (absent : pas d'en-tête). */
  meta?: {
    title: string
    project: string
    date: string
    app: string
    appName: string
    units: string
    unitsValue: string
    note: string
    noteValue: string
  }
  /** Intitulés du fichier « données à plat » (absent : pas de second format). */
  flat?: FlatLabels
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

/** Intitulés du fichier « données à plat » (une ligne par grandeur, pour les tableaux croisés). */
export interface FlatLabels {
  columns: Record<'level' | 'category' | 'element' | 'ref' | 'quantity' | 'value' | 'unit', string>
  categories: Record<
    'room' | 'wall' | 'opening' | 'stair' | 'platform' | 'chimney' | 'roof' | 'furniture',
    string
  >
  quantities: Record<
    | 'traceArea'
    | 'ceilingHeight'
    | 'falseCeilingArea'
    | 'perimeter'
    | 'voidArea'
    | 'netArea'
    | 'axisLength'
    | 'thickness'
    | 'height'
    | 'axisArea'
    | 'openingsArea'
    | 'axisNetArea'
    | 'facesLength'
    | 'facesArea'
    | 'facesNetArea'
    | 'volume'
    | 'width'
    | 'depth'
    | 'sillHeight'
    | 'area'
    | 'risers'
    | 'riserHeight'
    | 'treads'
    | 'treadDepth'
    | 'elevation'
    | 'overhang'
    | 'count'
    | 'pitch'
    | 'roofOverhang'
    | 'projectedArea'
    | 'realArea'
    | 'ridgeLength'
    | 'eaveLength'
    | 'hipLength'
    | 'gables',
    string
  >
  units: Record<'mm' | 'm2' | 'm3' | 'count' | 'deg', string>
}

/** Projet et date inscrits en tête du fichier. */
export interface CsvMeta {
  projectName: string
  /** Date déjà mise en forme (« 11/11/2026 »). */
  date: string
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
 * Protège un champ texte : guillemets si nécessaire, et une espace devant un texte qui commence par
 * `= + - @` pour qu'un tableur ne le lise pas comme une formule. Une espace passe presque inaperçue,
 * alors qu'une apostrophe s'afficherait telle quelle dans la cellule (`'-Salon`).
 */
export function escapeCsvField(value: string): string {
  const safe = /^[=+\-@\t\r]/.test(value) ? ` ${value}` : value
  return /[;"\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe
}

function row(...fields: string[]): string {
  return fields.join(SEPARATOR)
}

/**
 * Métrés au format CSV « lisible » : séparateur `;`, décimales à virgule, UTF-8 avec BOM, fins de
 * ligne CRLF. Un en-tête (projet, date, unités), puis un bloc par tableau (pièces, murs, ouvertures,
 * escaliers, plateformes, cheminées, mobilier, totaux par niveau), chacun avec sa ligne de total.
 * Les totaux sont calculés sur les valeurs exactes, avant arrondi.
 */
export function measurementsToCsv(
  building: BuildingMeasurements,
  labels: CsvLabels,
  furniture: readonly FurnitureCsvRow[] = [],
  meta?: CsvMeta,
  /** Tableaux déjà construits (version Client ou Exécution) ; absent : les tableaux d'Exécution. */
  tables?: readonly MetresTable[],
): string {
  const text = escapeCsvField
  const lines: string[] = []

  if (meta && labels.meta) {
    const m = labels.meta
    lines.push(
      row(text(m.title)),
      row(text(m.project), text(meta.projectName)),
      row(text(m.date), text(meta.date)),
      row(text(m.app), text(m.appName)),
      row(text(m.units), text(m.unitsValue)),
      row(text(m.note), text(m.noteValue)),
    )
  }

  for (const table of tables ?? buildMetresTables(building, labels, furniture)) {
    if (lines.length > 0) lines.push('')
    lines.push(row(text(table.title)))
    if (table.note) lines.push(row(text(table.note)))
    lines.push(
      row(...table.columns.map((column) => text(column.header))),
      ...table.rows.map((cells) => row(...cells.map((cell) => text(cellText(cell))))),
    )
    if (table.total) lines.push(row(...table.total.map((cell) => text(cellText(cell)))))
  }

  return CSV_BOM + lines.join(LINE_BREAK) + LINE_BREAK
}

/** Une valeur numérique du fichier à plat : virgule décimale, sans séparateur de milliers. */
const num = (value: number, decimals: number) => formatDecimal(value, decimals)

/**
 * Métrés au format CSV « données à plat » : une ligne par grandeur (Niveau ; Catégorie ; Élément ;
 * Réf. ; Grandeur ; Valeur ; Unité), avec de vrais nombres dans la colonne Valeur. Fait pour les
 * tableaux croisés, les filtres et les sommes d'Excel. Longueurs en mm entiers, surfaces et
 * volumes avec 4 décimales (au cm² près). Pas de ligne de total : le tableur les calcule.
 */
export function measurementsToFlatCsv(
  building: BuildingMeasurements,
  labels: CsvLabels,
  furniture: readonly FurnitureCsvRow[] = [],
): string {
  const flat = labels.flat
  if (!flat) throw new Error('Intitulés du fichier à plat manquants')
  const text = escapeCsvField
  const refs = wallRefs(building)
  const q = flat.quantities
  const unit = flat.units
  const lines: string[] = [
    row(
      ...[
        flat.columns.level,
        flat.columns.category,
        flat.columns.element,
        flat.columns.ref,
        flat.columns.quantity,
        flat.columns.value,
        flat.columns.unit,
      ].map(text),
    ),
  ]
  type Entry = [quantity: string, value: number | null, unit: string, decimals: number]
  const add = (level: string, category: string, element: string, ref: string, entries: Entry[]) => {
    for (const [quantity, value, entryUnit, decimals] of entries) {
      if (value === null) continue
      lines.push(
        row(text(level), text(category), text(element), text(ref), text(quantity), num(value, decimals), text(entryUnit)),
      )
    }
  }
  const area = (mm2: number) => mm2ToM2(mm2)
  const volume = (mm3: number) => mm3ToM3(mm3)

  for (const { level, measurements: m } of building.levels) {
    for (const room of m.rooms) {
      add(level.name, flat.categories.room, room.name, '', [
        [q.traceArea, area(room.area), unit.m2, 4],
        [q.perimeter, room.perimeter, unit.mm, 0],
        [q.voidArea, area(room.voidArea), unit.m2, 4],
        [q.netArea, area(room.netArea), unit.m2, 4],
        [q.ceilingHeight, room.ceilingHeight, unit.mm, 0],
        [q.falseCeilingArea, room.falseCeiling ? area(room.netArea) : null, unit.m2, 4],
      ])
    }
    for (const wall of m.walls) {
      add(level.name, flat.categories.wall, wall.name, refs.get(wall.id) ?? '', [
        [q.axisLength, wall.length, unit.mm, 0],
        [q.thickness, wall.thickness, unit.mm, 0],
        [q.height, wall.height, unit.mm, 0],
        [q.axisArea, area(wall.wallArea), unit.m2, 4],
        [q.openingsArea, area(wall.openingsArea), unit.m2, 4],
        [q.axisNetArea, area(wall.netArea), unit.m2, 4],
        [q.facesLength, wall.facesLength, unit.mm, 0],
        [q.facesArea, area(wall.facesArea), unit.m2, 4],
        [q.facesNetArea, area(wall.facesNetArea), unit.m2, 4],
        [q.volume, volume(wall.volume), unit.m3, 4],
      ])
    }
    for (const opening of m.openings) {
      add(level.name, flat.categories.opening, opening.name, building.refs.openings.get(opening.id) ?? '', [
        [q.width, opening.width, unit.mm, 0],
        [q.height, opening.height, unit.mm, 0],
        [q.sillHeight, opening.sillHeight, unit.mm, 0],
        [q.area, area(opening.area), unit.m2, 4],
      ])
    }
    for (const stair of m.stairs) {
      add(level.name, flat.categories.stair, stair.name, '', [
        [q.width, stair.width, unit.mm, 0],
        [q.risers, stair.risers, unit.count, 0],
        [q.riserHeight, stair.riserHeight, unit.mm, 0],
        [q.treads, stair.treads, unit.count, 0],
        [q.treadDepth, stair.treadDepth, unit.mm, 0],
      ])
    }
    for (const platform of m.platforms) {
      add(level.name, flat.categories.platform, platform.name, '', [
        [q.area, area(platform.area), unit.m2, 4],
        [q.elevation, platform.elevation, unit.mm, 0],
        [q.thickness, platform.thickness, unit.mm, 0],
        [q.volume, volume(platform.volume), unit.m3, 4],
      ])
    }
    for (const roof of m.roofs) {
      add(level.name, flat.categories.roof, roof.name, '', [
        [q.pitch, roof.pitch, unit.deg, 1], // toit plat : pas de pente (ligne omise)
        [q.roofOverhang, roof.overhang, unit.mm, 0],
        [q.projectedArea, area(roof.projectedArea), unit.m2, 4],
        [q.realArea, area(roof.realArea), unit.m2, 4],
        [q.ridgeLength, Math.round(roof.ridgeLength), unit.mm, 0],
        [q.eaveLength, Math.round(roof.eaveLength), unit.mm, 0],
        [q.hipLength, Math.round(roof.hipLength), unit.mm, 0],
        [q.gables, roof.gableCount, unit.count, 0],
      ])
    }
    for (const chimney of m.chimneys) {
      add(level.name, flat.categories.chimney, chimney.name, '', [
        [q.width, chimney.width, unit.mm, 0],
        [q.depth, chimney.depth, unit.mm, 0],
        [q.area, area(chimney.area), unit.m2, 4],
        [q.overhang, chimney.heightAboveTop, unit.mm, 0],
      ])
    }
  }
  // Le mobilier n'est pas rattaché à un niveau dans la liste : colonne Niveau vide ; la taille
  // (largeur × profondeur) est dans la colonne Réf.
  for (const item of furniture) {
    add('', flat.categories.furniture, item.name, `${mm(item.width)} × ${mm(item.depth)} ${unit.mm}`, [
      [q.count, item.count, unit.count, 0],
    ])
  }
  return CSV_BOM + lines.join(LINE_BREAK) + LINE_BREAK
}
