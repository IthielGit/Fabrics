import { MaterialPaintPanel, useEditor } from '@pascal-app/editor'
import { useEffect } from 'react'

/**
 * Onglet « Peinture » (repris de `apps/editor/components/paint-panel.tsx` de Pascal, M19 A5) : peindre
 * les matériaux dure tant que l'onglet est ouvert ; le quitter revient à la sélection.
 */
export default function PaintPanel() {
  useEffect(() => {
    const editor = useEditor.getState()
    if (editor.mode !== 'material-paint') {
      editor.setPhase('building')
      editor.armMaterialPaint()
    }
    return () => {
      const current = useEditor.getState()
      if (current.mode === 'material-paint') current.setMode('select')
    }
  }, [])

  return (
    <div className="flex h-full flex-col overflow-y-auto p-3">
      <MaterialPaintPanel />
    </div>
  )
}
