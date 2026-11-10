import { Image as KonvaImage, Rect } from 'react-konva'
import type { ImageElement } from '../../../types/document'
import { useAssetImage } from '../useAssetImage'
import type { ShapeInteraction } from './shapeTypes'

interface ImageShapeProps extends ShapeInteraction {
  element: ImageElement
}

export default function ImageShape({
  element,
  interactive,
  onPointerDown,
  onDragStart,
  onDragMove,
  onDragEnd,
}: ImageShapeProps) {
  const { status, image } = useAssetImage(element.assetId)

  const common = {
    id: element.id,
    name: 'element',
    x: element.x,
    y: element.y,
    width: element.width,
    height: element.height,
    rotation: element.rotation,
    opacity: element.opacity,
    visible: !element.hidden,
    listening: interactive && !element.locked,
    draggable: interactive && !element.locked,
    onMouseDown: onPointerDown,
    onTouchStart: onPointerDown,
    onDragStart,
    onDragMove,
    onDragEnd,
  }

  if (image) return <KonvaImage {...common} image={image} />

  // Pendant le chargement (ou si le fichier est introuvable), un cadre garde la place de l'image.
  return <Rect {...common} fill={status === 'error' ? '#fecaca' : '#e2e8f0'} />
}
