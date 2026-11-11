import { formatElevation } from '../../features/building/views/labels'
import type { LevelMark, ViewBounds, ViewFace } from '../../features/building/views/projection'

interface ViewDrawingProps {
  faces: readonly ViewFace[]
  bounds: ViewBounds | null
  levels: readonly LevelMark[]
  /** Affiche les cotes de niveaux (altitudes des planchers) ; vrai par défaut. */
  showLevelMarks?: boolean
}

/**
 * Dessin d'une vue (façade ou coupe) en SVG : faces blanches à contour noir, dans l'ordre du
 * peintre, ligne de sol et cotes de niveaux. Le repère est en millimètres, `v` vers le haut.
 */
export default function ViewDrawing({ faces, bounds, levels, showLevelMarks = true }: ViewDrawingProps) {
  if (!bounds) return null
  const extent = Math.max(bounds.maxU - bounds.minU, bounds.maxV - bounds.minV, 1000)
  const margin = extent * 0.12
  const font = extent / 55
  const left = bounds.minU - margin
  const right = bounds.maxU + margin * 2.2
  const top = -(bounds.maxV + margin)
  const bottom = -(bounds.minV - margin)
  const marks = showLevelMarks ? levels.filter((l) => l.elevation >= bounds.minV - 1) : []

  return (
    <svg
      viewBox={`${left} ${top} ${right - left} ${bottom - top}`}
      className="h-full w-full"
      role="img"
      preserveAspectRatio="xMidYMid meet"
    >
      <line
        x1={left}
        x2={right}
        y1={0}
        y2={0}
        stroke="#64748b"
        strokeWidth={1.5}
        vectorEffect="non-scaling-stroke"
      />
      {faces.map((face, index) => (
        <polygon
          key={index}
          points={face.polygon.map(([u, v]) => `${u},${-v}`).join(' ')}
          fill="#ffffff"
          stroke="#0f172a"
          strokeWidth={1.2}
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      ))}
      {marks.map((mark) => (
        <g key={mark.levelId}>
          <line
            x1={bounds.minU - margin * 0.6}
            x2={bounds.maxU + margin * 0.6}
            y1={-mark.elevation}
            y2={-mark.elevation}
            stroke="#6366f1"
            strokeWidth={1}
            strokeDasharray="6 4"
            vectorEffect="non-scaling-stroke"
          />
          <text
            x={bounds.maxU + margin * 0.7}
            y={-mark.elevation - font * 0.3}
            fontSize={font}
            fill="#4338ca"
          >
            {mark.name}
          </text>
          <text x={bounds.maxU + margin * 0.7} y={-mark.elevation + font * 1.05} fontSize={font} fill="#4338ca">
            {formatElevation(mark.elevation)}
          </text>
        </g>
      ))}
    </svg>
  )
}
