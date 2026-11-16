import { Lock, Unlock } from 'lucide-react'
import { wallIds, wallsLockState } from '../../features/documents/wallLock'
import { fr } from '../../i18n/fr'
import { selectActiveElements, useEditorStore } from '../../stores/editorStore'
import type { CanvasElement } from '../../types/document'

const BUTTON_CLASS =
  'flex w-full items-center justify-center gap-2 rounded-md border px-2 py-1.5 text-sm font-medium'

/**
 * Verrouillage des murs dans « Propriétés ».
 * - `walls` donné : bouton pour verrouiller ou déverrouiller ces murs (sélection).
 * - sans `walls` : boutons pour tous les murs du niveau actif (rien n'est sélectionné).
 */
export default function WallLockSection({ walls }: { walls?: readonly CanvasElement[] }) {
  const isPlan = useEditorStore((state) => state.project?.document.plan !== undefined)
  const active = useEditorStore(selectActiveElements)
  const updateElements = useEditorStore((state) => state.updateElements)
  const setNotice = useEditorStore((state) => state.setNotice)

  const setLocked = (ids: string[], locked: boolean) =>
    updateElements(ids, (el) => (el.type === 'wall' ? { ...el, locked } : el))

  if (walls) {
    if (walls.length === 0) return null
    const state = wallsLockState(walls)
    const ids = walls.map((el) => el.id)
    return (
      <div className="space-y-2">
        {state === 'all' && (
          <p className="flex items-start gap-2 rounded-md bg-amber-50 p-2 text-xs text-amber-900">
            <Lock size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
            {fr.wallLock.lockedHint(walls.length)}
          </p>
        )}
        <button
          type="button"
          aria-pressed={state === 'all'}
          onClick={() => setLocked(ids, state !== 'all')}
          className={
            state === 'all'
              ? `${BUTTON_CLASS} border-amber-500 bg-amber-50 text-amber-900 hover:bg-amber-100`
              : `${BUTTON_CLASS} border-slate-300 text-slate-700 hover:bg-slate-50`
          }
        >
          {state === 'all' ? <Unlock size={16} aria-hidden="true" /> : <Lock size={16} aria-hidden="true" />}
          {state === 'all' ? fr.wallLock.unlock(walls.length) : fr.wallLock.lock(walls.length)}
        </button>
      </div>
    )
  }

  if (!isPlan) return null
  const levelWalls = active.filter((el) => el.type === 'wall' && !el.hidden)
  if (levelWalls.length === 0) return null
  const state = wallsLockState(levelWalls)
  const ids = wallIds(levelWalls)

  return (
    <div className="mt-4 space-y-2 border-t border-slate-200 pt-4">
      <h3 className="text-sm font-semibold text-slate-900">{fr.wallLock.levelTitle}</h3>
      <p className="text-xs text-slate-600">{fr.wallLock.levelStatus(levelWalls.filter((el) => el.locked).length, levelWalls.length)}</p>
      {state !== 'all' && (
        <button
          type="button"
          onClick={() => {
            setLocked(ids, true)
            setNotice(fr.wallLock.levelLocked(ids.length))
          }}
          className={`${BUTTON_CLASS} border-slate-300 text-slate-700 hover:bg-slate-50`}
        >
          <Lock size={16} aria-hidden="true" />
          {fr.wallLock.lockLevel}
        </button>
      )}
      {state !== 'none' && (
        <button
          type="button"
          onClick={() => setLocked(ids, false)}
          className={`${BUTTON_CLASS} border-slate-300 text-slate-700 hover:bg-slate-50`}
        >
          <Unlock size={16} aria-hidden="true" />
          {fr.wallLock.unlockLevel}
        </button>
      )}
    </div>
  )
}
