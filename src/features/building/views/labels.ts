import { formatLength } from '../../units/format'

/** Altitude avec son signe : « ± 0 mm » au niveau de référence, « + 2500 mm » au-dessus, « − 300 mm » en dessous. */
export function formatElevation(mm: number): string {
  if (mm === 0) return `± ${formatLength(0)}`
  return `${mm > 0 ? '+' : '−'} ${formatLength(Math.abs(mm))}`
}
