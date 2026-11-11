import clsx from 'clsx'
import { AlignCenter, AlignLeft, AlignRight, Bold, Italic, type LucideIcon } from 'lucide-react'
import { FONT_FAMILIES, buildFontStyle, isBold, isItalic } from '../../features/documents/fonts'
import {
  colorPropsFor,
  getColorProp,
  getNumericProp,
  numericPropsFor,
  setColorProp,
  setNumericProp,
  type ColorProp,
  type NumericProp,
} from '../../features/documents/properties'
import { fr } from '../../i18n/fr'
import { useEditorStore } from '../../stores/editorStore'
import type { CanvasElement, TextElement } from '../../types/document'
import ColorField from '../ui/ColorField'
import NumberField from '../ui/NumberField'
import ChimneyFields from './ChimneyFields'
import FurnitureFields from './FurnitureFields'
import OpeningFields from './OpeningFields'
import PlatformFields from './PlatformFields'
import StairFields from './StairFields'
import PlanElementFields from './PlanElementFields'
import PageSizeSection from './PageSizeSection'
import PlanSettingsSection from './PlanSettingsSection'

const ALIGNMENTS: { align: TextElement['align']; icon: LucideIcon; label: string }[] = [
  { align: 'left', icon: AlignLeft, label: fr.properties.alignLeft },
  { align: 'center', icon: AlignCenter, label: fr.properties.alignCenter },
  { align: 'right', icon: AlignRight, label: fr.properties.alignRight },
]

function ToggleButton({
  label,
  pressed,
  icon: Icon,
  onClick,
}: {
  label: string
  pressed: boolean
  icon: LucideIcon
  onClick: () => void
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={pressed}
      onClick={onClick}
      className={clsx(
        'rounded-md border p-1.5',
        pressed
          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
          : 'border-slate-300 text-slate-600 hover:bg-slate-50',
      )}
    >
      <Icon size={16} />
    </button>
  )
}

