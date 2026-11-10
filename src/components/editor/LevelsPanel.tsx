import clsx from 'clsx'
import { ChevronDown, ChevronUp, Copy, Plus, Trash2 } from 'lucide-react'
import { useState, type KeyboardEvent } from 'react'
import { fr } from '../../i18n/fr'
import { useEditorStore } from '../../stores/editorStore'
import type { Level } from '../../types/document'
import Button from '../ui/Button'
import Modal from '../ui/Modal'
import NumberField from '../ui/NumberField'

const ROW_BUTTON =
  'rounded p-1 text-slate-500 hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent'

/** Panneau « Niveaux » d'un plan : liste, ajout, renommage, ordre, copie, suppression, altitude. */
export default function LevelsPanel() {
  const levels = useEditorStore((state) => state.project?.document.levels)
  const elements = useEditorStore((state) => state.project?.document.elements)
  const activeLevelId = useEditorStore((state) => state.activeLevelId)
  const setActiveLevel = useEditorStore((state) => state.setActiveLevel)
  const addLevel = useEditorStore((state) => state.addLevel)
  const duplicateLevel = useEditorStore((state) => state.duplicateLevel)
  const updateLevel = useEditorStore((state) => state.updateLevel)
  const moveLevel = useEditorStore((state) => state.moveLevel)
  const removeLevel = useEditorStore((state) => state.removeLevel)

  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<Level | null>(null)

  if (!levels || levels.length === 0) return null
  const active = levels.find((level) => level.id === activeLevelId)
  const onlyOne = levels.length === 1

  const commitName = (level: Level, name: string) => {
    setRenamingId(null)
    if (name.trim() && name.trim() !== level.name) updateLevel(level.id, { name })
  }

  const handleRenameKey = (level: Level, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') commitName(level, event.currentTarget.value)
    else if (event.key === 'Escape') setRenamingId(null)
  }

  const countElements = (level: Level) =>
    elements?.filter((el) => el.levelId === level.id).length ?? 0

  // Le niveau le plus haut est en haut de la liste, comme dans un bâtiment.
  const rows = [...levels].reverse()

  return (
    <section aria-label={fr.levels.title} className="border-t border-slate-200 p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-slate-900">{fr.levels.title}</h2>
        <Button onClick={addLevel} className="px-2 py-1 text-xs">
          <Plus size={14} aria-hidden="true" />
          {fr.levels.add}
        </Button>
      </div>

      <ul className="mt-3 space-y-0.5">
        {rows.map((level, rowIndex) => {
          const isActive = level.id === activeLevelId
          const index = levels.length - 1 - rowIndex // indice dans la liste, du bas vers le haut
          return (
            <li
              key={level.id}
              aria-current={isActive}
              onClick={() => setActiveLevel(level.id)}
              className={clsx(
                'flex cursor-pointer items-center gap-1 rounded-md px-1 py-1 text-sm',
                isActive ? 'bg-indigo-50 text-indigo-900' : 'text-slate-700 hover:bg-slate-50',
              )}
            >
              {renamingId === level.id ? (
                <input
                  autoFocus
                  defaultValue={level.name}
                  aria-label={fr.levels.nameLabel}
                  onFocus={(event) => event.target.select()}
                  onBlur={(event) => commitName(level, event.target.value)}
                  onKeyDown={(event) => handleRenameKey(level, event)}
                  onClick={(event) => event.stopPropagation()}
                  className="min-w-0 flex-1 rounded border border-indigo-500 px-1 py-0.5 text-sm text-slate-900 focus:outline-none"
                />
              ) : (
                <span
                  title={fr.levels.renameHint}
                  onDoubleClick={() => setRenamingId(level.id)}
                  className="min-w-0 flex-1 truncate font-medium"
                >
                  {level.name}
                </span>
              )}
              <button
                type="button"
                title={fr.levels.moveUp}
                aria-label={fr.levels.moveUp}
                disabled={index === levels.length - 1}
                onClick={(event) => {
                  event.stopPropagation()
                  moveLevel(level.id, 'up')
                }}
                className={ROW_BUTTON}
              >
                <ChevronUp size={14} />
              </button>
              <button
                type="button"
                title={fr.levels.moveDown}
                aria-label={fr.levels.moveDown}
                disabled={index === 0}
                onClick={(event) => {
                  event.stopPropagation()
                  moveLevel(level.id, 'down')
                }}
                className={ROW_BUTTON}
              >
                <ChevronDown size={14} />
              </button>
              <button
                type="button"
                title={fr.levels.duplicate}
                aria-label={fr.levels.duplicate}
                onClick={(event) => {
                  event.stopPropagation()
                  duplicateLevel(level.id)
                }}
                className={ROW_BUTTON}
              >
                <Copy size={14} />
              </button>
              <button
                type="button"
                title={onlyOne ? fr.levels.removeLast : fr.levels.remove}
                aria-label={fr.levels.remove}
                disabled={onlyOne}
                onClick={(event) => {
                  event.stopPropagation()
                  setDeleting(level)
                }}
                className={ROW_BUTTON}
              >
                <Trash2 size={14} />
              </button>
            </li>
          )
        })}
      </ul>

      {active && (
        <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
          <NumberField
            label={fr.levels.elevation}
            suffix={fr.levels.unitMm}
            value={active.elevation}
            step={100}
            onCommit={(mm) => updateLevel(active.id, { elevation: mm })}
          />
          <NumberField
            label={fr.levels.height}
            suffix={fr.levels.unitMm}
            value={active.height}
            step={50}
            onCommit={(mm) => updateLevel(active.id, { height: mm })}
          />
          <p className="text-xs text-slate-500">{fr.levels.elevationHint}</p>
        </div>
      )}

      {deleting && (
        <Modal title={fr.levels.deleteTitle} onClose={() => setDeleting(null)}>
          <p className="text-sm text-slate-600">
            {countElements(deleting) === 0
              ? fr.levels.deleteMessageEmpty(deleting.name)
              : fr.levels.deleteMessage(deleting.name, countElements(deleting))}
          </p>
          <div className="mt-6 flex justify-end gap-2">
            <Button onClick={() => setDeleting(null)}>{fr.common.cancel}</Button>
            <Button
              variant="danger"
              onClick={() => {
                removeLevel(deleting.id)
                setDeleting(null)
              }}
            >
              {fr.levels.deleteConfirm}
            </Button>
          </div>
        </Modal>
      )}
    </section>
  )
}
