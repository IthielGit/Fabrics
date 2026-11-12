import { pointDistance } from '../../features/geometry/polygon'
import { computeBuildingMeasurements } from '../../features/measurements/measurements'
import { formatArea, formatLength } from '../../features/units/format'
import { fr } from '../../i18n/fr'
import { useEditorStore } from '../../stores/editorStore'
import type { AxisElement, DimensionElement, RoomElement, WallElement } from '../../types/document'
import { WALL_MATERIALS, withWallMaterial } from '../../features/building/materials'
import { canSplitWall } from '../../features/geometry/splitWall'
import NumberField from '../ui/NumberField'
import TextField from '../ui/TextField'
import DimensionVisibilityField from './DimensionVisibilityField'
import MaterialField from './MaterialField'
import { autoNameFieldProps, useDisplayNames } from './useDisplayNames'

type PlanElement = WallElement | RoomElement | DimensionElement | AxisElement

/** Longueur maximale d'un repère d'axe (tient dans la bulle). */
const AXIS_LABEL_MAX_LENGTH = 4

/** Une ligne « intitulé : valeur » en lecture seule. */
function Measure({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-600">{label}</span>
      <span className="font-medium text-slate-900">{value}</span>
    </div>
  )
}

/** Réglages propres à un mur, une pièce ou une cote (nom, épaisseur, hauteur, décalage…) et leurs mesures. */
export default function PlanElementFields({ element }: { element: PlanElement }) {
  const updateElements = useEditorStore((state) => state.updateElements)
  const splitWall = useEditorStore((state) => state.splitWall)
  const setNotice = useEditorStore((state) => state.setNotice)
  const elements = useEditorStore((state) => state.project?.document.elements)
  const levels = useEditorStore((state) => state.project?.document.levels)
  const names = useDisplayNames()
  const patch = (change: (el: PlanElement) => PlanElement) =>
    updateElements([element.id], (el) =>
      el.type === 'wall' || el.type === 'room' || el.type === 'dimension' || el.type === 'axis'
        ? change(el)
        : el,
    )

  // Tous les éléments : la surface nette d'un mur tient compte de ses ouvertures.
  // (et celle d'une pièce, de la trémie d'un escalier qui arrive du niveau du dessous).
  const measures = computeBuildingMeasurements({ elements: elements ?? [element], levels }).total
  const room = measures.rooms.find((r) => r.id === element.id)
  const wall = measures.walls.find((w) => w.id === element.id)

  return (
    <>
      {element.type === 'axis' ? (
        // Le nom d'un axe suit son repère (« Axe C »).
        <TextField
          label={fr.properties.axisLabel}
          value={element.label}
          maxLength={AXIS_LABEL_MAX_LENGTH}
          onCommit={(label) =>
            patch((el) =>
              el.type === 'axis' ? { ...el, label, name: `${fr.elements.axis} ${label}` } : el,
            )
          }
        />
      ) : (
        <TextField
          label={fr.properties.name}
          {...autoNameFieldProps(element, names)}
          onCommit={(name) => patch((el) => ({ ...el, name }))}
        />
      )}

      {element.type === 'wall' && (
        <>
          <NumberField
            label={fr.properties.wallThickness}
            suffix={fr.properties.unitMm}
            value={element.thickness}
            step={10}
            onCommit={(mm) =>
              patch((el) => (el.type === 'wall' ? { ...el, thickness: Math.max(1, mm) } : el))
            }
          />
          <NumberField
            label={fr.properties.wallHeight}
            suffix={fr.properties.unitMm}
            value={element.height}
            step={50}
            onCommit={(mm) =>
              patch((el) => (el.type === 'wall' ? { ...el, height: Math.max(1, mm) } : el))
            }
          />
          <MaterialField
            label={fr.materials.wallMaterial}
            options={WALL_MATERIALS}
            optionLabels={fr.materials.walls}
            value={element.material}
            onChange={(material) => patch((el) => (el.type === 'wall' ? withWallMaterial(el, material) : el))}
          />
        </>
      )}

      {element.type === 'room' && (
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={element.showLabel}
            onChange={(event) =>
              patch((el) => (el.type === 'room' ? { ...el, showLabel: event.target.checked } : el))
            }
          />
          {fr.properties.showRoomLabel}
        </label>
      )}

      {element.type === 'dimension' && (
        <>
          <NumberField
            label={fr.properties.dimensionOffset}
            suffix={fr.properties.unitMm}
            value={element.offset}
            step={50}
            onCommit={(mm) =>
              patch((el) => (el.type === 'dimension' ? { ...el, offset: mm } : el))
            }
          />
          <DimensionVisibilityField
            element={element}
            onChange={(visibleIn) =>
              patch((el) => {
                if (el.type !== 'dimension') return el
                // Sans valeur, le champ disparaît du document (comme une cote d'avant M10 ter).
                const { visibleIn: _previous, ...rest } = el
                void _previous
                return visibleIn ? { ...rest, visibleIn } : rest
              })
            }
          />
        </>
      )}

      <div className="space-y-1 rounded-md bg-slate-50 p-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {fr.properties.measures}
        </p>
        {room && (
          <>
            <Measure label={fr.properties.area} value={formatArea(room.area)} />
            <Measure label={fr.properties.perimeter} value={formatLength(room.perimeter)} />
            {room.voidArea > 0 && (
              <>
                <Measure label={fr.stairs.voidArea} value={`−${formatArea(room.voidArea)}`} />
                <Measure label={fr.stairs.netArea} value={formatArea(room.netArea)} />
              </>
            )}
            {room.voidOverflow && <p className="text-xs text-red-700">{fr.stairs.voidOverflow}</p>}
            <p className="pt-1 text-xs text-slate-500">{fr.properties.areaOnTrace}</p>
          </>
        )}
        {wall && (
          <>
            <Measure label={fr.properties.length} value={formatLength(wall.length)} />
            <Measure label={fr.properties.wallArea} value={formatArea(wall.wallArea)} />
            {wall.openingsArea > 0 && (
              <>
                <Measure
                  label={fr.properties.openingsArea}
                  value={formatArea(wall.openingsArea)}
                />
                <Measure label={fr.properties.wallNetArea} value={formatArea(wall.netArea)} />
              </>
            )}
          </>
        )}
        {(element.type === 'dimension' || element.type === 'axis') && (
          <Measure
            label={fr.properties.length}
            value={formatLength(
              pointDistance(
                { x: element.points[0], y: element.points[1] },
                { x: element.points[2], y: element.points[3] },
              ),
            )}
          />
        )}
      </div>

      {(element.type === 'wall' || element.type === 'room') && (
        <p className="text-xs text-slate-500">{fr.properties.vertexHint}</p>
      )}
      {element.type === 'wall' && canSplitWall(element) && (
        <button
          type="button"
          title={fr.properties.splitWallTitle}
          className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
          onClick={() => {
            const result = splitWall(element.id)
            if (!result) return
            // Les murs créés remplacent la sélection : ce panneau disparaît, le message reste.
            setNotice(
              [
                fr.properties.splitWallDone(result.count),
                result.removedOpenings > 0 ? fr.properties.splitWallLostOpenings(result.removedOpenings) : '',
              ]
                .filter(Boolean)
                .join(' '),
            )
          }}
        >
          {fr.properties.splitWall}
        </button>
      )}
      {element.type === 'wall' && <p className="text-xs text-slate-500">{fr.properties.wallSideHint}</p>}
      {element.type === 'wall' && <p className="text-xs text-slate-500">{fr.properties.wallChainHint}</p>}
      {element.type === 'axis' && <p className="text-xs text-slate-500">{fr.properties.axisHint}</p>}
    </>
  )
}
