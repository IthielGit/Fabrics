import type Konva from 'konva'

/** Comportement commun à tous les éléments dessinés sur le canevas. */
export interface ShapeInteraction {
  /** Vrai quand l'outil Sélection est actif (sinon les éléments ne réagissent pas à la souris). */
  interactive: boolean
  /** Pixels écran par unité du document (sert à garder une zone de clic confortable). */
  viewScale: number
  onPointerDown?: (event: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => void
  onDragStart?: (event: Konva.KonvaEventObject<DragEvent>) => void
  onDragMove?: (event: Konva.KonvaEventObject<DragEvent>) => void
  onDragEnd?: (event: Konva.KonvaEventObject<DragEvent>) => void
  onDoubleClick?: (event: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => void
}
