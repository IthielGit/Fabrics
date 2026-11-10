import { Maximize } from 'lucide-react'
import { fr } from '../../i18n/fr'
import { useEditorStore } from '../../stores/editorStore'

/**
 * Barre d'état en bas à gauche : zoom, et pour un plan l'échelle d'impression (jamais une
 * « échelle écran », qui dépend du moniteur — voir docs/02-ARCHITECTURE.md).
 */
export default function ZoomControls() {
  const zoom = useEditorStore((state) => state.zoom)
  const printScale = useEditorStore((state) => state.project?.document.plan?.scale)
  const fitView = useEditorStore((state) => state.fitView)

  const percent = Math.round(zoom * 100)

  return (
    <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-md border border-slate-200 bg-white px-2 py-1 text-sm text-slate-700 shadow">
      <span aria-label={fr.editor.zoomLabel}>
        {printScale === undefined
          ? fr.editor.zoomValue(percent)
          : fr.editor.zoomWithPrintScale(percent, printScale)}
      </span>
      <button
        type="button"
        onClick={fitView}
        title={`${fr.editor.fitToScreen} (Ctrl+0)`}
        aria-label={fr.editor.fitToScreen}
        className="rounded p-1 hover:bg-slate-100"
      >
        <Maximize size={16} />
      </button>
    </div>
  )
}
