import type { BuildingMeasurements } from './measurements'
import { nm2, nmm, ncount, type MetresCell, type MetresTable } from './tables'

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
  doors: string
  windows: string
  bays: string
  /** Libellé de la ligne qui totalise tous les niveaux. */
  building: string
  /** Libellé de la ligne de total du tableau des pièces. */
  total: string
}

/** Dimensions d'une pièce rectangulaire aux côtés horizontaux et verticaux : `4000 × 3000`. */
export function roomDimensionsText(dimensions: readonly [number, number] | null): string {
  if (!dimensions) return ''
  return `${Math.round(dimensions[0])} × ${Math.round(dimensions[1])}`
}

export function buildClientTables(building: BuildingMeasurements, labels: ClientLabels): MetresTable[] {
  const { levels, total } = building
  const tables: MetresTable[] = []

  const roomRows: MetresCell[][] = levels.flatMap(({ level, measurements }) =>
    measurements.rooms.map((room) => [
      level.name,
      room.name,
      roomDimensionsText(room.dimensions),
      nmm(room.perimeter),
      room.ceilingHeight === null ? '' : nmm(room.ceilingHeight),
      nm2(room.netArea),
    ]),
  )
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
    rows: levels.map(({ level, measurements }) => levelRow(level.name, measurements)),
    total: levelRow(labels.building, total),
  })
  return tables
}
