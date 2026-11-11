import { fr } from '../../i18n/fr'
import { useEditorStore } from '../../stores/editorStore'
import type { ChimneyElement } from '../../types/document'
import NumberField from '../ui/NumberField'
import TextField from '../ui/TextField'

/** Réglages d'une cheminée : nom, dimensions du conduit et dépassement au-dessus du dernier niveau. */
export default function ChimneyFields({ element }: { element: ChimneyElement }) {
  const updateElements = useEditorStore((state) => state.updateElements)
  const patch = (change: (el: ChimneyElement) => ChimneyElement) =>
    updateElements([element.id], (el) => (el.type === 'chimney' ? change(el) : el))

  return (
    <>
      <TextField
        label={fr.properties.name}
        value={element.name}
        onCommit={(name) => patch((el) => ({ ...el, name }))}
      />
      <NumberField
        label={fr.chimney.width}
        suffix={fr.properties.unitMm}
        value={element.width}
        step={50}
        onCommit={(mm) => patch((el) => ({ ...el, width: Math.max(100, Math.round(mm)) }))}
      />
      <NumberField
        label={fr.chimney.depth}
        suffix={fr.properties.unitMm}
        value={element.depth}
        step={50}
        onCommit={(mm) => patch((el) => ({ ...el, depth: Math.max(100, Math.round(mm)) }))}
      />
      <NumberField
        label={fr.chimney.heightAboveTop}
        suffix={fr.properties.unitMm}
        value={element.heightAboveTop}
        step={100}
        onCommit={(mm) => patch((el) => ({ ...el, heightAboveTop: Math.max(0, Math.round(mm)) }))}
      />
      <p className="text-xs text-slate-500">{fr.chimney.hint}</p>
    </>
  )
}
