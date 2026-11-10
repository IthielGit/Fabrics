import type Konva from 'konva'
import { useEffect, useRef } from 'react'
import { Transformer } from 'react-konva'
import { applyNodeTransform } from '../../features/geometry/transform'
import { useEditorStore } from '../../stores/editorStore'

const MIN_SIZE_PX = 5 // taille minimale à l'écran lors d'un redimensionnement

interface SelectionTransformerProps {
  /** Faux quand un outil de tracé est actif : les poignées ne doivent pas gêner. */
  enabled: boolean
}

/** Poignées de déplacement, redimensionnement et rotation autour des éléments sélectionnés. */
export default function SelectionTransformer({ enabled }: SelectionTransformerProps) {
  const transformerRef = useRef<Konva.Transformer>(null)
  const selectedIds = useEditorStore((state) => state.selectedIds)
  const elements = useEditorStore((state) => state.project?.document.elements)
  const replaceElements = useEditorStore((state) => state.replaceElements)

  // Rattache le transformateur aux nœuds sélectionnés (à chaque changement de sélection
  // ou de document, par exemple après annuler / rétablir).
  useEffect(() => {
    const transformer = transformerRef.current
    const stage = transformer?.getStage()
    if (!transformer || !stage) return
    const lockedIds = new Set(elements?.filter((el) => el.locked || el.hidden).map((el) => el.id))
    const nodes = selectedIds
      .filter((id) => !lockedIds.has(id))
      .map((id) => stage.findOne(`#${id}`))
      .filter((node): node is Konva.Node => node !== undefined)
    transformer.nodes(nodes)
    transformer.getLayer()?.batchDraw()
  }, [selectedIds, elements])

  const handleTransformEnd = () => {
    const transformer = transformerRef.current
    if (!transformer || !elements) return
    const byId = new Map(elements.map((el) => [el.id, el]))
    const updated = transformer.nodes().flatMap((node) => {
      const element = byId.get(node.id())
      if (!element) return []
      const next = applyNodeTransform(element, {
        x: node.x(),
        y: node.y(),
        rotation: node.rotation(),
        scaleX: node.scaleX(),
        scaleY: node.scaleY(),
      })
      // L'échelle est maintenant dans les dimensions de l'élément : on remet le nœud à 1.
      node.scaleX(1)
      node.scaleY(1)
      return [next]
    })
    // Un seul appel = un seul état d'historique pour tout le geste.
    replaceElements(updated)
  }

  return (
    <Transformer
      ref={transformerRef}
      visible={enabled}
      listening={enabled}
      rotationSnaps={[0, 45, 90, 135, 180, 225, 270, 315]}
      rotationSnapTolerance={5}
      flipEnabled={false}
      borderStroke="#4f46e5"
      anchorStroke="#4f46e5"
      anchorFill="#ffffff"
      // On refuse de rétrécir sous la taille minimale, mais une ligne horizontale (hauteur
      // quasi nulle) doit rester étirable : on ne bloque que si la boîte diminue encore.
      boundBoxFunc={(oldBox, newBox) => {
        const tooNarrow = newBox.width < MIN_SIZE_PX && newBox.width < oldBox.width
        const tooShort = newBox.height < MIN_SIZE_PX && newBox.height < oldBox.height
        return tooNarrow || tooShort ? oldBox : newBox
      }}
      onTransformEnd={handleTransformEnd}
    />
  )
}
