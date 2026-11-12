import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { angleFromPointer, snapCompassAngle } from '../../features/building/compass'
import { normalizeNorthAngle } from '../../features/building/north'
import { fr } from '../../i18n/fr'
import { useCompassStore } from '../../stores/compassStore'
import { useEditorStore } from '../../stores/editorStore'

const SIZE = 112
const HALF = SIZE / 2
/** Rayon des lettres N / E / S / O. */
const LETTER_RADIUS = 38
/** Graduations tous les 30°, plus longues aux quatre points cardinaux. */
const TICKS = Array.from({ length: 12 }, (_, i) => i * 30)

const CARDINALS = [
  { label: fr.viewer3d.cardinal.north, degrees: 0, accent: true },
  { label: fr.viewer3d.cardinal.east, degrees: 90, accent: false },
  { label: fr.viewer3d.cardinal.south, degrees: 180, accent: false },
  { label: fr.viewer3d.cardinal.west, degrees: 270, accent: false },
]

/**
 * Boussole du plan, en bas à gauche du canevas, affichée à la demande (bouton de la barre d'état).
 * Une seule règle : elle montre et règle l'angle du nord du plan (0° = nord en haut). On tourne
 * la rose à la souris (aimantée tous les 15°, Maj = au degré), aux flèches du clavier, ou on
 * double-clique pour remettre le nord en haut. Pendant le geste l'angle reste local : un seul
 * « Annuler » à la fin.
 */
export default function CompassWidget() {
  const visible = useCompassStore((state) => state.visible)
  const northAngle = useEditorStore((state) => state.project?.document.plan?.northAngle)
  const updatePlanSettings = useEditorStore((state) => state.updatePlanSettings)
  const svgRef = useRef<SVGSVGElement>(null)
  // Angle pendant le glisser ; `null` hors geste (on affiche alors l'angle du plan).
  const [dragAngle, setDragAngle] = useState<number | null>(null)

  if (!visible || northAngle === undefined) return null

  const shown = dragAngle ?? northAngle

  const angleAt = (event: PointerEvent<SVGSVGElement>): number | null => {
    const svg = svgRef.current
    if (!svg) return null
    const box = svg.getBoundingClientRect()
    const raw = angleFromPointer(
      { x: box.left + box.width / 2, y: box.top + box.height / 2 },
      { x: event.clientX, y: event.clientY },
    )
    return raw === null ? null : snapCompassAngle(raw, event.shiftKey)
  }

  const handleDown = (event: PointerEvent<SVGSVGElement>) => {
    if (event.button !== 0) return
    event.currentTarget.setPointerCapture(event.pointerId)
    const angle = angleAt(event)
    if (angle !== null) setDragAngle(angle)
  }

  const handleMove = (event: PointerEvent<SVGSVGElement>) => {
    if (dragAngle === null) return
    const angle = angleAt(event)
    if (angle !== null) setDragAngle(angle)
  }

  const handleUp = () => {
    if (dragAngle === null) return
    updatePlanSettings({ northAngle: dragAngle })
    setDragAngle(null)
  }

  const handleKey = (event: KeyboardEvent<SVGSVGElement>) => {
    const step = event.shiftKey ? 1 : 15
    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
      updatePlanSettings({ northAngle: normalizeNorthAngle(northAngle + step) })
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
      updatePlanSettings({ northAngle: normalizeNorthAngle(northAngle - step) })
    } else if (event.key === 'Home') {
      updatePlanSettings({ northAngle: 0 })
    } else {
      return
    }
    event.preventDefault()
  }

  return (
    <div className="absolute bottom-14 left-3 z-10 flex flex-col items-center rounded-md border border-slate-200 bg-white/95 p-1 text-slate-700 shadow">
      <svg
        ref={svgRef}
        width={SIZE}
        height={SIZE}
        viewBox={`${-HALF} ${-HALF} ${SIZE} ${SIZE}`}
        role="slider"
        tabIndex={0}
        aria-label={fr.compass.label}
        aria-valuemin={0}
        aria-valuemax={359}
        aria-valuenow={shown}
        aria-valuetext={fr.compass.value(shown)}
        className="cursor-grab touch-none select-none rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500 active:cursor-grabbing"
        onPointerDown={handleDown}
        onPointerMove={handleMove}
        onPointerUp={handleUp}
        onPointerCancel={() => setDragAngle(null)}
        onDoubleClick={() => updatePlanSettings({ northAngle: 0 })}
        onKeyDown={handleKey}
      >
        <title>{fr.compass.help}</title>
        <circle r={HALF - 2} fill="#f8fafc" stroke="#94a3b8" strokeWidth={1.5} />
        {/* Tout ce qui est dans ce groupe tourne avec le nord ; les lettres se redressent. */}
        <g transform={`rotate(${shown})`}>
          {TICKS.map((degrees) => (
            <line
              key={degrees}
              x1={0}
              y1={-(HALF - 3)}
              x2={0}
              y2={-(HALF - (degrees % 90 === 0 ? 10 : 7))}
              stroke="#64748b"
              strokeWidth={degrees % 90 === 0 ? 1.5 : 1}
              transform={`rotate(${degrees})`}
            />
          ))}
          {/* Aiguille : pointe rouge vers le nord, pointe grise vers le sud. */}
          <polygon points="0,-30 6,0 -6,0" fill="#dc2626" />
          <polygon points="0,30 6,0 -6,0" fill="#94a3b8" />
          <circle r={2.5} fill="#f8fafc" stroke="#475569" strokeWidth={1} />
          {CARDINALS.map(({ label, degrees, accent }) => {
            const radians = (degrees * Math.PI) / 180
            const x = LETTER_RADIUS * Math.sin(radians)
            const y = -LETTER_RADIUS * Math.cos(radians)
            return (
              <text
                key={label}
                x={x}
                y={y}
                transform={`rotate(${-shown} ${x} ${y})`}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={accent ? 13 : 11}
                fontWeight={accent ? 700 : 500}
                fill={accent ? '#dc2626' : '#334155'}
              >
                {label}
              </text>
            )
          })}
        </g>
      </svg>
      <span className="text-xs tabular-nums" aria-live="polite">
        {fr.compass.value(shown)}
      </span>
    </div>
  )
}
