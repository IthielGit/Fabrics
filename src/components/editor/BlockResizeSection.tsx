import { blockReference } from '../../features/geometry/resizeBlock'
import { fr } from '../../i18n/fr'
import { useEditorStore } from '../../stores/editorStore'
import NumberField from '../ui/NumberField'

/**
 * « Redimensionner l'ensemble » : largeur et profondeur d'un bloc (une pièce préfabriquée, ou une
 * pièce avec ses murs). Murs, sol et cotes s'étirent ; ouvertures et meubles gardent leur taille.
 * Visible quand la sélection contient au moins un mur ou une pièce.
 */
export default function BlockResizeSection() {
  const elements = useEditorStore((state) => state.project?.document.elements)
  const selectedIds = useEditorStore((state) => state.selectedIds)
  const resize = useEditorStore((state) => state.resizeSelectionBlock)
  const setNotice = useEditorStore((state) => state.setNotice)

  const selection = (elements ?? []).filter((el) => selectedIds.includes(el.id))
  const reference = blockReference(selection)
  if (!reference) return null

  const apply = (width: number, depth: number) => {
    const removed = resize(width, depth)
    if (removed === null) setNotice(fr.blockResize.invalid)
    else if (removed > 0) setNotice(fr.blockResize.removed(removed))
  }

  return (
    <div className="mt-4 space-y-3 border-t border-slate-200 pt-4">
      <h3 className="text-sm font-semibold text-slate-900">{fr.blockResize.title}</h3>
      <NumberField
        label={fr.blockResize.width}
        suffix={fr.properties.unitMm}
        value={Math.round(reference.width)}
        step={100}
        onCommit={(mm) => apply(mm, reference.height)}
      />
      <NumberField
        label={fr.blockResize.depth}
        suffix={fr.properties.unitMm}
        value={Math.round(reference.height)}
        step={100}
        onCommit={(mm) => apply(reference.width, mm)}
      />
      <p className="text-xs text-slate-500">{fr.blockResize.hint}</p>
    </div>
  )
}
