import { Shape } from 'react-konva'
import {
  gridPositions,
  isMajorLine,
  visibleGridStep,
} from '../../features/geometry/grid'

interface PlanGridProps {
  pageWidth: number
  pageHeight: number
  /** Taille de la grille en mm. */
  gridSize: number
  /** Pixels écran par mm. */
  scale: number
}

const MINOR_COLOR = '#e2e8f0'
const MAJOR_COLOR = '#cbd5e1'

/** Grille du plan (traits tous les `gridSize` mm, un peu plus marqués à chaque mètre). */
export default function PlanGrid({ pageWidth, pageHeight, gridSize, scale }: PlanGridProps) {
  const step = visibleGridStep(gridSize, scale)
  if (step === null) return null

  const xs = gridPositions(pageWidth, step)
  const ys = gridPositions(pageHeight, step)

  return (
    <Shape
      name="grid"
      listening={false}
      sceneFunc={(context) => {
        // Un seul tracé pour tous les traits : beaucoup plus rapide que des centaines de nœuds.
        const draw = (major: boolean, color: string) => {
          context.beginPath()
          for (const x of xs) {
            if (isMajorLine(x) !== major) continue
            context.moveTo(x, 0)
            context.lineTo(x, pageHeight)
          }
          for (const y of ys) {
            if (isMajorLine(y) !== major) continue
            context.moveTo(0, y)
            context.lineTo(pageWidth, y)
          }
          context.setAttr('strokeStyle', color)
          context.setAttr('lineWidth', 1 / scale)
          context.stroke()
        }
        draw(false, MINOR_COLOR)
        draw(true, MAJOR_COLOR)
      }}
    />
  )
}
