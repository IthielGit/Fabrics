import { Circle, Group, Text } from 'react-konva'
import type { Point } from '../../../features/geometry/viewport'

interface LabelBubbleProps {
  center: Point
  radius: number
  label: string
  color: string
  selected: boolean
  /** Épaisseur de trait de base (unités du document). */
  thin: number
}

/** Bulle de repère d'un axe ou d'une coupe : cercle blanc, repère en gras au centre. */
export default function LabelBubble({ center, radius, label, color, selected, thin }: LabelBubbleProps) {
  // Plus l'étiquette est longue, plus on réduit le texte pour qu'il tienne dans la bulle.
  const fontSize = Math.min(radius * 1.05, (radius * 1.7) / Math.max(label.length, 1))
  return (
    <Group x={center.x} y={center.y}>
      <Circle
        radius={radius}
        fill="#ffffff"
        stroke={selected ? '#4f46e5' : color}
        strokeWidth={selected ? thin * 2 : thin * 1.4}
      />
      <Text
        x={-radius}
        y={-radius}
        width={radius * 2}
        height={radius * 2}
        align="center"
        verticalAlign="middle"
        text={label}
        fontSize={fontSize}
        fontStyle="bold"
        fill={color}
        listening={false}
      />
    </Group>
  )
}
