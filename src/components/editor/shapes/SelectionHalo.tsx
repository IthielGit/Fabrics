import { Line } from 'react-konva'
import type { Point } from '../../../features/geometry/viewport'

interface SelectionHaloProps {
  line: readonly [Point, Point]
  viewScale: number
}

/** Surlignage d'un élément linéaire sélectionné (axe, coupe, cote) : bande indigo translucide. */
export default function SelectionHalo({ line: [a, b], viewScale }: SelectionHaloProps) {
  return (
    <Line
      points={[a.x, a.y, b.x, b.y]}
      stroke="#6366f1"
      strokeWidth={8 / viewScale}
      opacity={0.35}
      listening={false}
    />
  )
}
