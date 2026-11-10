import type Konva from 'konva'

/** Comportement commun à tous les éléments dessinés sur le canevas. */
export interface ShapeInteraction {
  /** Vrai quand l'outil Sélection est actif (sinon les éléments ne réagissent pas à la souris). */
  interactive: boolean
  onPointerDown?: (event: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => void
  onDragStart?: (event: Konva.KonvaEventObject<DragEvent>) => void
  onDragMove?: (event: Konva.KonvaEventObject<DragEvent>) => void
  onDragEnd?: (event: Konva.KonvaEventObject<DragEvent>) => void
}
