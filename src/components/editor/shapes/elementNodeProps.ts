import type { ShapeInteraction } from './shapeTypes'

/** Champs d'un élément utilisés par le nœud Konva qui le porte. */
interface NodeElement {
  id: string
  x: number
  y: number
  opacity: number
  locked: boolean
  hidden: boolean
}

/**
 * Propriétés communes du nœud Konva d'un élément (groupe ou forme simple) : identifiant lu par la
 * sélection, position, visibilité, et réaction à la souris seulement avec l'outil Sélection et si
 * l'élément n'est pas verrouillé. La rotation n'y est pas : chaque forme décide si elle tourne.
 */
export function elementNodeProps(
  element: NodeElement,
  {
    interactive,
    onPointerDown,
    onDragStart,
    onDragMove,
    onDragEnd,
  }: Pick<ShapeInteraction, 'interactive' | 'onPointerDown' | 'onDragStart' | 'onDragMove' | 'onDragEnd'>,
) {
  const active = interactive && !element.locked
  return {
    id: element.id,
    name: 'element',
    x: element.x,
    y: element.y,
    opacity: element.opacity,
    visible: !element.hidden,
    listening: active,
    draggable: active,
    onMouseDown: onPointerDown,
    onTouchStart: onPointerDown,
    onDragStart,
    onDragMove,
    onDragEnd,
  }
}
