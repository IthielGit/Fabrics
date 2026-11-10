import { drawSofa } from '../templates/sofa'
import type { SymbolDef } from '../types'

export const LIVING_SYMBOLS: readonly SymbolDef[] = [
  {
    id: 'sofa-3',
    category: 'living',
    width: 2100,
    depth: 900,
    sizes: [
      { label: '1950 × 900', width: 1950, depth: 900 },
      { label: '2100 × 900', width: 2100, depth: 900 },
      { label: '2300 × 900', width: 2300, depth: 900 },
    ],
    min: { width: 1500, depth: 700 },
    max: { width: 3200, depth: 1200 },
    resize: 'free',
    mirrorable: false,
    height: 850,
    draw: drawSofa,
  },
]
