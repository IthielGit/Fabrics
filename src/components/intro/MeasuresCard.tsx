import { totalDemoArea, type DemoRoomId, type DemoRoomMeasure } from '../../features/intro/demoPlan'
import { countedValue } from '../../features/intro/heroModes'
import { formatArea } from '../../features/units/format'
import { fr } from '../../i18n/fr'

interface MeasuresCardProps {
  measures: readonly DemoRoomMeasure[]
  className?: string
  /** Progression du compte animé, de 0 à 1 (1 = valeurs exactes). */
  progress?: number
  /** Pièce mise en avant pendant la démonstration. */
  activeId?: DemoRoomId | null
  /** Export bloqué par le contrôle : seule l'étiquette change, ce n'est pas un bouton. */
  blocked?: boolean
}

/** Carte des métrés du plan de démonstration : la seule version lisible des chiffres. */
export default function MeasuresCard({
  measures,
  className = '',
  progress = 1,
  activeId = null,
  blocked = false,
}: MeasuresCardProps) {
  return (
    <div className={`rounded-2xl bg-white/95 p-4 text-slate-700 backdrop-blur-sm ${className}`}>
      <p className="text-xs font-semibold tracking-wide text-slate-600 uppercase">{fr.intro.measuresTitle}</p>
      <dl className="mt-2 text-sm">
        {measures.map((room) => (
          <div
            key={room.id}
            className={`-mx-2 flex items-baseline justify-between gap-4 rounded-lg px-2 py-1 transition-colors duration-300 ${
              activeId === room.id ? 'bg-indigo-100 text-indigo-950' : ''
            }`}
          >
            <dt>{fr.intro.rooms[room.id]}</dt>
            <dd className="text-right text-slate-900 tabular-nums">
              {formatArea(countedValue(room.areaMm2, progress))}
            </dd>
          </div>
        ))}
        <div className="mt-1 flex items-baseline justify-between gap-4 border-t border-slate-200 pt-2 font-semibold text-slate-900">
          <dt>{fr.intro.totalArea}</dt>
          <dd className="text-right text-indigo-700 tabular-nums">
            {formatArea(countedValue(totalDemoArea(measures), progress))}
          </dd>
        </div>
      </dl>
      <p
        className={`mt-3 flex items-center gap-2 text-xs font-medium transition-colors duration-300 ${
          blocked ? 'text-amber-800' : 'text-slate-500'
        }`}
      >
        <span className="relative flex size-2">
          {!blocked && (
            <span aria-hidden="true" className="absolute inset-0 rounded-full bg-emerald-500 motion-safe:animate-[invite_2.4s_var(--ease-out-strong)_infinite]" />
          )}
          <span
            aria-hidden="true"
            className={`relative size-2 rounded-full transition-colors duration-300 ${blocked ? 'bg-amber-500' : 'bg-emerald-500'}`}
          />
        </span>
        {blocked ? fr.intro.exportBlocked : fr.intro.exportReady}
      </p>
    </div>
  )
}
