import { Line, Rect, Text } from 'react-konva'
import { elementBounds } from '../../features/export/bounds'
import { normalizeBox } from '../../features/geometry/box'
import { formatLength } from '../../features/units/format'
import { fr } from '../../i18n/fr'
import type { StretchPreview, StretchState } from './useStretchTool'

interface StretchDraftLayerProps {
  state: StretchState
  preview: StretchPreview | null
  /** Pixels écran par mm. */
  scale: number
}

const COLOR = '#4f46e5'
const ERROR_COLOR = '#dc2626'

/**
 * Aperçu de l'outil Étirer : le rectangle de zone (pointillé) et, pendant le déplacement, le plan
 * tel qu'il serait après l'étirement (murs, pièces, cotes et objets déplacés), avec la distance.
 */
export default function StretchDraftLayer({ state, preview, scale }: StretchDraftLayerProps) {
  if (state.phase === 'idle') return null
  const zone =
    state.phase === 'zone' ? normalizeBox(state.start, state.current) : state.zone
  const dash = [6 / scale, 4 / scale]

  return (
    <>
      <Rect
        {...zone}
        fill="rgba(79,70,229,0.08)"
        stroke={COLOR}
        strokeWidth={1 / scale}
        dash={dash}
      />
      {state.phase === 'move' && preview && (
        <>
          <Line
            points={[state.base.x, state.base.y, state.cursor.x, state.cursor.y]}
            stroke={preview.blockedByDiagonal ? ERROR_COLOR : COLOR}
            strokeWidth={1.5 / scale}
            dash={dash}
          />
          {preview.result?.elements.map((element) => {
            if (element.type === 'wall') {
              return (
                <Line
                  key={element.id}
                  points={element.points}
                  stroke={COLOR}
                  opacity={0.5}
                  strokeWidth={element.thickness}
                  lineJoin="miter"
                />
              )
            }
            if (element.type === 'room') {
              return (
                <Line
                  key={element.id}
                  points={element.points}
                  closed
                  fill="rgba(79,70,229,0.12)"
                  stroke={COLOR}
                  strokeWidth={2 / scale}
                  dash={dash}
                />
              )
            }
            if (element.type === 'dimension') {
              return (
                <Line
                  key={element.id}
                  points={element.points}
                  stroke={COLOR}
                  strokeWidth={1.5 / scale}
                />
              )
            }
            const box = elementBounds(element)
            if (!box) return null
            return (
              <Rect
                key={element.id}
                {...box}
                stroke={COLOR}
                strokeWidth={1.5 / scale}
                dash={dash}
              />
            )
          })}
          <Text
            x={state.cursor.x + 12 / scale}
            y={state.cursor.y + 12 / scale}
            text={
              preview.blockedByDiagonal
                ? fr.stretch.blockedDiagonal
                : preview.typed !== ''
                  ? `${preview.typed} mm ↵`
                  : `${formatLength(preview.delta.x)} · ${formatLength(preview.delta.y)}`
            }
            fontSize={13 / scale}
            fontStyle="bold"
            fill={preview.blockedByDiagonal ? ERROR_COLOR : COLOR}
          />
        </>
      )}
    </>
  )
}
