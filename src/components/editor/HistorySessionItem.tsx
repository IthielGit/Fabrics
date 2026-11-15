import clsx from 'clsx'
import { ChevronDown, ChevronRight, Pencil } from 'lucide-react'
import { useState } from 'react'
import type { ProjectPerson, ProjectVersion, VersionSession } from '../../features/versions/versionsLogic'
import { colorForUser } from '../../features/collab/presence'
import { fr } from '../../i18n/fr'
import UserAvatar from '../ui/UserAvatar'
import VersionNameInput from './VersionNameInput'

interface HistorySessionItemProps {
  session: VersionSession
  people: ReadonlyMap<string, ProjectPerson>
  /** Éditeurs et propriétaire : nommer et renommer. */
  canName: boolean
  editingId: string | null
  /** Version ouverte dans l'aperçu. */
  selectedVersionId?: string
  /** Ouvre l'aperçu d'une version. */
  onSelect: (versionId: string) => void
  onEdit: (versionId: string | null) => void
  onRename: (versionId: string, name: string | null) => void
}

const ROW_BUTTON = 'rounded p-1 text-slate-500 hover:bg-slate-200 focus-visible:outline-2 focus-visible:outline-indigo-600'

function personOf(id: string, people: ReadonlyMap<string, ProjectPerson>): ProjectPerson {
  return people.get(id) ?? { id, name: fr.history.unknownAuthor, color: colorForUser(id) }
}

function Authors({ ids, people }: { ids: readonly string[]; people: ReadonlyMap<string, ProjectPerson> }) {
  if (ids.length === 0) return null
  const persons = ids.map((id) => personOf(id, people))
  return (
    <div className="mt-1 flex items-center gap-1.5">
      <div className="flex -space-x-1.5">
        {persons.slice(0, 4).map((person) => (
          <UserAvatar key={person.id} size="sm" name={person.name} color={person.color} avatarUrl={person.avatarUrl} />
        ))}
      </div>
      <span className="min-w-0 truncate text-xs text-slate-600">{fr.history.authors(persons.map((p) => p.name))}</span>
    </div>
  )
}

/** Une session de travail de l'historique, repliée sur sa dernière étape ; ses étapes se déplient. */
export default function HistorySessionItem({
  session,
  people,
  canName,
  editingId,
  selectedVersionId,
  onSelect,
  onEdit,
  onRename,
}: HistorySessionItemProps) {
  const { latest } = session
  const steps = session.versions.length
  // Une étape intérieure ouverte dans l'aperçu : la session s'affiche dépliée.
  const containsSelected = session.versions.some(
    (version) => version.id === selectedVersionId && version.id !== latest.id,
  )
  const [open, setOpen] = useState(containsSelected)

  const nameButton = (version: ProjectVersion) =>
    canName && (
      <button
        type="button"
        title={version.name ? fr.history.rename : fr.history.name}
        aria-label={version.name ? fr.history.rename : fr.history.name}
        onClick={() => onEdit(version.id)}
        className={ROW_BUTTON}
      >
        <Pencil size={14} aria-hidden="true" />
      </button>
    )

  const nameField = (version: ProjectVersion) => (
    <VersionNameInput
      initial={version.name ?? ''}
      label={fr.history.nameLabel}
      placeholder={fr.history.namePlaceholder}
      onSubmit={(name) => onRename(version.id, name)}
      onCancel={() => onEdit(null)}
    />
  )

  return (
    <li
      className={clsx(
        'rounded-md border px-3 py-2',
        selectedVersionId === latest.id ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200',
      )}
    >
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          {editingId === latest.id ? (
            nameField(latest)
          ) : (
            <button
              type="button"
              onClick={() => onSelect(latest.id)}
              aria-current={selectedVersionId === latest.id}
              title={fr.history.open}
              className="block w-full rounded text-left focus-visible:outline-2 focus-visible:outline-indigo-600"
            >
              {latest.name && (
                <span className="block truncate text-sm font-semibold text-slate-900">{latest.name}</span>
              )}
              <span className={clsx('block text-sm', latest.name ? 'text-slate-600' : 'font-medium text-slate-900')}>
                {fr.history.timeRange(session.startedAt, session.savedAt)}
              </span>
            </button>
          )}
          <Authors ids={session.authors} people={people} />
        </div>
        {editingId !== latest.id && nameButton(latest)}
      </div>

      {steps > 1 && (
        <>
          <button
            type="button"
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
            className="mt-1.5 flex items-center gap-1 rounded text-xs font-medium text-indigo-700 hover:underline focus-visible:outline-2 focus-visible:outline-indigo-600"
          >
            {open ? <ChevronDown size={14} aria-hidden="true" /> : <ChevronRight size={14} aria-hidden="true" />}
            {open ? fr.history.hideSteps : fr.history.showSteps(steps)}
          </button>
          {open && (
            <ul className="mt-1 space-y-1 border-l-2 border-slate-200 pl-3">
              {session.versions.map((version) => (
                <li
                  key={version.id}
                  className={clsx(
                    'flex items-start gap-2 rounded px-1 py-0.5',
                    selectedVersionId === version.id && 'bg-indigo-100',
                  )}
                >
                  <div className="min-w-0 flex-1">
                    {editingId === version.id ? (
                      nameField(version)
                    ) : (
                      <button
                        type="button"
                        onClick={() => onSelect(version.id)}
                        aria-current={selectedVersionId === version.id}
                        title={fr.history.open}
                        className="block w-full rounded text-left text-xs text-slate-700 focus-visible:outline-2 focus-visible:outline-indigo-600"
                      >
                        <span className="font-medium">{fr.history.time(version.savedAt)}</span>
                        {version.name && <span className="ml-1.5 font-semibold text-slate-900">{version.name}</span>}
                      </button>
                    )}
                    <Authors ids={version.authors} people={people} />
                  </div>
                  {editingId !== version.id && nameButton(version)}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </li>
  )
}
