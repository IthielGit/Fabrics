import { TriangleAlert } from 'lucide-react'
import { DEMO_FAULT, demoFaultLength } from '../../features/intro/heroModes'
import { formatLength } from '../../features/units/format'
import { fr } from '../../i18n/fr'

interface FaultPillProps {
  /** `stage` : posée en haut à droite de la scène (bureau) ; `flow` : sous la scène (téléphone). */
  placement: 'stage' | 'flow'
  onSee: () => void
}

/**
 * Pastille de contrôle avant export, avec les textes réels de l'application :
 * le constat, « Que faire » et « Voir sur le plan ».
 */
export default function FaultPill({ placement, onSee }: FaultPillProps) {
  const warnings = fr.measurements.warnings
  const position =
    placement === 'stage'
      ? 'absolute top-20 right-6 z-40 hidden w-[21rem] lg:block'
      : 'mt-4 lg:hidden'
  return (
    <div
      role="status"
      data-fault-pill
      className={`${position} rounded-2xl bg-white p-4 text-sm shadow-xl shadow-indigo-950/25 ring-1 ring-amber-300`}
    >
      <div className="flex gap-3">
        <TriangleAlert className="mt-0.5 size-5 shrink-0 text-amber-600" aria-hidden="true" />
        <div>
          <p className="font-medium text-slate-900">
            {warnings.wallOverlap(DEMO_FAULT.firstWall, DEMO_FAULT.secondWall, formatLength(demoFaultLength()))}
          </p>
          <p className="mt-1.5 leading-snug text-slate-600">
            <span className="font-medium text-slate-800">{warnings.whatToDo}</span> {warnings.advice.wallOverlap}
          </p>
          <button
            type="button"
            onClick={onSee}
            className="mt-3 inline-flex h-9 items-center rounded-lg bg-indigo-600 px-3 text-sm font-medium text-white transition-[transform,background-color] duration-150 ease-out-strong hover:bg-indigo-700 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            {warnings.seeOnPlan}
          </button>
        </div>
      </div>
    </div>
  )
}
