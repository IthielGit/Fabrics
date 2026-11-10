import { drawBed } from '../templates/bed'
import type { SymbolDef } from '../types'

export const BEDROOM_SYMBOLS: readonly SymbolDef[] = [
  {
    id: 'bed-queen',
    category: 'bedroom',
    width: 1600,
    depth: 2000,
    sizes: [
      { label: '1600 × 2000', width: 1600, depth: 2000 },
      { label: '1600 × 1900', width: 1600, depth: 1900 },
    ],
    min: { width: 800, depth: 1500 },
    max: { width: 2400, depth: 2400 },
    resize: 'free',
    mirrorable: false,
    height: 550,
    draw: drawBed,
  },
]
