import type { CsvLabels, FurnitureCsvRow } from './csv'
import type { BuildingMeasurements } from './measurements'
import { buildMetresTables, type MetresTable } from './tables'

/** Règles de calcul imprimées en fin de document d'exécution (fournies par `src/i18n/fr.ts`). */
export interface ExecutionLabels {
  rulesTitle: string
  rulesColumn: string
  rules: readonly string[]
}

/**
 * Présentation « Exécution » des métrés (M10 ter) : tous les tableaux détaillés (pièces, murs avec
 * leurs repères, épaisseurs, surfaces brutes et nettes par face et volumes, ouvertures, escaliers,
 * dalles, cheminées, toitures, totaux par niveau), suivis du rappel des règles de calcul. Toutes
 * les ouvertures sont déduites des surfaces de murs, sans seuil (D36).
 */
export function buildExecutionTables(
  building: BuildingMeasurements,
  labels: CsvLabels,
  furniture: readonly FurnitureCsvRow[],
  execution: ExecutionLabels,
): MetresTable[] {
  return [
    ...buildMetresTables(building, labels, furniture),
    {
      id: 'rules',
      title: execution.rulesTitle,
      columns: [{ header: execution.rulesColumn, align: 'left' }],
      rows: execution.rules.map((rule) => [rule]),
    },
  ]
}
