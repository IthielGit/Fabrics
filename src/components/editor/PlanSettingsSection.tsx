import { cmToMm, mmToCm } from '../../features/units/format'
import { fr } from '../../i18n/fr'
import { useEditorStore } from '../../stores/editorStore'
import NumberField from '../ui/NumberField'

const PRINT_SCALES = [20, 50, 100, 200]
const GRID_SIZES_CM = [5, 10, 20, 50, 100]

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

  const gridSizeCm = mmToCm(plan.gridSize)

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
          value={gridSizeCm}
          onChange={(event) => updatePlanSettings({ gridSize: cmToMm(Number(event.target.value)) })}
          className={SELECT_CLASS}
        >
          {withCurrent(GRID_SIZES_CM, gridSizeCm).map((cm) => (
            <option key={cm} value={cm}>
              {fr.planSettings.gridSizeOption(cm)}
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
        suffix={fr.planSettings.unitCm}
        value={mmToCm(plan.defaultWallThickness)}
        onCommit={(cm) => updatePlanSettings({ defaultWallThickness: cmToMm(Math.max(1, cm)) })}
      />
      <NumberField
        label={fr.planSettings.wallHeight}
        suffix={fr.planSettings.unitCm}
        value={mmToCm(plan.defaultWallHeight)}
        step={5}
        onCommit={(cm) => updatePlanSettings({ defaultWallHeight: cmToMm(Math.max(1, cm)) })}
      />
    </div>
  )
}
