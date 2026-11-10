import { ArrowLeft, Redo2, Undo2 } from 'lucide-react'
import { useState, type KeyboardEvent } from 'react'
import { Link } from 'react-router'
import { fr } from '../../i18n/fr'
import { useEditorStore } from '../../stores/editorStore'
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

  // Pendant la saisie on garde un brouillon ; le nom n'est validé qu'à la sortie du champ.
  const [draftName, setDraftName] = useState<string | null>(null)

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

      <div className="ml-auto flex items-center gap-1">
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
    </header>
  )
}
