import { Label, Line, Tag, Text } from 'react-konva'
import { formatLength } from '../../features/units/format'
import type { CutPreview } from './useCutTool'

interface CutPreviewLayerProps {
  preview: CutPreview | null
  /** Pixels écran par mm. */
  scale: number
}

const ACCENT = '#4f46e5'
const INVALID = '#dc2626'

/** Repère de coupe au survol d'un mur : un trait en travers du mur et la distance depuis le sommet. */
export default function CutPreviewLayer({ preview, scale }: CutPreviewLayerProps) {
  if (!preview) return null
  const { wall, at, direction, offset, problem } = preview
  const color = problem ? INVALID : ACCENT
  // Le trait dépasse un peu l'épaisseur du mur pour rester visible, quel que soit le zoom.
  const half = wall.thickness / 2 + 8 / scale
  const normal = { x: -direction.y, y: direction.x }

  return (
    <>
      <Line
        points={[at.x - normal.x * half, at.y - normal.y * half, at.x + normal.x * half, at.y + normal.y * half]}
        stroke={color}
        strokeWidth={2 / scale}
        dash={[6 / scale, 4 / scale]}
        listening={false}
      />
      {!problem && (
        <Label x={at.x} y={at.y - half - 8 / scale} listening={false}>
          <Tag fill="#1e293b" cornerRadius={3 / scale} />
          <Text text={formatLength(offset)} fontSize={12 / scale} fill="#ffffff" padding={4 / scale} />
        </Label>
      )}
    </>
  )
}
