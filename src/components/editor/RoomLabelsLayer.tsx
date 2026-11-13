import { Text } from 'react-konva'
import { polygonArea, polygonCentroid } from '../../features/geometry/polygon'
import { formatArea } from '../../features/units/format'
import { useEditorStore } from '../../stores/editorStore'
import type { CanvasElement, RoomElement } from '../../types/document'

/** Taille de police de l'étiquette : 25 cm sur le plan, jamais sous 10 px à l'écran. */
const LABEL_FONT_MM = 250
const LABEL_MIN_PX = 10
const LABEL_BOX_WIDTH_MM = 6000

interface RoomLabelsLayerProps {
  elements: readonly CanvasElement[]
  scale: number
}

/**
 * Nom et surface de chaque pièce, dessinés au-dessus des meubles, de l'escalier et des axes
 * (sinon ils disparaissent dessous), avec un liseré clair pour rester lisibles sur un trait.
 */
export default function RoomLabelsLayer({ elements, scale }: RoomLabelsLayerProps) {
  // Avec des cotes automatiques, l'étiquette calculée (nom, dimensions, surface…) remplace celle-ci.
  const autoLabels = useEditorStore((state) => state.dimensioningMode !== 'none')
  if (autoLabels) return null

  const fontSize = Math.max(LABEL_FONT_MM, LABEL_MIN_PX / scale)
  const labelHeight = fontSize * 1.3 * 2 // deux lignes : nom, puis surface
  const rooms = elements.filter(
    (element): element is RoomElement =>
      element.type === 'room' && element.showLabel && !element.hidden && element.points.length >= 6,
  )

  return rooms.map((room) => {
    const centroid = polygonCentroid(room.points)
    if (!centroid) return null
    return (
      <Text
        key={room.id}
        x={room.x + centroid.x - LABEL_BOX_WIDTH_MM / 2}
        y={room.y + centroid.y - labelHeight / 2}
        width={LABEL_BOX_WIDTH_MM}
        height={labelHeight}
        opacity={room.opacity}
        align="center"
        verticalAlign="middle"
        text={`${room.name}
${formatArea(polygonArea(room.points))}`}
        fontSize={fontSize}
        lineHeight={1.3}
        fontStyle="bold"
        fill="#312e81"
        stroke="rgba(255, 255, 255, 0.9)"
        strokeWidth={fontSize * 0.28}
        fillAfterStrokeEnabled
        listening={false}
      />
    )
  })
}
