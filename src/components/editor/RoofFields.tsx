import { useId } from 'react'
import { computeRoof, isPitched, MAX_PITCH, MIN_PITCH, pivotRidge } from '../../features/building/roof'
import { ROOF_DEFAULTS } from '../../features/documents/elements'
import { formatArea, formatLength } from '../../features/units/format'
import { fr } from '../../i18n/fr'
import { useEditorStore } from '../../stores/editorStore'
import type { RoofElement, RoofShape } from '../../types/document'
import { ROOF_COVERINGS, withRoofCovering } from '../../features/building/materials'
import NumberField from '../ui/NumberField'
import TextField from '../ui/TextField'
import MaterialField from './MaterialField'

const SHAPES: readonly RoofShape[] = ['flat', 'shed', 'gable', 'hip']
const ACTION_BUTTON =
  'w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50'

function Measure({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2 text-sm">
      <span className="text-slate-600">{label}</span>
      <span className="font-medium text-slate-900">{value}</span>
    </div>
  )
}

/** Débord par défaut d'une forme (D41) : 500 mm pour un toit en pente, 0 pour un toit plat. */
const defaultOverhang = (shape: RoofShape) =>
  shape === 'flat' ? ROOF_DEFAULTS.flatOverhang : ROOF_DEFAULTS.overhang

/**
 * Réglages d'une toiture : nom, forme, pente (°), débord (mm), sens du faîtage, et ses mesures
 * calculées (hauteur et altitude du faîtage, surfaces, longueurs, pignons). Un message explique
 * pourquoi une toiture n'est pas valable (toit en pente sur un contour non rectangulaire…).
 */
export default function RoofFields({ element }: { element: RoofElement }) {
  const shapeId = useId()
  const updateElements = useEditorStore((state) => state.updateElements)
  const level = useEditorStore((state) =>
    state.project?.document.levels?.find((l) => l.id === element.levelId),
  )
  const patch = (change: (el: RoofElement) => RoofElement) =>
    updateElements([element.id], (el) => (el.type === 'roof' ? change(el) : el))

  const baseY = level ? level.elevation + level.height : 0
  const result = computeRoof(element, baseY)
  const geometry = 'geometry' in result ? result.geometry : null
  const pitched = isPitched(element.shape)

  return (
    <>
      <TextField
        label={fr.properties.name}
        value={element.name}
        onCommit={(name) => patch((el) => ({ ...el, name }))}
      />

      <div className="flex items-center justify-between gap-2">
        <label htmlFor={shapeId} className="text-sm text-slate-600">
          {fr.roof.shape}
        </label>
        <select
          id={shapeId}
          value={element.shape}
          onChange={(event) => {
            const shape = event.target.value as RoofShape
            patch((el) => ({
              ...el,
              shape,
              // Un débord encore à sa valeur par défaut suit celle de la nouvelle forme.
              overhang: el.overhang === defaultOverhang(el.shape) ? defaultOverhang(shape) : el.overhang,
            }))
          }}
          className="w-36 rounded-md border border-slate-300 px-2 py-1 text-sm text-slate-900"
        >
          {SHAPES.map((shape) => (
            <option key={shape} value={shape}>
              {fr.roof.shapes[shape]}
            </option>
          ))}
        </select>
      </div>

      {pitched && (
        <NumberField
          label={fr.roof.pitch}
          suffix={fr.roof.unitDegrees}
          value={element.pitch}
          step={1}
          onCommit={(degrees) =>
            patch((el) => ({
              ...el,
              pitch: Math.min(MAX_PITCH, Math.max(MIN_PITCH, Math.round(degrees * 10) / 10)),
            }))
          }
        />
      )}
      <NumberField
        label={fr.roof.overhang}
        suffix={fr.properties.unitMm}
        value={element.overhang}
        step={50}
        onCommit={(mm) => patch((el) => ({ ...el, overhang: Math.max(0, Math.round(mm)) }))}
      />

      <MaterialField
        label={fr.materials.roofCovering}
        options={ROOF_COVERINGS}
        optionLabels={fr.materials.coverings}
        value={element.covering}
        onChange={(covering) => patch((el) => withRoofCovering(el, covering))}
      />

      {(element.shape === 'gable' || element.shape === 'shed') && (
        <button
          type="button"
          className={ACTION_BUTTON}
          onClick={() => patch((el) => ({ ...el, ridgeEdge: pivotRidge(el.ridgeEdge) }))}
        >
          {element.shape === 'gable' ? fr.roof.pivotRidge : fr.roof.pivotHighSide}
        </button>
      )}
      {element.shape === 'hip' && <p className="text-xs text-slate-500">{fr.roof.hipHint}</p>}

      {'problem' in result && (
        <p role="alert" className="rounded-md bg-red-50 p-2 text-sm text-red-700">
          {fr.roof.problems[result.problem]}
        </p>
      )}

      {geometry && (
        <div className="space-y-1 rounded-md bg-slate-50 p-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {fr.properties.measures}
          </p>
          {pitched && (
            <>
              <Measure
                label={element.shape === 'shed' ? fr.roof.highPointHeight : fr.roof.ridgeHeight}
                value={formatLength(Math.round(geometry.ridgeHeight))}
              />
              <Measure label={fr.roof.ridgeAltitude} value={formatLength(Math.round(geometry.ridgeY))} />
            </>
          )}
          <Measure label={fr.roof.realArea} value={formatArea(geometry.realArea)} />
          {pitched && <Measure label={fr.roof.projectedArea} value={formatArea(geometry.projectedArea)} />}
          {geometry.ridgeLength > 0 && (
            <Measure label={fr.roof.ridgeLength} value={formatLength(Math.round(geometry.ridgeLength))} />
          )}
          {geometry.eaveLength > 0 && (
            <Measure label={fr.roof.eaveLength} value={formatLength(Math.round(geometry.eaveLength))} />
          )}
          {geometry.hipLength > 0 && (
            <Measure label={fr.roof.hipLength} value={formatLength(Math.round(geometry.hipLength))} />
          )}
          {pitched && <Measure label={fr.roof.gables} value={String(geometry.gableCount)} />}
        </div>
      )}
      {pitched && <p className="text-xs text-slate-500">{fr.roof.heightHint}</p>}
      <p className="text-xs text-slate-500">{pitched ? fr.roof.cornerHint : fr.properties.vertexHint}</p>
    </>
  )
}
