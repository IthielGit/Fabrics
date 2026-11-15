import { Fragment } from 'react'
import { Rect } from 'react-konva'
import { elementBounds } from '../../features/export/bounds'
import { CHANGE_COLORS } from '../../features/versions/versionDiff'
import { useVersionPreviewStore } from '../../stores/versionPreviewStore'
import type { CanvasElement } from '../../types/document'

interface ChangesLayerProps {
  /** Éléments du niveau affiché. */
  elements: readonly CanvasElement[]
  activeLevelId: string | null
  scale: number
}

/**
 * Aperçu d'une version (M15, lot C) : entoure ce qui a été ajouté ou modifié depuis la version
 * précédente et montre en pointillé ce qui a été supprimé. Dans une couche non cliquable, masquée par
 * les exports et la miniature. Rien hors de la page d'aperçu.
 */
export default function ChangesLayer({ elements, activeLevelId, scale }: ChangesLayerProps) {
  const changes = useVersionPreviewStore((state) => state.changes)
  if (!changes) return null
  const u = 1 / scale
  const margin = 4 * u

  const outline = (element: CanvasElement, color: string, removed: boolean) => {
    const box = elementBounds(element)
    if (!box) return null
    return (
      <Rect
        key={`${removed ? 'r' : 'c'}-${element.id}`}
        x={box.x - margin}
        y={box.y - margin}
        width={box.width + 2 * margin}
        height={box.height + 2 * margin}
        stroke={color}
        strokeWidth={2 * u}
        dash={removed ? [6 * u, 4 * u] : undefined}
        fill={removed ? 'rgba(220,38,38,0.08)' : undefined}
        cornerRadius={2 * u}
      />
    )
  }

  const removedHere = changes.removed.filter((element) => (element.levelId ?? null) === activeLevelId)
  return (
    <Fragment>
      {elements.map((element) =>
        changes.added.has(element.id)
          ? outline(element, CHANGE_COLORS.added, false)
          : changes.modified.has(element.id)
            ? outline(element, CHANGE_COLORS.modified, false)
            : null,
      )}
      {removedHere.map((element) => outline(element, CHANGE_COLORS.removed, true))}
    </Fragment>
  )
}
