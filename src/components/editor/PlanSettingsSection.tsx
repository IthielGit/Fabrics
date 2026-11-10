import { normalizeNorthAngle } from '../../features/building/north'
import { fr } from '../../i18n/fr'
import { useEditorStore } from '../../stores/editorStore'
import NumberField from '../ui/NumberField'

const PRINT_SCALES = [20, 50, 100, 200]
const GRID_SIZES_MM = [50, 100, 200, 500, 1000]

const SELECT_CLASS =
  'w-28 rounded-md border border-slate-300 px-2 py-1 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none'

/** Valeurs proposées, plus la valeur actuelle si elle n'y figure pas (plan venu d'ailleurs). */
function withCurrent(options: number[], current: number): number[] {
  return options.includes(current) ? options : [...options, current].sort((a, b) => a - b)
}

/** Réglages du plan, affichés dans « Propriétés » quand rien n'est sélectionné. */
export default function PlanSettingsSection() {
  const plan = useEditorStore((state) => state.project?.document.plan)
  const updatePlanSettings = useEditorStore((state) => state.updatePlanSettings)
  if (!plan) return null

  return (
    <div className="mt-4 space-y-3 border-t border-slate-200 pt-4">
      <h3 className="text-sm font-semibold text-slate-900">{fr.planSettings.title}</h3>

      <div className="flex items-center justify-between gap-2">
        <label htmlFor="print-scale" className="text-sm text-slate-600">
          {fr.planSettings.printScale}
        </label>
        <select
          id="print-scale"
          value={plan.scale}
          onChange={(event) => updatePlanSettings({ scale: Number(event.target.value) })}
          className={SELECT_CLASS}
        >
          {withCurrent(PRINT_SCALES, plan.scale).map((scale) => (
            <option key={scale} value={scale}>
              {fr.planSettings.printScaleOption(scale)}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center justify-between gap-2">
        <label htmlFor="grid-size" className="text-sm text-slate-600">
          {fr.planSettings.gridSize}
        </label>
        <select
          id="grid-size"
          value={plan.gridSize}
          onChange={(event) => updatePlanSettings({ gridSize: Number(event.target.value) })}
          className={SELECT_CLASS}
        >
          {withCurrent(GRID_SIZES_MM, plan.gridSize).map((mm) => (
            <option key={mm} value={mm}>
              {fr.planSettings.gridSizeOption(mm)}
            </option>
          ))}
        </select>
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-600">
        <input
          type="checkbox"
          checked={plan.snapToGrid}
          onChange={(event) => updatePlanSettings({ snapToGrid: event.target.checked })}
        />
        {fr.planSettings.snapToGrid}
      </label>

      <NumberField
        label={fr.planSettings.wallThickness}
        suffix={fr.planSettings.unitMm}
        value={plan.defaultWallThickness}
        step={10}
        onCommit={(mm) => updatePlanSettings({ defaultWallThickness: Math.max(1, mm) })}
      />

      <NumberField
        label={fr.planSettings.northAngle}
        suffix={fr.planSettings.unitDegrees}
        value={plan.northAngle}
        step={15}
        onCommit={(degrees) => updatePlanSettings({ northAngle: normalizeNorthAngle(degrees) })}
      />
    </div>
  )
}
