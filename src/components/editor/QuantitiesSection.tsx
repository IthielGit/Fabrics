import { ChevronDown } from 'lucide-react'
import { Fragment, useMemo, useState } from 'react'
import type { BuildingMeasurements } from '../../features/measurements/measurements'
import { computeQuantities } from '../../features/measurements/quantities/quantitySet'
import { deductionsText, elementName, inputsText, ruleText, valueText } from '../../features/measurements/quantities/quantityTable'
import { fr } from '../../i18n/fr'
import { useEditorStore } from '../../stores/editorStore'

const HEAD = 'px-1 py-1 text-left text-xs font-medium text-slate-600'
const NUMBER = 'whitespace-nowrap px-1 py-1 text-right tabular-nums'

/**
 * Quantitatif traçable du niveau affiché (M21, 21.3) : chaque quantité de métré ; un clic ouvre son
 * détail (sources, dimensions, formule, déductions, règle et version) et sélectionne l'élément.
 */
export default function QuantitiesSection({ building, levelId }: { building: BuildingMeasurements; levelId: string | null }) {
  const document = useEditorStore((state) => state.project?.document)
  const scene = useEditorStore((state) => state.project?.scene ?? null)
  const setSelection = useEditorStore((state) => state.setSelection)
  const [openKey, setOpenKey] = useState<string | null>(null)
  const quantities = useMemo(
    () => (document ? computeQuantities({ document, scene, building }).takeoff : []),
    [document, scene, building],
  )
  const t = fr.measurements.quantities
  const levelNames = new Map(building.levels.map((entry) => [entry.level.id, entry.level.name]))
  const levelName = (id: string) => levelNames.get(id) ?? ''
  const shown = quantities.filter((q) => q.levelId === levelId)
  if (shown.length === 0) return null

  return (
    <details className="group mt-4 border-t border-slate-200 pt-4">
      <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-slate-900">
        {t.title}
        <ChevronDown size={16} aria-hidden="true" className="transition-transform group-open:rotate-180" />
      </summary>
      <p className="mt-2 text-xs leading-relaxed text-slate-600">{t.note}</p>
      <table className="mt-2 w-full text-sm">
        <thead>
          <tr>
            <th className={HEAD}>{t.columns.element}</th>
            <th className={HEAD}>{t.columns.quantity}</th>
            <th className={`${HEAD} text-right`}>{t.columns.value}</th>
          </tr>
        </thead>
        <tbody>
          {shown.map((q) => {
            const open = openKey === q.key
            const deductions = deductionsText(q, t)
            return (
              <Fragment key={q.key}>
                <tr
                  className={`cursor-pointer border-t border-slate-100 hover:bg-slate-50 ${open ? 'bg-indigo-50' : ''}`}
                  aria-expanded={open}
                  onClick={() => {
                    setOpenKey(open ? null : q.key)
                    if (q.partId !== 'levelSlab') setSelection([q.elementIds[0]])
                  }}
                >
                  <td className="px-1 py-1">{elementName(q, t, levelName)}</td>
                  <td className="px-1 py-1 text-slate-700">{t.codes[q.code]}</td>
                  <td className={NUMBER}>{valueText(q.value, q.dimension, t)}</td>
                </tr>
                {open && (
                  <tr className="bg-indigo-50/50">
                    <td colSpan={3} className="px-2 pb-2 text-xs leading-relaxed text-slate-700">
                      <dl className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5">
                        <dt className="font-medium">{t.columns.sources}</dt>
                        <dd>{q.trace.sources.map((s) => s.name).join(', ')}</dd>
                        <dt className="font-medium">{t.columns.inputs}</dt>
                        <dd>{inputsText(q.trace.inputs, t)}</dd>
                        <dt className="font-medium">{t.columns.formula}</dt>
                        <dd>{t.formulas[q.code]}</dd>
                        {deductions && (
                          <>
                            <dt className="font-medium">{t.columns.deductions}</dt>
                            <dd>{deductions}</dd>
                          </>
                        )}
                        <dt className="font-medium">{t.columns.rule}</dt>
                        <dd>
                          {ruleText(q, t)} · {q.rule.version}
                        </dd>
                      </dl>
                    </td>
                  </tr>
                )}
              </Fragment>
            )
          })}
        </tbody>
      </table>
    </details>
  )
}
