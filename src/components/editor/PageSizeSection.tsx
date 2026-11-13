import clsx from 'clsx'
import { ChevronDown } from 'lucide-react'
import { DESIGN_PAGE_FORMATS, PLAN_PAGE_FORMATS, isSamePageSize } from '../../features/documents/pageSize'
import { fr } from '../../i18n/fr'
import { useEditorStore } from '../../stores/editorStore'
import NumberField from '../ui/NumberField'

/** Miniature proportionnelle d'un format (rectangle arrondi dans un cadre de 40 × 40). */
function FormatThumb({ width, height, active }: { width: number; height: number; active: boolean }) {
  const ratio = width / height
  const w = ratio >= 1 ? 40 : 40 * ratio
  const h = ratio >= 1 ? 40 / ratio : 40
  return (
    <span className="flex h-10 w-full items-center justify-center" aria-hidden="true">
      <span
        style={{ width: Math.max(w, 8), height: Math.max(h, 8) }}
        className={clsx('rounded-sm border-2', active ? 'border-indigo-500 bg-indigo-100' : 'border-indigo-300 bg-indigo-50')}
      />
    </span>
  )
}

/** Taille de la page (largeur, hauteur) et formats proposés, dans « Propriétés » quand rien n'est sélectionné. */
export default function PageSizeSection() {
  const page = useEditorStore((state) => state.project?.document.page)
  const unit = useEditorStore((state) => state.project?.document.unit)
  const setPageSize = useEditorStore((state) => state.setPageSize)
  if (!page || !unit) return null

  const isPlan = unit === 'mm'
  const suffix = isPlan ? fr.pageSize.unitMm : fr.pageSize.unitPx
  const formats = isPlan ? PLAN_PAGE_FORMATS : DESIGN_PAGE_FORMATS
  const nameOf = (id: string) => (fr.pageSize as Record<string, unknown>)[id] ?? (fr.formats as Record<string, unknown>)[id]
  const sizeText = isPlan ? fr.pageSize.sizeMm : fr.pageSize.sizePx

  return (
    // Pour un plan, la taille de la page se règle rarement : repliée, pour ne pas passer avant l'aide.
    <details open={!isPlan} className="group mt-4 border-t border-slate-200 pt-4">
      <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-slate-900">
        {fr.pageSize.title}
        <ChevronDown size={16} aria-hidden="true" className="transition-transform group-open:rotate-180" />
      </summary>
      <div className="mt-3 space-y-3">
      <NumberField
        label={fr.pageSize.width}
        suffix={suffix}
        value={page.width}
        step={isPlan ? 100 : 10}
        onCommit={(value) => setPageSize(value, page.height)}
      />
      <NumberField
        label={fr.pageSize.height}
        suffix={suffix}
        value={page.height}
        step={isPlan ? 100 : 10}
        onCommit={(value) => setPageSize(page.width, value)}
      />
      <p className="text-xs text-slate-500">{fr.pageSize.formats}</p>
      <ul className="grid grid-cols-2 gap-2">
        {formats.map((format) => {
          const active = isSamePageSize(format, page)
          return (
            <li key={format.id}>
              <button
                type="button"
                aria-pressed={active}
                onClick={() => setPageSize(format.width, format.height)}
                className={clsx(
                  'flex w-full flex-col items-center gap-1 rounded-md border p-2 text-center',
                  active ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:bg-slate-50',
                )}
              >
                <FormatThumb width={format.width} height={format.height} active={active} />
                <span className="text-xs font-medium text-slate-900">{String(nameOf(format.id))}</span>
                <span className="text-xs text-slate-600">{sizeText(format.width, format.height)}</span>
              </button>
            </li>
          )
        })}
      </ul>
      </div>
    </details>
  )
}
