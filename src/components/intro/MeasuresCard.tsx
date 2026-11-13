import { totalDemoArea, type DemoRoomMeasure } from '../../features/intro/demoPlan'
import { formatArea } from '../../features/units/format'
import { fr } from '../../i18n/fr'

interface MeasuresCardProps {
  measures: readonly DemoRoomMeasure[]
  className?: string
}

/** Carte des métrés du plan de démonstration : la seule version lisible des chiffres. */
export default function MeasuresCard({ measures, className = '' }: MeasuresCardProps) {
  return (
    <div className={`rounded-2xl bg-white p-4 text-slate-700 ${className}`}>
      <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">{fr.intro.measuresTitle}</p>
      <dl className="mt-2 text-sm">
        {measures.map((room) => (
          <div key={room.id} className="flex items-baseline justify-between gap-4 py-1">
            <dt>{fr.intro.rooms[room.id]}</dt>
            <dd className="text-right text-slate-900 tabular-nums">{formatArea(room.areaMm2)}</dd>
          </div>
        ))}
        <div className="mt-1 flex items-baseline justify-between gap-4 border-t border-slate-200 pt-2 font-semibold text-slate-900">
          <dt>{fr.intro.totalArea}</dt>
          <dd className="text-right text-indigo-700 tabular-nums">{formatArea(totalDemoArea(measures))}</dd>
        </div>
      </dl>
    </div>
  )
}
