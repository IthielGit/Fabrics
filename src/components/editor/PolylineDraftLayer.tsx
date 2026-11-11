import { Circle, Label, Line, Tag, Text } from 'react-konva'
import {
  flattenPoints,
  pointDistance,
  polygonArea,
  polygonCentroid,
} from '../../features/geometry/polygon'
import type { SnapKind } from '../../features/geometry/snapping'
import { formatArea, formatLength } from '../../features/units/format'
import { fr } from '../../i18n/fr'
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
  opening: '#0891b2', // bord ou milieu d'une porte, fenêtre ou baie
  vertex: '#16a34a', // sommet existant
  align: '#ec4899', // alignement sur un autre point (guides roses)
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
  const { points, cursor, snapKind, fillMode, region } = draft
  const path = cursor && points.length > 0 ? [...points, cursor] : points
  const last = points[points.length - 1]
  const showLength = cursor !== null && last !== undefined
  const lengthMm = showLength ? pointDistance(last, cursor) : 0
  const middle =
    showLength ? { x: (last.x + cursor.x) / 2, y: (last.y + cursor.y) / 2 } : { x: 0, y: 0 }

  // Maj + survol (outil Pièce) : aperçu de la zone fermée par les murs, ou message si elle n'existe pas.
  if (fillMode && tool === 'room') {
    const regionArea = region ? polygonArea(flattenPoints(region)) : 0
    const centre = region ? polygonCentroid(flattenPoints(region)) : null
    return (
      <>
        {region && (
          <Line
            points={flattenPoints(region)}
            closed
            fill="rgba(22, 163, 74, 0.25)"
            stroke="#16a34a"
            strokeWidth={2 / scale}
            listening={false}
          />
        )}
        {region && centre && (
          <Label x={centre.x} y={centre.y} listening={false}>
            <Tag fill="#166534" cornerRadius={3 / scale} />
            <Text
              text={formatArea(regionArea)}
              fontSize={13 / scale}
              fill="#ffffff"
              padding={4 / scale}
            />
          </Label>
        )}
        {!region && cursor && (
          <Label x={cursor.x + 12 / scale} y={cursor.y + 12 / scale} listening={false}>
            <Tag fill="#b91c1c" cornerRadius={3 / scale} />
            <Text
              text={fr.hints.regionNotClosed}
              fontSize={12 / scale}
              fill="#ffffff"
              padding={4 / scale}
            />
          </Label>
        )}
      </>
    )
  }

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
