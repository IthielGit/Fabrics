import {
  allOfType,
  sharedColor,
  sharedColorProps,
  sharedValue,
  withDimensionOffset,
  withDimensionVisibleIn,
  withFalseCeiling,
  withShowLabel,
  withWallHeight,
  withWallThickness,
} from '../../features/documents/commonValues'
import { setColorProp, type ColorProp } from '../../features/documents/properties'
import { WALL_MATERIALS, commonChoice, withWallMaterial } from '../../features/building/materials'
import { fr } from '../../i18n/fr'
import { useEditorStore } from '../../stores/editorStore'
import type { CanvasElement } from '../../types/document'
import CheckboxField from '../ui/CheckboxField'
import ColorField from '../ui/ColorField'
import NumberField from '../ui/NumberField'
import DimensionVisibilityField from './DimensionVisibilityField'
import MaterialField from './MaterialField'

/** `'mixed'` → `null` : le champ numérique reste vide quand les valeurs diffèrent. */
function numberOrEmpty(value: number | 'mixed' | undefined): number | null {
  return typeof value === 'number' ? value : null
}

/**
 * Réglages communs à plusieurs éléments sélectionnés : couleur, puis ceux propres au type quand
 * tous les éléments sont du même type (pièces, murs, cotes). Chaque changement s'applique à tous
 * en un seul pas d'historique.
 */
export default function MultiSelectionFields({ elements }: { elements: CanvasElement[] }) {
  const updateElements = useEditorStore((state) => state.updateElements)
  const ids = elements.map((el) => el.id)
  const apply = (change: (el: CanvasElement) => CanvasElement) => updateElements(ids, change)

  const colorLabels: Record<ColorProp, string> = { fill: fr.properties.fill, stroke: fr.properties.stroke }
  // Le texte doit garder une couleur : pas de bouton « Aucun » s'il y en a dans la sélection.
  const allowNoColor = elements.every((el) => el.type !== 'text')

  return (
    <>
      {sharedColorProps(elements).map((prop) => {
        const color = sharedColor(elements, prop)
        return (
          <ColorField
            key={prop}
            label={colorLabels[prop]}
            value={color === 'mixed' || color === undefined ? '' : color}
            mixedLabel={color === 'mixed' ? fr.properties.mixedValues : undefined}
            noneLabel={allowNoColor ? fr.properties.noColor : undefined}
            onCommit={(value) => apply((el) => setColorProp(el, prop, value))}
          />
        )
      })}

      {allOfType(elements, 'room') && (
        <>
          <CheckboxField
            label={fr.properties.showRoomLabel}
            checked={sharedValue(elements.map((room) => room.showLabel)) ?? false}
            onChange={(checked) => apply((el) => withShowLabel(el, checked))}
          />
          <CheckboxField
            label={fr.properties.falseCeiling}
            title={fr.properties.falseCeilingHint}
            checked={sharedValue(elements.map((room) => room.falseCeiling === true)) ?? false}
            onChange={(checked) => apply((el) => withFalseCeiling(el, checked))}
          />
        </>
      )}

      {allOfType(elements, 'wall') && (
        <>
          <NumberField
            label={fr.properties.wallThickness}
            suffix={fr.properties.unitMm}
            step={10}
            value={numberOrEmpty(sharedValue(elements.map((wall) => wall.thickness)))}
            onCommit={(mm) => apply((el) => withWallThickness(el, mm))}
          />
          <NumberField
            label={fr.properties.wallHeight}
            suffix={fr.properties.unitMm}
            step={50}
            value={numberOrEmpty(sharedValue(elements.map((wall) => wall.height)))}
            onCommit={(mm) => apply((el) => withWallHeight(el, mm))}
          />
          <MaterialField
            label={fr.materials.wallMaterial}
            options={WALL_MATERIALS}
            optionLabels={fr.materials.walls}
            value={commonChoice(elements.map((wall) => wall.material))}
            onChange={(material) => apply((el) => (el.type === 'wall' ? withWallMaterial(el, material) : el))}
          />
        </>
      )}

      {allOfType(elements, 'dimension') && (
        <>
          <NumberField
            label={fr.properties.dimensionOffset}
            suffix={fr.properties.unitMm}
            step={50}
            value={numberOrEmpty(sharedValue(elements.map((dimension) => dimension.offset)))}
            onCommit={(mm) => apply((el) => withDimensionOffset(el, mm))}
          />
          <DimensionVisibilityField
            value={sharedValue(elements.map((dimension) => dimension.visibleIn))}
            onChange={(visibleIn) => apply((el) => withDimensionVisibleIn(el, visibleIn))}
          />
        </>
      )}

      <p className="text-xs text-slate-500">{fr.properties.multiEditHint}</p>
    </>
  )
}
