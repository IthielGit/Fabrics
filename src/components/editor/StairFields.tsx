import clsx from 'clsx'
import { formatLength } from '../../features/units/format'
import { defaultStairLengths, stairStatus } from '../../features/stairs/stairs'
import { fr } from '../../i18n/fr'
import { useEditorStore } from '../../stores/editorStore'
import type { StairElement } from '../../types/document'
import NumberField from '../ui/NumberField'
import TextField from '../ui/TextField'

const SHAPES: StairElement['shape'][] = ['straight', 'l', 'u']

function Measure({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-600">{label}</span>
      <span className="font-medium text-slate-900">{value}</span>
    </div>
  )
}

/** Réglages d'un escalier : forme, dimensions, trémie, et ses marches calculées. */
export default function StairFields({ element }: { element: StairElement }) {
  const updateElements = useEditorStore((state) => state.updateElements)
  const levels = useEditorStore((state) => state.project?.document.levels)
  const patch = (change: (el: StairElement) => StairElement) =>
    updateElements([element.id], (el) => (el.type === 'stair' ? change(el) : el))

  const status = stairStatus(element, levels)
  const twoFlights = element.shape !== 'straight'

  /** Change de forme : les longueurs sont recalculées pour la hauteur à monter. */
  const changeShape = (shape: StairElement['shape']) => {
    if (shape === element.shape) return
    const rise = status.kind === 'no-level-above' ? 0 : status.rise
    const lengths = rise > 0 ? defaultStairLengths(shape, rise) : { length: element.length }
    patch((el) => {
      const { length2: _l2, gap: _gap, ...rest } = el
      void _l2
      void _gap
      return {
        ...rest,
        shape,
        length: lengths.length,
        ...(shape !== 'straight' ? { length2: lengths.length2 ?? el.length2 ?? lengths.length } : {}),
        ...(shape === 'u' ? { gap: lengths.gap ?? el.gap ?? 100 } : {}),
      }
    })
  }

  return (
    <>
      <TextField
        label={fr.properties.name}
        value={element.name}
        onCommit={(name) => patch((el) => ({ ...el, name }))}
      />

      <div>
        <p className="mb-1 text-xs text-slate-500">{fr.stairs.shape}</p>
        <div className="flex gap-1">
          {SHAPES.map((shape) => (
            <button
              key={shape}
              type="button"
              aria-pressed={element.shape === shape}
              onClick={() => changeShape(shape)}
              className={clsx(
                'flex-1 rounded-md border px-2 py-1 text-xs',
                element.shape === shape
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                  : 'border-slate-300 text-slate-700 hover:bg-slate-100',
              )}
            >
              {fr.stairs.shapes[shape]}
            </button>
          ))}
        </div>
      </div>

      <NumberField
        label={fr.stairs.width}
        suffix={fr.properties.unitMm}
        value={element.width}
        step={50}
        onCommit={(mm) => patch((el) => ({ ...el, width: Math.max(300, Math.round(mm)) }))}
      />
      <NumberField
        label={twoFlights ? fr.stairs.length1 : fr.stairs.length}
        suffix={fr.properties.unitMm}
        value={element.length}
        step={50}
        onCommit={(mm) => patch((el) => ({ ...el, length: Math.max(250, Math.round(mm)) }))}
      />
      {twoFlights && (
        <NumberField
          label={fr.stairs.length2}
          suffix={fr.properties.unitMm}
          value={element.length2 ?? element.length}
          step={50}
          onCommit={(mm) => patch((el) => ({ ...el, length2: Math.max(250, Math.round(mm)) }))}
        />
      )}
      {element.shape === 'u' && (
        <NumberField
          label={fr.stairs.gap}
          suffix={fr.properties.unitMm}
          value={element.gap ?? 0}
          step={10}
          onCommit={(mm) => patch((el) => ({ ...el, gap: Math.max(0, Math.round(mm)) }))}
        />
      )}
      {twoFlights && (
        <button
          type="button"
          aria-pressed={element.mirrored === true}
          onClick={() => patch((el) => ({ ...el, mirrored: !el.mirrored }))}
          className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm text-slate-700 hover:bg-slate-100"
        >
          {fr.stairs.mirror}
        </button>
      )}
      <NumberField
        label={fr.stairs.voidMargin}
        suffix={fr.properties.unitMm}
        value={element.voidMargin}
        step={10}
        onCommit={(mm) => patch((el) => ({ ...el, voidMargin: Math.max(0, Math.round(mm)) }))}
      />

      <div className="space-y-1 rounded-md bg-slate-50 p-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {fr.properties.measures}
        </p>
        {status.kind === 'no-level-above' ? (
          <p className="text-sm text-red-700">{fr.stairs.noLevelAbove}</p>
        ) : (
          <>
            <Measure label={fr.stairs.rise} value={formatLength(status.rise)} />
            <Measure label={fr.stairs.risers} value={String(status.steps.risers)} />
            <Measure label={fr.stairs.riserHeight} value={formatLength(status.steps.riserHeight)} />
            <Measure label={fr.stairs.treads} value={String(status.steps.treads)} />
            <Measure label={fr.stairs.treadDepth} value={formatLength(status.steps.treadDepth)} />
            {status.kind === 'too-short' && (
              <p className="pt-1 text-sm font-medium text-red-700">
                {fr.stairs.tooShort(Math.ceil(status.steps.requiredRun))}
              </p>
            )}
          </>
        )}
      </div>
      <p className="text-xs text-slate-500">{fr.stairs.hint}</p>
    </>
  )
}
