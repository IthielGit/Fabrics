import { pointDistance } from '../../features/geometry/polygon'
import { computeMeasurements } from '../../features/measurements/measurements'
import { cmToMm, formatArea, formatLength, mmToCm } from '../../features/units/format'
import { fr } from '../../i18n/fr'
import { useEditorStore } from '../../stores/editorStore'
import type { DimensionElement, RoomElement, WallElement } from '../../types/document'
import NumberField from '../ui/NumberField'
import TextField from '../ui/TextField'

type PlanElement = WallElement | RoomElement | DimensionElement

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
  const patch = (change: (el: PlanElement) => PlanElement) =>
    updateElements([element.id], (el) =>
      el.type === 'wall' || el.type === 'room' || el.type === 'dimension' ? change(el) : el,
    )

  const measures = computeMeasurements([element])
  const room = measures.rooms[0]
  const wall = measures.walls[0]

  return (
    <>
      <TextField
        label={fr.properties.name}
        value={element.name}
        onCommit={(name) => patch((el) => ({ ...el, name }))}
      />

      {element.type === 'wall' && (
        <>
          <NumberField
            label={fr.properties.wallThickness}
            suffix={fr.properties.unitCm}
            value={mmToCm(element.thickness)}
            onCommit={(cm) =>
              patch((el) => (el.type === 'wall' ? { ...el, thickness: cmToMm(Math.max(1, cm)) } : el))
            }
          />
          <NumberField
            label={fr.properties.wallHeight}
            suffix={fr.properties.unitCm}
            value={mmToCm(element.height)}
            step={5}
            onCommit={(cm) =>
              patch((el) => (el.type === 'wall' ? { ...el, height: cmToMm(Math.max(1, cm)) } : el))
            }
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
        <NumberField
          label={fr.properties.dimensionOffset}
          suffix={fr.properties.unitCm}
          value={mmToCm(element.offset)}
          step={5}
          onCommit={(cm) =>
            patch((el) => (el.type === 'dimension' ? { ...el, offset: cmToMm(cm) } : el))
          }
        />
      )}

      <div className="space-y-1 rounded-md bg-slate-50 p-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {fr.properties.measures}
        </p>
        {room && (
          <>
            <Measure label={fr.properties.area} value={formatArea(room.area)} />
            <Measure label={fr.properties.perimeter} value={formatLength(room.perimeter)} />
            <p className="pt-1 text-xs text-slate-500">{fr.properties.areaOnTrace}</p>
          </>
        )}
        {wall && (
          <>
            <Measure label={fr.properties.length} value={formatLength(wall.length)} />
            <Measure label={fr.properties.wallArea} value={formatArea(wall.wallArea)} />
          </>
        )}
        {element.type === 'dimension' && (
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
    </>
  )
}
