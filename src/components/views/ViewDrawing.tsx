import { FILL_COLORS, INK, MUTED_INK, type Drawing } from '../../features/building/views/drawing'

interface ViewDrawingProps {
  drawing: Drawing
}

const STROKE_PX = { heavy: 2, normal: 1, hair: 0.75 } as const

/**
 * Affiche un dessin (façade, coupe ou planche) en SVG, dans la même palette neutre que le PDF. Le
 * repère est en millimètres réels ; les traits gardent une épaisseur constante à l'écran.
 */
export default function ViewDrawing({ drawing }: ViewDrawingProps) {
  if (drawing.width <= 0 || drawing.height <= 0) return null
  return (
    <svg
      viewBox={`0 0 ${drawing.width} ${drawing.height}`}
      className="h-full w-full"
      role="img"
      preserveAspectRatio="xMidYMid meet"
    >
      {drawing.polygons.map((polygon, index) => (
        <polygon
          key={index}
          points={polygon.points.map(([x, y]) => `${x},${y}`).join(' ')}
          fill={polygon.fill === 'none' ? 'none' : FILL_COLORS[polygon.fill]}
          stroke={INK}
          strokeWidth={polygon.fill === 'black' ? 1.4 : 1}
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      ))}
      {drawing.lines.map((line, index) => (
        <line
          key={index}
          x1={line.x1}
          y1={line.y1}
          x2={line.x2}
          y2={line.y2}
          stroke={line.muted ? MUTED_INK : INK}
          strokeWidth={STROKE_PX[line.weight ?? 'normal']}
          strokeDasharray={line.dashed ? '6 4' : undefined}
          vectorEffect="non-scaling-stroke"
        />
      ))}
      {drawing.texts.map((text, index) => (
        <text
          key={index}
          x={text.x}
          y={text.y}
          fontSize={text.size}
          fontWeight={text.bold ? 700 : 400}
          textAnchor={text.anchor === 'middle' ? 'middle' : 'start'}
          fill={text.muted ? MUTED_INK : INK}
        >
          {text.text}
        </text>
      ))}
    </svg>
  )
}
