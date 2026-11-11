import { polygonArea, polygonPerimeter } from '../../features/geometry/polygon'
import { formatArea, formatLength, formatVolume } from '../../features/units/format'
import { fr } from '../../i18n/fr'
import { useEditorStore } from '../../stores/editorStore'
import type { PlatformElement } from '../../types/document'
import NumberField from '../ui/NumberField'
import TextField from '../ui/TextField'

function Measure({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-600">{label}</span>
      <span className="font-medium text-slate-900">{value}</span>
    </div>
  )
}

/** Réglages d'une plateforme : nom, hauteur du dessus, épaisseur, et ses mesures (surface, volume). */
export default function PlatformFields({ element }: { element: PlatformElement }) {
  const updateElements = useEditorStore((state) => state.updateElements)
  const patch = (change: (el: PlatformElement) => PlatformElement) =>
    updateElements([element.id], (el) => (el.type === 'platform' ? change(el) : el))

  const area = polygonArea(element.points)

  return (
    <>
      <TextField
        label={fr.properties.name}
        value={element.name}
        onCommit={(name) => patch((el) => ({ ...el, name }))}
      />
      <NumberField
        label={fr.platform.elevation}
        suffix={fr.properties.unitMm}
        value={element.elevation}
        step={50}
        onCommit={(mm) =>
          patch((el) => {
            const elevation = Math.max(1, Math.round(mm))
            // Une estrade pleine suit sa hauteur ; une épaisseur plus petite est gardée.
            const solid = el.thickness >= el.elevation
            return {
              ...el,
              elevation,
              thickness: solid ? elevation : Math.min(el.thickness, elevation),
            }
          })
        }
      />
      <NumberField
        label={fr.platform.thickness}
        suffix={fr.properties.unitMm}
        value={element.thickness}
        step={50}
        onCommit={(mm) =>
          // Jamais plus épaisse que la hauteur du dessus (elle ne passe pas sous le plancher).
          patch((el) => ({ ...el, thickness: Math.min(Math.max(1, Math.round(mm)), el.elevation) }))
        }
      />
      <p className="text-xs text-slate-500">{fr.platform.thicknessHint}</p>

      <div className="space-y-1 rounded-md bg-slate-50 p-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {fr.properties.measures}
        </p>
        <Measure label={fr.platform.area} value={formatArea(area)} />
        <Measure label={fr.properties.perimeter} value={formatLength(polygonPerimeter(element.points))} />
        <Measure label={fr.platform.volume} value={formatVolume(area * element.thickness)} />
      </div>
      <p className="text-xs text-slate-500">{fr.properties.vertexHint}</p>
    </>
  )
}
