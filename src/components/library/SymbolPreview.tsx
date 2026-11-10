import type { ReactNode } from 'react'
import { getSymbol } from '../../features/library/catalog'
import type { SetDef } from '../../features/library/catalog/sets'
import { drawSymbol } from '../../features/library/drawing'
import { arcPoints } from '../../features/library/primitives'
import { STYLE_LOOKS } from '../../features/library/style'
import type { Primitive, SymbolDef } from '../../features/library/types'

/** Marge autour du dessin, en mm, pour ne pas couper l'épaisseur des contours. */
const PADDING_MM = 40
/** Tirets des styles pointillés dans l'aperçu, en px écran. */
const PREVIEW_DASH: Record<string, string> = { above: '3 2', zone: '5 2' }

function pointsAttribute(flat: readonly number[]): string {
  const pairs: string[] = []
  for (let i = 0; i + 1 < flat.length; i += 2) pairs.push(`${flat[i]},${flat[i + 1]}`)
  return pairs.join(' ')
}

function renderPrimitive(primitive: Primitive, index: number) {
  const look = STYLE_LOOKS[primitive.style]
  const common = {
    fill: look.fill ?? 'none',
    stroke: look.stroke ?? 'none',
    strokeWidth: look.stroke ? 1.2 : 0,
    strokeDasharray: PREVIEW_DASH[primitive.style],
    vectorEffect: 'non-scaling-stroke' as const,
  }
  switch (primitive.kind) {
    case 'rect':
      return (
        <rect
          key={index}
          {...common}
          x={primitive.x}
          y={primitive.y}
          width={primitive.w}
          height={primitive.h}
          rx={primitive.r}
        />
      )
    case 'circle':
      return <circle key={index} {...common} cx={primitive.cx} cy={primitive.cy} r={primitive.r} />
    case 'ellipse':
      return (
        <ellipse
          key={index}
          {...common}
          cx={primitive.cx}
          cy={primitive.cy}
          rx={primitive.rx}
          ry={primitive.ry}
        />
      )
    case 'line':
      return <polyline key={index} {...common} fill="none" points={pointsAttribute(primitive.points)} />
    case 'polygon':
      return <polygon key={index} {...common} points={pointsAttribute(primitive.points)} />
    case 'arc':
      return (
        <polyline
          key={index}
          {...common}
          fill="none"
          points={pointsAttribute(
            arcPoints(primitive.cx, primitive.cy, primitive.r, primitive.from, primitive.to),
          )}
        />
      )
  }
}

interface FrameProps {
  /** Taille de la boîte d'aperçu, en px (le dessin y est inscrit, proportions gardées). */
  size: number
  width: number
  depth: number
  children: ReactNode
}

function Frame({ size, width, depth, children }: FrameProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox={`${-PADDING_MM} ${-PADDING_MM} ${width + PADDING_MM * 2} ${depth + PADDING_MM * 2}`}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      className="shrink-0"
    >
      {children}
    </svg>
  )
}

interface SymbolPreviewProps {
  def: SymbolDef
  size?: number
}

/**
 * Aperçu d'un objet de la bibliothèque, en SVG (mêmes primitives que le canevas). Les traits ont
 * une épaisseur fixe à l'écran, quelle que soit la taille de l'objet.
 */
export default function SymbolPreview({ def, size = 56 }: SymbolPreviewProps) {
  return (
    <Frame size={size} width={def.width} depth={def.depth}>
      {drawSymbol(def, def.width, def.depth).map(renderPrimitive)}
    </Frame>
  )
}

/** Aperçu d'un ensemble : chacun de ses objets à sa place, tourné comme sur le plan. */
export function SetPreview({ set, size = 56 }: { set: SetDef; size?: number }) {
  return (
    <Frame size={size} width={set.width} depth={set.depth}>
      {set.members.map((member, index) => {
        const def = getSymbol(member.symbol)
        if (!def) return null
        return (
          <g key={index} transform={`translate(${member.x} ${member.y}) rotate(${member.rotation})`}>
            {drawSymbol(def, member.width, member.depth, member.mirrored).map(renderPrimitive)}
          </g>
        )
      })}
    </Frame>
  )
}
