import { getSymbol } from '../../features/library/catalog'
import { resizeSymbol } from '../../features/library/resize'
import { fr } from '../../i18n/fr'
import { useEditorStore } from '../../stores/editorStore'
import type { FurnitureElement } from '../../types/document'
import NumberField from '../ui/NumberField'
import TextField from '../ui/TextField'

/** Réglages d'un objet de la bibliothèque : nom, largeur et profondeur (selon son mode), tailles courantes. */
export default function FurnitureFields({ element }: { element: FurnitureElement }) {
  const updateElements = useEditorStore((state) => state.updateElements)
  const setNotice = useEditorStore((state) => state.setNotice)
  const def = getSymbol(element.symbol)

  const patch = (change: (el: FurnitureElement) => FurnitureElement) =>
    updateElements([element.id], (el) => (el.type === 'furniture' ? change(el) : el))

  /** Applique une taille demandée, ramenée aux règles de l'objet ; prévient si elle a dû être limitée. */
  const resizeTo = (width: number, depth: number) => {
    if (!def) return
    const current = { width: element.width, depth: element.depth }
    const size = resizeSymbol(def, { width, depth }, current)
    if (size.width !== Math.round(width) && def.resize !== 'ratio') {
      setNotice(fr.properties.furnitureLimits(def.min.width, def.max.width))
    } else if (size.depth !== Math.round(depth) && def.resize === 'free') {
      setNotice(fr.properties.furnitureLimits(def.min.depth, def.max.depth))
    }
    patch((el) => ({ ...el, ...size }))
  }

  const editable = def !== undefined && def.resize !== 'fixed'
  const showDepth = def !== undefined && (def.resize === 'free' || def.resize === 'ratio')

  return (
    <>
      <TextField
        label={fr.properties.name}
        value={element.name}
        onCommit={(name) => patch((el) => ({ ...el, name }))}
      />
      {editable && (
        <NumberField
          label={fr.properties.furnitureWidth}
          suffix={fr.properties.unitMm}
          value={element.width}
          step={10}
          onCommit={(mm) => resizeTo(mm, element.depth)}
        />
      )}
      {editable && showDepth && (
        <NumberField
          label={fr.properties.furnitureDepth}
          suffix={fr.properties.unitMm}
          value={element.depth}
          step={10}
          onCommit={(mm) => resizeTo(element.width, mm)}
        />
      )}
      {def && !editable && (
        <p className="text-xs text-slate-500">{fr.properties.furnitureFixedSize}</p>
      )}
      {editable && def.sizes && def.sizes.length > 0 && (
        <div>
          <p className="mb-1 text-xs text-slate-500">{fr.properties.furnitureSizes}</p>
          <div className="flex flex-wrap gap-1">
            {def.sizes.map((option) => (
              <button
                key={option.label}
                type="button"
                onClick={() => resizeTo(option.width, option.depth)}
                className="rounded-md border border-slate-300 px-2 py-0.5 text-xs text-slate-700 hover:bg-slate-100"
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
      {!def && <p className="text-xs text-red-600">{fr.library.unknownSymbol}</p>}
    </>
  )
}
