import { Circle, Line, Text } from 'react-konva'
import { fr } from '../../i18n/fr'
import type { CalibrationState } from './useCalibrationTool'

interface CalibrationDraftLayerProps {
  state: CalibrationState
  /** Pixels écran par unité du document. */
  scale: number
}

const COLOR = '#dc2626'

/** Aperçu du calibrage : les points A et B et le segment qui les relie. */
export default function CalibrationDraftLayer({ state, scale }: CalibrationDraftLayerProps) {
  const { points, cursor } = state
  const a = points[0]
  const b = points[1] ?? cursor
  if (!a) return null

  return (
    <>
      {b && (
        <Line
          points={[a.x, a.y, b.x, b.y]}
          stroke={COLOR}
          strokeWidth={2 / scale}
          dash={[6 / scale, 4 / scale]}
        />
      )}
      {[a, points[1]].map(
        (point, index) =>
          point && (
            <Circle
              key={index}
              x={point.x}
              y={point.y}
              radius={5 / scale}
              fill={COLOR}
              stroke="#ffffff"
              strokeWidth={1.5 / scale}
            />
          ),
      )}
      <Text
        x={a.x + 8 / scale}
        y={a.y - 18 / scale}
        text={fr.calibrate.pointA}
        fontSize={13 / scale}
        fontStyle="bold"
        fill={COLOR}
      />
      {points[1] && (
        <Text
          x={points[1].x + 8 / scale}
          y={points[1].y - 18 / scale}
          text={fr.calibrate.pointB}
          fontSize={13 / scale}
          fontStyle="bold"
          fill={COLOR}
        />
      )}
    </>
  )
}
