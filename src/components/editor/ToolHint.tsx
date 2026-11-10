import { fr } from '../../i18n/fr'
import { useEditorStore } from '../../stores/editorStore'

/** Rappel des commandes de l'outil de plan en cours, en bas de l'écran. */
export default function ToolHint() {
  const tool = useEditorStore((state) => state.activeTool)
  const hint =
    tool === 'wall' ||
    tool === 'room' ||
    tool === 'dimension' ||
    tool === 'axis' ||
    tool === 'furniture' ||
    tool === 'door' ||
    tool === 'window' ||
    tool === 'calibrate'
      ? fr.hints[tool]
      : null
  if (!hint) return null

  return (
    <p className="pointer-events-none absolute bottom-3 left-1/2 z-10 max-w-[70%] -translate-x-1/2 rounded-md bg-slate-800/90 px-3 py-1.5 text-center text-xs text-white shadow">
      {hint}
    </p>
  )
}
