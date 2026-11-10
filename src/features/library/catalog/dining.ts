import { drawRoundTable } from '../templates/table'
import type { SymbolDef } from '../types'

export const DINING_SYMBOLS: readonly SymbolDef[] = [
  {
    id: 'table-round-4',
    category: 'dining',
    width: 1000,
    depth: 1000,
    sizes: [
      { label: '900', width: 900, depth: 900 },
      { label: '1000', width: 1000, depth: 1000 },
    ],
    min: { width: 600, depth: 600 },
    max: { width: 1600, depth: 1600 },
    resize: 'ratio',
    mirrorable: false,
    height: 750,
    draw: drawRoundTable,
  },
]
