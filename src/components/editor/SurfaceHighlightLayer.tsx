import { Shape } from 'react-konva'
import { useEditorStore } from '../../stores/editorStore'

const FILL = 'rgba(245, 158, 11, 0.45)'

/**
 * Zone surlignée après un clic sur un avertissement des métrés (surface non couverte ou débord).
 * Disparaît dès que le document change ou qu'un autre niveau est affiché. Sans clic.
 */
export default function SurfaceHighlightLayer({ scale }: { scale: number }) {
  const highlight = useEditorStore((state) => state.surfaceHighlight)
  const elements = useEditorStore((state) => state.project?.document.elements)
  const activeLevelId = useEditorStore((state) => state.activeLevelId)
  if (!highlight || highlight.elements !== elements || highlight.levelId !== activeLevelId) return null

  return (
    <Shape
      name="surface-highlight"
      listening={false}
      stroke="#b45309"
      strokeWidth={2 / scale}
      dash={[6 / scale, 4 / scale]}
      sceneFunc={(context, shape) => {
        context.beginPath()
        for (const ring of highlight.rings) {
          ring.forEach((p, i) => (i === 0 ? context.moveTo(p.x, p.y) : context.lineTo(p.x, p.y)))
          context.closePath()
        }
        // Règle pair-impair : les trous restent vides (Konva ne la propose pas pour le remplissage).
        const native = context._context
        native.fillStyle = FILL
        native.fill('evenodd')
        context.strokeShape(shape)
      }}
    />
  )
}