export default function PropertiesPanel() {
  const project = useEditorStore((state) => state.project)
  const selectedIds = useEditorStore((state) => state.selectedIds)
  const updateElements = useEditorStore((state) => state.updateElements)

  if (!project) return null
  const unit = project.document.unit
  const selected = project.document.elements.filter((el) => selectedIds.includes(el.id))

  const labels: Record<NumericProp, { label: string; suffix: string }> = {
    x: { label: fr.properties.x, suffix: unit === 'mm' ? fr.properties.unitMm : fr.properties.unitPx },
    y: { label: fr.properties.y, suffix: unit === 'mm' ? fr.properties.unitMm : fr.properties.unitPx },
    width: { label: fr.properties.width, suffix: unit === 'mm' ? fr.properties.unitMm : fr.properties.unitPx },
    height: { label: fr.properties.height, suffix: unit === 'mm' ? fr.properties.unitMm : fr.properties.unitPx },
    rotation: { label: fr.properties.rotation, suffix: fr.properties.unitDegrees },
    opacity: { label: fr.properties.opacity, suffix: fr.properties.unitPercent },
    strokeWidth: { label: fr.properties.strokeWidth, suffix: unit === 'mm' ? fr.properties.unitMm : fr.properties.unitPx },
    cornerRadius: { label: fr.properties.cornerRadius, suffix: unit === 'mm' ? fr.properties.unitMm : fr.properties.unitPx },
    fontSize: { label: fr.properties.fontSize, suffix: unit === 'mm' ? fr.properties.unitMm : fr.properties.unitPx },
  }

  const colorLabels: Record<ColorProp, string> = {
    fill: fr.properties.fill,
    stroke: fr.properties.stroke,
  }

  const ids = selected.map((el) => el.id)
  const setNumber = (prop: NumericProp) => (value: number) =>
    updateElements(ids, (el) => setNumericProp(el, prop, value))
  const setColor = (prop: ColorProp) => (color: string) =>
    updateElements(ids, (el) => setColorProp(el, prop, color))
  const updateText = (patch: Partial<Pick<TextElement, 'fontFamily' | 'fontStyle' | 'align'>>) =>
    updateElements(ids, (el) => (el.type === 'text' ? { ...el, ...patch } : el))

  return (
    <section aria-label={fr.properties.title} className="border-b border-slate-200 p-4">
      <h2 className="text-sm font-semibold text-slate-900">{fr.properties.title}</h2>

      {selected.length === 0 && (
        <>
          <p className="mt-3 text-sm text-slate-500">{fr.properties.empty}</p>
          <PageSizeSection />
          <PlanSettingsSection />
        </>
      )}

      {selected.length > 1 && (
        <div className="mt-3 space-y-3">
          <p className="text-sm text-slate-600">{fr.properties.multiple(selected.length)}</p>
          <NumberField
            label={labels.opacity.label}
            suffix={labels.opacity.suffix}
            step={5}
            value={commonValue(selected, 'opacity')}
            onCommit={setNumber('opacity')}
          />
        </div>
      )}

      {selected.length === 1 && renderSingleElementFields(selected[0])}
    </section>
  )

  // Simple fonction (pas un composant) : un composant défini ici serait recréé à chaque rendu
  // et ferait perdre leur saisie en cours aux champs.
  function renderSingleElementFields(element: CanvasElement) {
    return (
      <div className="mt-3 space-y-3">
        {(element.type === 'wall' ||
          element.type === 'room' ||
          element.type === 'dimension' ||
          element.type === 'axis') && <PlanElementFields element={element} />}
        {element.type === 'opening' && <OpeningFields element={element} />}
        {element.type === 'furniture' && <FurnitureFields element={element} />}
        {element.type === 'platform' && <PlatformFields element={element} />}
        {element.type === 'stair' && <StairFields element={element} />}
        {element.type === 'chimney' && <ChimneyFields element={element} />}
        {numericPropsFor(element).map((prop) => (
          <NumberField
            key={prop}
            label={labels[prop].label}
            suffix={labels[prop].suffix}
            step={prop === 'opacity' ? 5 : 1}
            value={getNumericProp(element, prop)}
            onCommit={setNumber(prop)}
          />
        ))}

        {colorPropsFor(element).map((prop) => (
          <ColorField
            key={prop}
            label={colorLabels[prop]}
            value={getColorProp(element, prop) ?? ''}
            noneLabel={element.type === 'text' ? undefined : fr.properties.noColor}
            onCommit={setColor(prop)}
          />
        ))}

        {element.type === 'text' && (
          <>
            <div className="flex items-center justify-between gap-2">
              <label htmlFor="font-family" className="text-sm text-slate-600">
                {fr.properties.fontFamily}
              </label>
              <select
                id="font-family"
                value={element.fontFamily}
                onChange={(event) => updateText({ fontFamily: event.target.value })}
                className="w-36 rounded-md border border-slate-300 px-2 py-1 text-sm text-slate-900"
              >
                {FONT_FAMILIES.map((font) => (
                  <option key={font.name} value={font.name}>
                    {font.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-1">
              <ToggleButton
                label={fr.properties.bold}
                icon={Bold}
                pressed={isBold(element.fontStyle)}
                onClick={() =>
                  updateText({
                    fontStyle: buildFontStyle(!isBold(element.fontStyle), isItalic(element.fontStyle)),
                  })
                }
              />
              <ToggleButton
                label={fr.properties.italic}
                icon={Italic}
                pressed={isItalic(element.fontStyle)}
                onClick={() =>
                  updateText({
                    fontStyle: buildFontStyle(isBold(element.fontStyle), !isItalic(element.fontStyle)),
                  })
                }
              />
              <span className="mx-1 h-5 w-px bg-slate-200" aria-hidden="true" />
              {ALIGNMENTS.map(({ align, icon, label }) => (
                <ToggleButton
                  key={align}
                  label={label}
                  icon={icon}
                  pressed={element.align === align}
                  onClick={() => updateText({ align })}
                />
              ))}
            </div>
          </>
        )}

        {element.type === 'line' && (
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={element.arrowEnd}
              onChange={(event) =>
                updateElements(ids, (el) =>
                  el.type === 'line' ? { ...el, arrowEnd: event.target.checked } : el,
                )
              }
            />
            {fr.properties.arrowEnd}
          </label>
        )}
      </div>
    )
  }
}

/** Valeur commune à tous les éléments, ou `null` si elle diffère. */
function commonValue(elements: CanvasElement[], prop: NumericProp): number | null {
  const values = elements.map((el) => getNumericProp(el, prop))
  return values.every((v) => v === values[0]) ? values[0] : null
}
