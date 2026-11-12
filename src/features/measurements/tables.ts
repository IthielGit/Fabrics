import { formatDecimal, mm2ToM2, mm3ToM3 } from '../units/format'
import type { CsvLabels, FurnitureCsvRow } from './csv'
import type { BuildingMeasurements, Measurements } from './measurements'

/** Colonne d'un tableau de métrés : les nombres sont alignés à droite, le texte à gauche. */
export interface MetresColumn {
  header: string
  align: 'left' | 'right'
}

/** Unité d'une grandeur : sert au format de cellule (mm entiers, m² et m³ à 2 décimales) dans Excel. */
export type MetresUnit = 'mm' | 'm2' | 'm3' | 'count' | 'deg'

/** Une grandeur : le texte affiché (virgule décimale, arrondi) et sa valeur exacte, avant arrondi. */
export interface MetresNumber {
  text: string
  value: number
  unit: MetresUnit
}

/** Une cellule : du texte, ou une grandeur chiffrée. */
export type MetresCell = string | MetresNumber

export const cellText = (cell: MetresCell): string => (typeof cell === 'string' ? cell : cell.text)

/**
 * Un tableau de métrés, indépendant du format : le CSV et le PDF le mettent chacun en forme. Toutes
 * les cellules sont déjà du texte (virgule décimale, mm entiers, m² à 2 décimales).
 */
export interface MetresTable {
  id: string
  title: string
  columns: MetresColumn[]
  rows: MetresCell[][]
  /** Ligne de total, calculée sur les valeurs exactes (avant arrondi). */
  total?: MetresCell[]
  /** Explication des colonnes, affichée sous le titre. */
  note?: string
}

/** Longueurs en mm entiers (Métrique architectural), surfaces en m², volumes en m³. */
export const mm = (value: number) => formatDecimal(value, 0)
export const m2 = (value: number) => formatDecimal(mm2ToM2(value))
export const m3 = (value: number) => formatDecimal(mm3ToM3(value))

export const nmm = (value: number): MetresNumber => ({ text: mm(value), value, unit: 'mm' })
/** Surface : `value` est en m² (le calcul est en mm²), exact, avant arrondi. */
export const nm2 = (value: number): MetresNumber => ({ text: m2(value), value: mm2ToM2(value), unit: 'm2' })
/** Volume : `value` est en m³ (le calcul est en mm³). */
export const nm3 = (value: number): MetresNumber => ({ text: m3(value), value: mm3ToM3(value), unit: 'm3' })
export const ncount = (value: number): MetresNumber => ({ text: String(value), value, unit: 'count' })
/** Pente en degrés (au dixième). */
export const ndeg = (value: number): MetresNumber => ({ text: formatDecimal(value, 1), value, unit: 'deg' })

const left = (header: string): MetresColumn => ({ header, align: 'left' })
const right = (header: string): MetresColumn => ({ header, align: 'right' })

/** Repères des murs (M01, M02…) : deux murs qui portent le même nom ne se confondent plus. */
export function wallRefs(building: BuildingMeasurements): Map<string, string> {
  return building.refs.walls
}

/** Repères des ouvertures (P01 pour les portes, F01 pour les fenêtres et les baies). */
export function openingRefs(building: BuildingMeasurements): Map<string, string> {
  return building.refs.openings
}

/**
 * Les tableaux des métrés d'un bâtiment, dans l'ordre : pièces, murs, ouvertures, escaliers,
 * plateformes, cheminées, mobilier, puis les totaux par niveau. Les tableaux vides sont omis.
 */
