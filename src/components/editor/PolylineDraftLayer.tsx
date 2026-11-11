import { Circle, Label, Line, Tag, Text } from 'react-konva'
import { flattenPoints, pointDistance } from '../../features/geometry/polygon'
import type { SnapKind } from '../../features/geometry/snapping'
import { formatLength } from '../../features/units/format'
import type { PolylineDraft, PolylineTool } from './usePolylineDrawing'

interface PolylineDraftLayerProps {
  tool: PolylineTool
  draft: PolylineDraft
  /** Pixels écran par mm. */
  scale: number
  /** Épaisseur de mur à prévisualiser (mm). */
  wallThickness: number
}

const ACCENT = '#4f46e5'

const SNAP_COLORS: Record<SnapKind, string> = {
  vertex: '#16a34a', // sommet existant
  axis: '#be123c', // ligne d'un axe de construction
  wall: '#d97706', // axe d'un mur existant (raccord en T)
  grid: '#64748b', // grille
  angle: '#2563eb', // direction contrainte
  none: '#4f46e5',
}

/** Aperçu du tracé en cours : segments, points, repère d'aimantation et longueur du segment. */
export default function PolylineDraftLayer({
  tool,
  draft,
  scale,
  wallThickness,
}: PolylineDraftLayerProps) {
  const { points, cursor, snapKind } = draft
  const path = cursor && points.length > 0 ? [...points, cursor] : points
  const last = points[points.length - 1]
  const showLength = cursor !== null && last !== undefined
  const lengthMm = showLength ? pointDistance(last, cursor) : 0
  const middle =
    showLength ? { x: (last.x + cursor.x) / 2, y: (last.y + cursor.y) / 2 } : { x: 0, y: 0 }

  return (
    <>
      {tool === 'wall' && path.length >= 2 && (
        <Line
          points={flattenPoints(path)}
          stroke="#475569"
          strokeWidth={wallThickness}
          opacity={0.4}
          lineJoin="miter"
          lineCap="butt"
        />
      )}
      {tool === 'room' && path.length >= 2 && (
        <Line
          points={flattenPoints(path)}
          closed={path.length >= 3}
          fill="rgba(99, 102, 241, 0.15)"
          stroke={ACCENT}
          strokeWidth={1.5 / scale}
          dash={[6 / scale, 4 / scale]}
        />
      )}
      {tool !== 'room' && path.length >= 2 && (
        <Line
          points={flattenPoints(path)}
          stroke={ACCENT}
          strokeWidth={1.5 / scale}
          dash={tool === 'wall' || tool === 'axis' ? [6 / scale, 4 / scale] : undefined}
        />
      )}

      {points.map((p, i) => (
        <Circle key={i} x={p.x} y={p.y} radius={4 / scale} fill={ACCENT} />
      ))}

      {cursor && (
        <Circle
          x={cursor.x}
          y={cursor.y}
          radius={6 / scale}
          stroke={SNAP_COLORS[snapKind]}
          strokeWidth={2 / scale}
          fill="rgba(255,255,255,0.6)"
        />
      )}

      {showLength && lengthMm > 0 && (
        <Label x={middle.x} y={middle.y - 18 / scale} listening={false}>
          <Tag fill="#1e293b" cornerRadius={3 / scale} />
          <Text
            text={formatLength(lengthMm)}
            fontSize={12 / scale}
            fill="#ffffff"
            padding={4 / scale}
          />
        </Label>
      )}
    </>
  )
}
