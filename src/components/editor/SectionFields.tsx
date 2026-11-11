import { ArrowLeftRight } from 'lucide-react'
import { pointDistance } from '../../features/geometry/polygon'
import { sectionTitle } from '../../features/geometry/sections'
import { formatLength } from '../../features/units/format'
import { fr } from '../../i18n/fr'
import { useEditorStore } from '../../stores/editorStore'
import type { SectionLineElement } from '../../types/document'
import TextField from '../ui/TextField'

/** Longueur maximale d'un repère de coupe (tient dans la bulle). */
const SECTION_LABEL_MAX_LENGTH = 4

/** Réglages d'une ligne de coupe : repère (A, B…), sens de vue et longueur. */
export default function SectionFields({ element }: { element: SectionLineElement }) {
  const updateElements = useEditorStore((state) => state.updateElements)
  const patch = (change: (el: SectionLineElement) => SectionLineElement) =>
    updateElements([element.id], (el) => (el.type === 'section' ? change(el) : el))

  return (
    <>
      {/* Le nom d'une coupe suit son repère (« Coupe A–A »). */}
      <TextField
        label={fr.properties.sectionLabel}
        value={element.label}
        maxLength={SECTION_LABEL_MAX_LENGTH}
        onCommit={(label) =>
          patch((el) => ({ ...el, label, name: `${fr.elements.section} ${sectionTitle(label)}` }))
        }
      />
      <button
        type="button"
        onClick={() => patch((el) => ({ ...el, lookLeft: !el.lookLeft }))}
        className="flex w-full items-center justify-center gap-2 rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
      >
        <ArrowLeftRight size={16} aria-hidden="true" />
        {fr.properties.sectionFlip}
      </button>
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-600">{fr.properties.length}</span>
        <span className="font-medium text-slate-900">
          {formatLength(
            pointDistance(
              { x: element.points[0], y: element.points[1] },
              { x: element.points[2], y: element.points[3] },
            ),
          )}
        </span>
      </div>
      <p className="text-xs text-slate-500">{fr.properties.sectionHint}</p>
    </>
  )
}
