import type { BuildingMeasurements } from './measurements'
import { buildCeilingTable, nm2, nmm, ncount, type CeilingLabels, type MetresCell, type MetresTable } from './tables'

/**
 * Présentation « Client » des métrés (M10 ter) : un document simple, sans épaisseur de mur ni
 * surface de mur. Pour chaque pièce : son nom, ses dimensions, son périmètre, sa hauteur sous
 * plafond et sa **surface au sol** (trémie déduite, D37) ; puis un total par niveau et pour le bâtiment avec le nombre de portes et de
 * fenêtres. Mêmes calculs que la version Exécution : les deux ne peuvent pas se contredire.
 */
export interface ClientLabels {
  roomsTitle: string
  levelsTitle: string
  level: string
  room: string
  /** « Dimensions (mm) ». */
  dimensions: string
  /** « Périmètre (mm) » : tour de la pièce tel qu'elle est dessinée. */
  perimeter: string
  /** « Hauteur sous plafond (mm) ». */
  ceilingHeight: string
  floorArea: string
  /** Tableau « Plafonds ». */
  ceilings: CeilingLabels
  doors: string
  windows: string
  bays: string
  /** Libellé de la ligne qui totalise tous les niveaux. */
  building: string
  /** Libellé de la ligne de total du tableau des pièces. */
  total: string
  /** Total du récapitulatif quand un seul niveau est exporté (« Total du niveau »). */
  levelTotal: string
  /** Titre et remarque du document Client (PDF, en-tête du CSV et du fichier Excel). */
  pdfTitle: string
  pdfNote: string
  /** Dimensions d'une pièce qui n'est pas un rectangle (« forme libre »). */
  freeShape: string
  /** Début du nom d'une pièce sans nom : « Pièce » donne « Pièce 1 », « Pièce 2 »… */
  unnamedRoom: string
}

/** Tout le bâtiment, ou seulement un niveau (le libellé de la ligne de total en dépend). */
export type ClientScope = 'building' | 'level'

/** En-tête de fichier de la version Client : titre du document Client et sa remarque, sans note technique. */
export function clientMetaLabels<T extends { title: string; noteValue: string }>(meta: T, labels: ClientLabels): T {
  return { ...meta, title: labels.pdfTitle, noteValue: labels.pdfNote }
}

/** Dimensions d'une pièce rectangulaire aux côtés horizontaux et verticaux : `4000 × 3000`. */
export function roomDimensionsText(dimensions: readonly [number, number] | null): string {
  if (!dimensions) return ''
  return `${Math.round(dimensions[0])} × ${Math.round(dimensions[1])}`
}

/** Rang d'une pièce sans nom parmi les pièces sans nom de son niveau (« Pièce 1 », « Pièce 2 »…). */
function unnamedRank(building: BuildingMeasurements, roomId: string, fallback: number): number {
  for (const { measurements } of building.levels) {
    const unnamed = measurements.rooms.filter((room) => room.name.trim() === '')
    const index = unnamed.findIndex((room) => room.id === roomId)
    if (index >= 0) return index + 1
  }
  return fallback + 1
}

export function buildClientTables(
  building: BuildingMeasurements,
  labels: ClientLabels,
  scope: ClientScope = 'building',
): MetresTable[] {
  const { levels, total } = building
  const tables: MetresTable[] = []

  const roomRows: MetresCell[][] = levels.flatMap(({ level, measurements }) => {
    // Un nom vide devient « Pièce 1 », « Pièce 2 »… (numérotation par niveau) ; des noms identiques sont gardés.
    let unnamed = 0
    return measurements.rooms.map((room) => [
      level.name,
      room.name.trim() === '' ? `${labels.unnamedRoom} ${++unnamed}` : room.name,
      room.dimensions ? roomDimensionsText(room.dimensions) : labels.freeShape,
      nmm(room.perimeter),
      room.ceilingHeight === null ? '' : nmm(room.ceilingHeight),
      nm2(room.netArea),
    ])
  })
  if (roomRows.length > 0) {
    tables.push({
      id: 'client-rooms',
      title: labels.roomsTitle,
      columns: [
        { header: labels.level, align: 'left' },
        { header: labels.room, align: 'left' },
        { header: labels.dimensions, align: 'right' },
        { header: labels.perimeter, align: 'right' },
        { header: labels.ceilingHeight, align: 'right' },
        { header: labels.floorArea, align: 'right' },
      ],
      rows: roomRows,
      total: [labels.total, '', '', '', '', nm2(total.totals.roomNetArea)],
    })
  }

  // Plafonds : mêmes pièces, même numérotation des pièces sans nom que « Vos pièces ».
  const ceilings = buildCeilingTable(building, labels.ceilings, (room, rank) =>
    room.name.trim() === '' ? `${labels.unnamedRoom} ${unnamedRank(building, room.id, rank)}` : room.name,
  )
  if (ceilings) tables.push(ceilings)

  const levelRow = (name: string, m: BuildingMeasurements['total']): MetresCell[] => [
    name,
    nm2(m.totals.roomNetArea),
    ncount(m.totals.doors),
    ncount(m.totals.windows),
    ncount(m.totals.bays),
  ]
  tables.push({
    id: 'client-levels',
    title: labels.levelsTitle,
    columns: [
      { header: labels.level, align: 'left' },
      { header: labels.floorArea, align: 'right' },
      { header: labels.doors, align: 'right' },
      { header: labels.windows, align: 'right' },
      { header: labels.bays, align: 'right' },
    ],
    // Un niveau sans pièce ni ouverture n'apporte rien au client ; la version Exécution le garde.
    rows: levels
      .filter(({ measurements: m }) => m.rooms.length > 0 || m.totals.doors + m.totals.windows + m.totals.bays > 0)
      .map(({ level, measurements }) => levelRow(level.name, measurements)),
    total: levelRow(scope === 'level' ? labels.levelTotal : labels.building, total),
  })
  return tables
}