export function buildMetresTables(
  building: BuildingMeasurements,
  labels: CsvLabels,
  furniture: readonly FurnitureCsvRow[] = [],
): MetresTable[] {
  const { levels, total } = building
  const refs = wallRefs(building)
  const tables: MetresTable[] = []

  /** Une ligne par élément, précédée du nom de son niveau. */
  const perLevel = <T>(pick: (m: Measurements) => T[], format: (item: T) => MetresCell[]): MetresCell[][] =>
    levels.flatMap(({ level, measurements }) =>
      pick(measurements).map((item) => [level.name, ...format(item)]),
    )
  const totalRow = (...cells: MetresCell[]): MetresCell[] => [labels.total, ...cells]

  // --- Pièces : surface au tracé ; trémie et surface nette seulement s'il y a une trémie.
  const hasVoids = total.rooms.some((room) => room.voidArea > 0)
  tables.push({
    id: 'rooms',
    title: labels.rooms,
    columns: [
      left(labels.level),
      left(labels.name),
      right(labels.roomTraceArea),
      right(labels.perimeter),
      ...(hasVoids ? [right(labels.voidArea), right(labels.roomNetArea)] : []),
    ],
    rows: perLevel(
      (m) => m.rooms,
      (room) => [
        room.name,
        nm2(room.area),
        nmm(room.perimeter),
        ...(hasVoids ? [nm2(room.voidArea), nm2(room.netArea)] : []),
      ],
    ),
    total: totalRow(
      '',
      nm2(total.totals.roomArea),
      nmm(total.rooms.reduce((sum, room) => sum + room.perimeter, 0)),
      ...(hasVoids ? [nm2(total.totals.voidArea), nm2(total.totals.roomNetArea)] : []),
    ),
  })

  // --- Murs : une face sur l'axe, puis deux faces sur les faces, puis le volume.
  tables.push({
    id: 'walls',
    title: labels.walls,
    note: labels.wallsNote,
    columns: [
      left(labels.level),
      left(labels.ref),
      left(labels.name),
      right(labels.length),
      right(labels.thickness),
      right(labels.height),
      right(labels.wallArea),
      right(labels.openingsArea),
      right(labels.wallNetArea),
      right(labels.facesLength),
      right(labels.facesArea),
      right(labels.facesNetArea),
      right(labels.wallVolume),
    ],
    rows: perLevel(
      (m) => m.walls,
      (wall) => [
        refs.get(wall.id) ?? '',
        wall.name,
        nmm(wall.length),
        nmm(wall.thickness),
        nmm(wall.height),
        nm2(wall.wallArea),
        nm2(wall.openingsArea),
        nm2(wall.netArea),
        nmm(wall.facesLength),
        nm2(wall.facesArea),
        nm2(wall.facesNetArea),
        nm3(wall.volume),
      ],
    ),
    total: totalRow(
      '',
      '',
      nmm(total.totals.wallLength),
      '',
      '',
      nm2(total.totals.wallArea),
      nm2(total.totals.openingsArea),
      nm2(total.totals.wallNetArea),
      nmm(total.walls.reduce((sum, wall) => sum + wall.facesLength, 0)),
      nm2(total.totals.wallFacesArea),
      nm2(total.totals.wallFacesNetArea),
      nm3(total.totals.wallVolume),
    ),
  })

  // --- Ouvertures.
  if (total.openings.length > 0) {
    tables.push({
      id: 'openings',
      title: labels.openings,
      columns: [
        left(labels.level),
        left(labels.ref),
        left(labels.name),
        left(labels.kind),
        left(labels.style),
        left(labels.wall),
        left(labels.wallRef),
        right(labels.width),
        right(labels.height),
        right(labels.sillHeight),
        right(labels.area),
      ],
      rows: perLevel(
        (m) => m.openings,
        (opening) => [
          openingRefs(building).get(opening.id) ?? '',
          opening.name,
          labels.kinds[opening.kind],
          labels.styles[opening.style],
          opening.wallName,
          refs.get(opening.wallId) ?? '',
          nmm(opening.width),
          nmm(opening.height),
          nmm(opening.sillHeight),
          nm2(opening.area),
        ],
      ),
      total: totalRow('', '', '', '', '', '', '', '', '', nm2(total.totals.openingsArea)),
    })
  }

  // --- Escaliers : contremarches, girons, hauteur de contremarche, giron, emmarchement.
  const stairLabels = labels.stairs
  if (stairLabels && total.stairs.length > 0) {
    tables.push({
      id: 'stairs',
      title: stairLabels.title,
      columns: [
        left(labels.level),
        left(labels.name),
        left(stairLabels.shape),
        right(stairLabels.width),
        right(stairLabels.risers),
        right(stairLabels.riserHeight),
        right(stairLabels.treads),
        right(stairLabels.treadDepth),
        left(stairLabels.remark),
      ],
      rows: perLevel(
        (m) => m.stairs,
        (stair) => [
          stair.name,
          stairLabels.shapes[stair.shape],
          nmm(stair.width),
          stair.risers === null ? '' : ncount(stair.risers),
          stair.riserHeight === null ? '' : nmm(stair.riserHeight),
          stair.treads === null ? '' : ncount(stair.treads),
          stair.treadDepth === null ? '' : nmm(stair.treadDepth),
          stair.status === 'too-short'
            ? stairLabels.tooShort(Math.ceil(stair.requiredRun ?? 0))
            : stair.status === 'no-level-above'
              ? stairLabels.noLevelAbove
              : '',
        ],
      ),
    })
  }

  // --- Plateformes : surface (m²) et volume = surface × épaisseur (m³).
  const platformLabels = labels.platforms
  if (platformLabels && total.platforms.length > 0) {
    tables.push({
      id: 'platforms',
      title: platformLabels.title,
      columns: [
        left(labels.level),
        left(labels.name),
        right(labels.area),
        right(platformLabels.elevation),
        right(platformLabels.thickness),
        right(platformLabels.volume),
      ],
      rows: perLevel(
        (m) => m.platforms,
        (platform) => [
          platform.name,
          nm2(platform.area),
          nmm(platform.elevation),
          nmm(platform.thickness),
          nm3(platform.volume),
        ],
      ),
      total: totalRow('', nm2(total.totals.platformArea), '', '', nm3(total.totals.platformVolume)),
    })
  }

  // --- Toitures : surfaces (m²), faîtage, égouts et arêtiers (mm), pignons. Aucun prix.
  const roofLabels = labels.roofs
  if (roofLabels && total.roofs.length > 0) {
    const t = total.totals
    tables.push({
      id: 'roofs',
      title: roofLabels.title,
      note: roofLabels.note,
      columns: [
        left(labels.level),
        left(labels.name),
        left(roofLabels.shape),
        right(roofLabels.pitch),
        right(roofLabels.overhang),
        right(roofLabels.projectedArea),
        right(roofLabels.realArea),
        right(roofLabels.ridge),
        right(roofLabels.eaves),
        right(roofLabels.hips),
        right(roofLabels.gables),
        left(roofLabels.remark),
      ],
      rows: perLevel(
        (m) => m.roofs,
        (roof) => [
          roof.name,
          roofLabels.shapes[roof.shape],
          roof.pitch === null ? '' : ndeg(roof.pitch),
          nmm(roof.overhang),
          nm2(roof.projectedArea),
          nm2(roof.realArea),
          nmm(Math.round(roof.ridgeLength)),
          nmm(Math.round(roof.eaveLength)),
          nmm(Math.round(roof.hipLength)),
          ncount(roof.gableCount),
          roof.problem ? roofLabels.problems[roof.problem] : '',
        ],
      ),
      total: totalRow(
        '',
        '',
        '',
        '',
        nm2(t.roofProjectedArea),
        nm2(t.roofRealArea),
        nmm(Math.round(t.roofRidgeLength)),
        nmm(Math.round(t.roofEaveLength)),
        nmm(Math.round(t.roofHipLength)),
        ncount(t.roofGables),
        '',
      ),
    })
  }

  // --- Cheminées.
  const chimneyLabels = labels.chimneys
  if (chimneyLabels && total.chimneys.length > 0) {
    tables.push({
      id: 'chimneys',
      title: chimneyLabels.title,
      columns: [
        left(labels.level),
        left(labels.name),
        right(labels.width),
        right(chimneyLabels.depth),
        right(labels.area),
        right(chimneyLabels.overhang),
      ],
      rows: perLevel(
        (m) => m.chimneys,
        (chimney) => [
          chimney.name,
          nmm(chimney.width),
          nmm(chimney.depth),
          nm2(chimney.area),
          nmm(chimney.heightAboveTop),
        ],
      ),
      total: totalRow('', '', '', nm2(total.chimneys.reduce((sum, c) => sum + c.area, 0)), ''),
    })
  }

  // --- Mobilier : liste, jamais ajoutée aux surfaces ni aux longueurs ; les symboles
  // conventionnels et les zones de référence sont comptés à part.
  const furnitureLabels = labels.furniture
  if (furnitureLabels) {
    const groups: [FurnitureCsvRow['kind'], string][] = [
      ['furniture', furnitureLabels.title],
      ['nominal', furnitureLabels.nominalTitle],
      ['zone', furnitureLabels.zoneTitle],
    ]
    for (const [kind, title] of groups) {
      const rows = furniture.filter((item) => item.kind === kind)
      if (rows.length === 0) continue
      tables.push({
        id: `furniture-${kind}`,
        title,
        columns: [
          left(furnitureLabels.category),
          left(labels.name),
          right(labels.width),
          right(furnitureLabels.depth),
          right(furnitureLabels.count),
        ],
        rows: rows.map((item) => [
          item.category,
          item.name,
          nmm(item.width),
          nmm(item.depth),
          ncount(item.count),
        ]),
      })
    }
  }

  // --- Totaux par niveau, puis le bâtiment (= la somme des niveaux).
  const levelRow = (
    title: string,
    altitude: MetresCell,
    floorHeight: MetresCell,
    m: Measurements,
  ): MetresCell[] => [
    title,
    altitude,
    floorHeight,
    nm2(m.totals.roomArea),
    nmm(m.totals.wallLength),
    nm2(m.totals.wallArea),
    nm2(m.totals.openingsArea),
    nm2(m.totals.wallNetArea),
    nm2(m.totals.wallFacesNetArea),
    nm3(m.totals.wallVolume),
    ncount(m.totals.doors),
    ncount(m.totals.windows),
    ncount(m.totals.bays),
  ]
  tables.push({
    id: 'levels',
    title: labels.levelTotals,
    columns: [
      left(labels.level),
      right(labels.elevation),
      right(labels.levelHeight),
      right(labels.roomsTotal),
      right(labels.wallsTotal),
      right(labels.wallArea),
      right(labels.openingsArea),
      right(labels.wallNetArea),
      right(labels.facesNetArea),
      right(labels.wallVolume),
      right(labels.doors),
      right(labels.windows),
      right(labels.bays),
    ],
    rows: levels.map(({ level, measurements }) =>
      levelRow(level.name, nmm(level.elevation), nmm(level.height), measurements),
    ),
    total: levelRow(labels.building, '', '', total),
  })

  return tables
}

/** Client : surfaces au sol simples ; Exécution (affichée « Technique ») : tous les détails et les règles de calcul. */
export type MetresVersion = 'client' | 'execution'
