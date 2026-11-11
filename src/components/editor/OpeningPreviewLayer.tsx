import { Group, Label, Line, Rect, Tag, Text } from 'react-konva'
import { openingGeometry } from '../../features/geometry/openings'
import { openingSymbol } from '../../features/geometry/openingSymbol'
import { formatLength } from '../../features/units/format'
import { useEditorStore } from '../../stores/editorStore'
import type { OpeningPreview } from './useOpeningTool'

interface OpeningPreviewLayerProps {
  preview: OpeningPreview | null
  /** Pixels écran par mm. */
  scale: number
}

const ACCENT = '#4f46e5'
const INVALID = '#dc2626'

/** Aperçu de l'ouverture au survol d'un mur, avec les distances libres de chaque côté. */
export default function OpeningPreviewLayer({ preview, scale }: OpeningPreviewLayerProps) {
  const background = useEditorStore((state) => state.project?.document.page.background ?? '#ffffff')
  if (!preview) return null

  const { opening, wall, problem, clearances } = preview
  const geometry = openingGeometry(opening, wall)
  if (!geometry) return null

  const { cut, lines, dashed } = openingSymbol(opening, wall.thickness)
  const color = problem ? INVALID : ACCENT

  return (
    <>
      <Group x={geometry.center.x} y={geometry.center.y} rotation={geometry.angle} opacity={0.85}>
        <Rect x={cut.x} y={cut.y} width={cut.width} height={cut.height} fill={background} />
        {lines.map((points, index) => (
          <Line key={index} points={points} stroke={color} strokeWidth={2 / scale} />
        ))}
        {dashed.map((points, index) => (
          <Line
            key={`dashed-${index}`}
            points={points}
            stroke={color}
            strokeWidth={1.5 / scale}
            dash={[60, 40]}
          />
        ))}
        <Rect
          x={cut.x}
          y={cut.y}
          width={cut.width}
          height={cut.height}
          stroke={color}
          strokeWidth={1 / scale}
          dash={[4 / scale, 3 / scale]}
        />
      </Group>
      {clearances.map(({ length, at }, index) => (
        <Label key={index} x={at.x} y={at.y - 22 / scale} listening={false}>
          <Tag fill="#1e293b" cornerRadius={3 / scale} />
          <Text text={formatLength(length)} fontSize={12 / scale} fill="#ffffff" padding={4 / scale} />
        </Label>
      ))}
    </>
  )
}
