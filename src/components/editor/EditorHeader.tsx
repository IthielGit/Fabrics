import clsx from 'clsx'
import { ArrowLeft, Box, Download, PanelsTopLeft, Redo2, Undo2 } from 'lucide-react'
import { useState, type KeyboardEvent } from 'react'
import { Link } from 'react-router'
import { fr } from '../../i18n/fr'
import { useEditorStore } from '../../stores/editorStore'
import { useViewer3DStore } from '../../stores/viewer3dStore'
import { useViewsStore } from '../../stores/viewsStore'
import Button from '../ui/Button'
import ExportDialog from './ExportDialog'
import PlanCheckBadge from './PlanCheckBadge'
import SaveIndicator from './SaveIndicator'

const ICON_BUTTON =
  'rounded-md p-2 text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent'

export default function EditorHeader() {
  const projectName = useEditorStore((state) => state.project?.name ?? '')
  const canUndo = useEditorStore((state) => state.history.past.length > 0)
  const canRedo = useEditorStore((state) => state.history.future.length > 0)
  const renameProject = useEditorStore((state) => state.renameProject)
  const undo = useEditorStore((state) => state.undo)
  const redo = useEditorStore((state) => state.redo)
  const isPlan = useEditorStore((state) => state.project?.kind === 'plan')
  const viewer3DOpen = useViewer3DStore((state) => state.open)
  const toggleViewer3D = useViewer3DStore((state) => state.toggleOpen)
  const openViews = useViewsStore((state) => state.openViews)

  // Pendant la saisie on garde un brouillon ; le nom n'est validé qu'à la sortie du champ.
  const [draftName, setDraftName] = useState<string | null>(null)
  const [exportOpen, setExportOpen] = useState(false)

  const commitName = () => {
    if (draftName !== null && draftName.trim()) renameProject(draftName.trim())
    setDraftName(null) // un nom vide est refusé : on revient au nom précédent
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') event.currentTarget.blur()
    if (event.key === 'Escape') {
      setDraftName(null)
      event.currentTarget.blur()
    }
  }

  return (
    <header className="flex h-12 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-3">
      <Link to="/" title={fr.editor.backToHome} aria-label={fr.editor.backToHome} className={ICON_BUTTON}>
        <ArrowLeft size={18} />
      </Link>

      <input
        aria-label={fr.projects.nameLabel}
        value={draftName ?? projectName}
        maxLength={200}
        onFocus={(event) => {
          setDraftName(projectName)
          event.target.select()
        }}
        onChange={(event) => setDraftName(event.target.value)}
        onBlur={commitName}
        onKeyDown={handleKeyDown}
        className="w-64 max-w-[40vw] truncate rounded-md border border-transparent px-2 py-1 font-medium text-slate-900 hover:border-slate-300 focus:border-indigo-500 focus:outline-none"
      />

      <SaveIndicator />
      <PlanCheckBadge />

      <div className="ml-auto flex items-center gap-1">
        {isPlan && (
          <button
            type="button"
            onClick={toggleViewer3D}
            aria-pressed={viewer3DOpen}
            title={viewer3DOpen ? fr.viewer3d.close : fr.viewer3d.open}
            aria-label={viewer3DOpen ? fr.viewer3d.close : fr.viewer3d.open}
            className={clsx(ICON_BUTTON, viewer3DOpen && 'bg-indigo-50 text-indigo-700')}
          >
            <Box size={18} />
          </button>
        )}
        {isPlan && (
          <button
            type="button"
            onClick={openViews}
            title={fr.views.open}
            aria-label={fr.views.open}
            className="mr-1 flex items-center gap-1.5 rounded-md px-2 py-2 text-sm text-slate-700 hover:bg-slate-100"
          >
            <PanelsTopLeft size={18} aria-hidden="true" />
            {fr.views.openLabel}
          </button>
        )}
        <Button onClick={() => setExportOpen(true)} className="mr-2 px-3 py-1.5">
          <Download size={16} aria-hidden="true" />
          {fr.export.open}
        </Button>
        <button
          type="button"
          onClick={undo}
          disabled={!canUndo}
          title={`${fr.editor.undo} (Ctrl+Z)`}
          aria-label={fr.editor.undo}
          className={ICON_BUTTON}
        >
          <Undo2 size={18} />
        </button>
        <button
          type="button"
          onClick={redo}
          disabled={!canRedo}
          title={`${fr.editor.redo} (Ctrl+Maj+Z)`}
          aria-label={fr.editor.redo}
          className={ICON_BUTTON}
        >
          <Redo2 size={18} />
        </button>
      </div>
      {exportOpen && <ExportDialog onClose={() => setExportOpen(false)} />}
    </header>
  )
}
