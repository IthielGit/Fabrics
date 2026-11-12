import {
  FILL_COLORS,
  INK,
  MUTED_INK,
  paintBatches,
  type Drawing,
  type DrawPolygon,
} from '../../features/building/views/drawing'

interface ViewDrawingProps {
  drawing: Drawing
}

const STROKE_PX = { heavy: 2, cut: 1.4, normal: 1, hair: 0.75 } as const
/** Traits de hachure : plus fins que les filets, pour que le contour de la matière domine. */
const HATCH_PX = 0.5

/** Chemin SVG des traits de hachure d'un polygone. */
function hatchPath(polygon: DrawPolygon): string {
  return (polygon.hatch ?? []).map(([x1, y1, x2, y2]) => `M${x1},${y1}L${x2},${y2}`).join('')
}

/** Chemin SVG des côtés marqués d'un polygone (côté i = point i → point i+1). */
function edgesPath(points: readonly [number, number][], edges: readonly boolean[]): string {
  const parts: string[] = []
  points.forEach(([x, y], i) => {
    if (!edges[i]) return
    const [nx, ny] = points[(i + 1) % points.length]
    parts.push(`M${x},${y}L${nx},${ny}`)
  })
  return parts.join('')
}

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
      {paintBatches(drawing.polygons).map((batch, index) => {
        const [polygon] = batch
        const strokeWidth = polygon.fill === 'black' ? 1.4 : 1
        const pointsOf = (p: DrawPolygon) => p.points.map(([x, y]) => `${x},${y}`).join(' ')
        const fillOf = (p: DrawPolygon) => (p.fill === 'none' ? 'none' : FILL_COLORS[p.fill])
        if (polygon.open) {
          // Trait de façade d'une ouverture (triangle d'ouverture, flèche) : ligne brisée fine.
          return (
            <polyline
              key={index}
              points={pointsOf(polygon)}
              fill="none"
              stroke={INK}
              strokeWidth={STROKE_PX.hair}
              strokeDasharray={polygon.dashed ? '4 3' : undefined}
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          )
        }
        if (!polygon.edges) {
          return (
            <polygon
              key={index}
              points={pointsOf(polygon)}
              fill={fillOf(polygon)}
              stroke={INK}
              strokeWidth={strokeWidth}
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          )
        }
        // Faces d'un même plan : tous les fonds (rendu net, sans interstice qui laisserait voir les
        // faces du fond), puis seulement les vrais bords, d'un seul tracé.
        return (
          <g key={index}>
            {batch.map((p, i) => (
              <polygon key={i} points={pointsOf(p)} fill={fillOf(p)} stroke="none" shapeRendering="crispEdges" />
            ))}
            {batch.some((p) => p.hatch?.length) && (
              <path
                d={batch.map(hatchPath).join('')}
                fill="none"
                stroke={INK}
                strokeWidth={HATCH_PX}
                vectorEffect="non-scaling-stroke"
              />
            )}
            <path
              d={batch.map((p) => edgesPath(p.points, p.edges ?? [])).join('')}
              fill="none"
              stroke={INK}
              strokeWidth={strokeWidth}
              strokeLinecap="square"
              vectorEffect="non-scaling-stroke"
            />
          </g>
        )
      })}
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
