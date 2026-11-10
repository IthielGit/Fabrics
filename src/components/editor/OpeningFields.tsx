import { useId } from 'react'
import {
  changeOpeningKind,
  changeOpeningKindAndSize,
  flipHinge,
  flipSide,
  resizeOpening,
} from '../../features/geometry/openingEdit'
import { openingArea } from '../../features/geometry/openings'
import { formatArea } from '../../features/units/format'
import { fr } from '../../i18n/fr'
import { useEditorStore } from '../../stores/editorStore'
import type { OpeningElement } from '../../types/document'
import NumberField from '../ui/NumberField'
import TextField from '../ui/TextField'

const KINDS: OpeningElement['kind'][] = ['door', 'window', 'bay']

const ACTION_BUTTON =
  'w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50'

/** Réglages d'une ouverture : nom, type, dimensions, allège, sens d'ouverture d'une porte. */
export default function OpeningFields({ element }: { element: OpeningElement }) {
  const kindId = useId()
  const updateElements = useEditorStore((state) => state.updateElements)
  const setNotice = useEditorStore((state) => state.setNotice)
  const wall = useEditorStore((state) => {
    const found = state.project?.document.elements.find((el) => el.id === element.wallId)
    return found?.type === 'wall' ? found : undefined
  })

  const patch = (change: (opening: OpeningElement) => OpeningElement) =>
    updateElements([element.id], (el) => (el.type === 'opening' ? change(el) : el))

  /** Largeur, hauteur ou allège : refusé avec un message si l'ouverture ne tient plus. */
  const resize = (change: Partial<Pick<OpeningElement, 'width' | 'height' | 'sillHeight'>>) => {
    if (!wall) return
    const elements = useEditorStore.getState().project?.document.elements ?? []
    const openings = elements.filter((el): el is OpeningElement => el.type === 'opening')
    const result = resizeOpening(element, change, wall, openings)
    if ('problem' in result) {
      setNotice(result.problem === 'too-tall' ? fr.notices.openingTooTall : fr.notices.openingNoRoom)
      return
    }
    setNotice(null)
    patch(() => result.opening)
  }

  return (
    <>
      <TextField
        label={fr.properties.name}
        value={element.name}
        onCommit={(name) => patch((el) => ({ ...el, name }))}
      />

      <div className="flex items-center justify-between gap-2">
        <label htmlFor={kindId} className="text-sm text-slate-600">
          {fr.properties.openingKind}
        </label>
        <select
          id={kindId}
          value={element.kind}
          onChange={(event) => {
            const kind = event.target.value as OpeningElement['kind']
            const elements = useEditorStore.getState().project?.document.elements ?? []
            const openings = elements.filter((el): el is OpeningElement => el.type === 'opening')
            patch((el) =>
              wall
                ? changeOpeningKindAndSize(el, kind, wall, openings)
                : changeOpeningKind(el, kind, Infinity),
            )
          }}
          className="w-36 rounded-md border border-slate-300 px-2 py-1 text-sm text-slate-900"
        >
          {KINDS.map((kind) => (
            <option key={kind} value={kind}>
              {fr.elements[kind]}
            </option>
          ))}
        </select>
      </div>

      <NumberField
        label={fr.properties.width}
        suffix={fr.properties.unitMm}
        value={element.width}
        step={50}
        onCommit={(width) => resize({ width })}
      />
      <NumberField
        label={fr.properties.height}
        suffix={fr.properties.unitMm}
        value={element.height}
        step={50}
        onCommit={(height) => resize({ height })}
      />
      {element.kind !== 'door' && (
        <NumberField
          label={fr.properties.sillHeight}
          suffix={fr.properties.unitMm}
          value={element.sillHeight}
          step={50}
          onCommit={(sillHeight) => resize({ sillHeight })}
        />
      )}

      {element.kind === 'door' && (
        <div className="space-y-1.5">
          <button type="button" className={ACTION_BUTTON} onClick={() => patch(flipHinge)}>
            {fr.properties.flipHinge}
          </button>
          <button type="button" className={ACTION_BUTTON} onClick={() => patch(flipSide)}>
            {fr.properties.flipSide}
          </button>
        </div>
      )}

      <div className="space-y-1 rounded-md bg-slate-50 p-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {fr.properties.measures}
        </p>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600">{fr.properties.area}</span>
          <span className="font-medium text-slate-900">{formatArea(openingArea(element))}</span>
        </div>
      </div>

      <p className="text-xs text-slate-500">{fr.properties.openingHint}</p>
    </>
  )
}
