import { ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import { fr } from '../../i18n/fr'
import { useEditorStore } from '../../stores/editorStore'

/**
 * Consigne de l'outil de plan en cours, en bas de l'écran : une phrase principale, et les astuces
 * (Maj, Alt, Échap…) dans une liste repliable « Astuces ».
 */
export default function ToolHint() {
  const tool = useEditorStore((state) => state.activeTool)
  const wallMode = useEditorStore((state) => state.wallMode)
  const roomMode = useEditorStore((state) => state.roomMode)
  const platformMode = useEditorStore((state) => state.platformMode)
  const roofShape = useEditorStore((state) => state.roofShape)
  const roofMode = useEditorStore((state) => state.roofMode)
  const [tipsOpen, setTipsOpen] = useState(false)
  let hint: { readonly main: string; readonly tips: readonly string[] } | null = null
  if (tool === 'wall' && wallMode === 'straight') hint = fr.hints.wallStraight
  else if (tool === 'room' && roomMode === 'rectangle') hint = fr.hints.roomRectangle
  else if (tool === 'platform' && platformMode === 'rectangle') hint = fr.hints.platformRectangle
  else if (tool === 'roof') {
    hint = roofShape !== 'flat' || roofMode === 'rectangle' ? fr.hints.roofRectangle : fr.hints.roof
  } else if (
    tool === 'wall' ||
    tool === 'room' ||
    tool === 'platform' ||
    tool === 'stair' ||
    tool === 'chimney' ||
    tool === 'dimension' ||
    tool === 'axis' ||
    tool === 'section' ||
    tool === 'stretch' ||
    tool === 'furniture' ||
    tool === 'door' ||
    tool === 'window' ||
    tool === 'calibrate'
  ) {
    hint = fr.hints[tool]
  }
  if (!hint) return null

  const Chevron = tipsOpen ? ChevronDown : ChevronUp
  return (
    <div className="pointer-events-none absolute bottom-3 left-1/2 z-10 flex max-w-[70%] -translate-x-1/2 flex-col items-center gap-1">
      {tipsOpen && hint.tips.length > 0 && (
        <ul className="pointer-events-auto rounded-md bg-slate-800/90 px-3 py-1.5 text-xs text-slate-200 shadow">
          {hint.tips.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      )}
      <div className="flex items-center gap-2 rounded-md bg-slate-800/90 px-3 py-1.5 text-xs text-white shadow">
        <p className="text-center">{hint.main}</p>
        {hint.tips.length > 0 && (
          <button
            type="button"
            aria-expanded={tipsOpen}
            onClick={() => setTipsOpen((open) => !open)}
            className="pointer-events-auto flex shrink-0 items-center gap-1 rounded border border-slate-500 px-1.5 py-0.5 hover:bg-slate-700"
          >
            {tipsOpen ? fr.hints.tipsHide : fr.hints.tipsShow}
            <Chevron size={12} aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  )
}
