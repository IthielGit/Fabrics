import { BookmarkPlus, Loader2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { createNamedVersion, renameVersion } from '../../features/versions/versionsApi'
import { groupVersions, relativeDay } from '../../features/versions/versionsLogic'
import { fr } from '../../i18n/fr'
import { useEditorStore } from '../../stores/editorStore'
import Button from '../ui/Button'
import HistorySessionItem from './HistorySessionItem'
import VersionNameInput from './VersionNameInput'
import { useVersions, waitForSaved } from './useVersions'

/**
 * Panneau « Historique » (M15, lot B) : versions du projet par jour et par session, auteurs,
 * versions nommées. Les versions automatiques sont créées par la base à chaque enregistrement.
 */
export default function HistoryPanel() {
  const projectId = useEditorStore((state) => state.project?.id)
  const setNotice = useEditorStore((state) => state.setNotice)
  const { status, versions, people, loadedAt, refresh } = useVersions(projectId)
  const [namedOnly, setNamedOnly] = useState(false)
  const [creating, setCreating] = useState(false)
  const [busy, setBusy] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const days = useMemo(() => groupVersions(versions, { namedOnly }), [versions, namedOnly])
  // Dans l'éditeur, on est propriétaire ou éditeur : on peut nommer (les lecteurs ont une autre page).
  const canName = true

  const create = async (name: string | null) => {
    setCreating(false)
    if (!name || !projectId) return
    setBusy(true)
    try {
      // La version nommée copie l'état enregistré : on attend la fin de l'enregistrement en cours.
      if (!(await waitForSaved())) throw new Error('not saved')
      await createNamedVersion(projectId, name)
      setNotice(fr.history.created(name), 'success')
      await refresh()
    } catch {
      setNotice(fr.history.createError, 'error')
    } finally {
      setBusy(false)
    }
  }

  const rename = async (versionId: string, name: string | null) => {
    setEditingId(null)
    try {
      await renameVersion(versionId, name)
      await refresh()
    } catch {
      setNotice(fr.history.renameError, 'error')
    }
  }

  const dayLabel = (key: string) => {
    const relative = loadedAt ? relativeDay(key, loadedAt) : null
    return relative ? fr.history[relative] : fr.history.day(key)
  }

  return (
    <section aria-label={fr.history.title} className="p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-slate-900">{fr.history.title}</h2>
        {canName && (
          <Button onClick={() => setCreating(true)} disabled={busy || creating} className="px-2 py-1 text-xs">
            {busy ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : <BookmarkPlus size={14} aria-hidden="true" />}
            {fr.history.create}
          </Button>
        )}
      </div>
      <p className="mt-1 text-xs text-slate-600">{fr.history.intro}</p>

      {creating && (
        <div className="mt-3">
          <VersionNameInput
            label={fr.history.nameLabel}
            placeholder={fr.history.namePlaceholder}
            onSubmit={(name) => void create(name)}
            onCancel={() => setCreating(false)}
          />
        </div>
      )}

      <label className="mt-3 flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={namedOnly}
          onChange={(event) => setNamedOnly(event.target.checked)}
          className="size-4 accent-indigo-600"
        />
        {fr.history.namedOnly}
      </label>

      {status === 'loading' && (
        <p role="status" className="mt-4 flex items-center gap-2 text-sm text-slate-600">
          <Loader2 size={14} className="animate-spin" aria-hidden="true" />
          {fr.history.loading}
        </p>
      )}

      {status === 'error' && (
        <div role="alert" className="mt-4 text-sm text-slate-700">
          <p>{fr.history.loadError}</p>
          <Button onClick={() => void refresh()} className="mt-2 px-2 py-1 text-xs">
            {fr.history.retry}
          </Button>
        </div>
      )}

      {status === 'ready' && days.length === 0 && (
        <p className="mt-4 text-sm text-slate-600">{namedOnly ? fr.history.emptyNamed : fr.history.empty}</p>
      )}

      {status === 'ready' &&
        days.map((day) => (
          <div key={day.key} className="mt-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{dayLabel(day.key)}</h3>
            <ul className="mt-1.5 space-y-1.5">
              {day.sessions.map((session) => (
                <HistorySessionItem
                  key={session.id}
                  session={session}
                  people={people}
                  canName={canName}
                  editingId={editingId}
                  onEdit={setEditingId}
                  onRename={(versionId, name) => void rename(versionId, name)}
                />
              ))}
            </ul>
          </div>
        ))}
    </section>
  )
}
