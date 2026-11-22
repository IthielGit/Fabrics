import { ArrowLeft, Copy, Eye, History, Loader2 } from 'lucide-react'
import { Link } from 'react-router'
import { colorForUser } from '../../features/collab/presence'
import { CHANGE_COLORS, countChanges, type VersionChanges } from '../../features/versions/versionDiff'
import type { ProjectPerson, ProjectVersion } from '../../features/versions/versionsLogic'
import type { SheetComparison } from '../../features/sheets/sheetSet'
import type { SheetSetSettings } from '../../types/document'
import { fr } from '../../i18n/fr'
import Button from '../ui/Button'
import UserAvatar from '../ui/UserAvatar'

interface VersionBannerProps {
  projectId: string
  version: ProjectVersion
  /** `null` : première version (rien à comparer). */
  changes: VersionChanges | null
  people: ReadonlyMap<string, ProjectPerson>
  /** Éditeurs et propriétaire seulement. */
  canRestore: boolean
  /** Action en cours (bouton désactivé, roue qui tourne). */
  busy: 'restore' | 'copy' | null
  onRestore: () => void
  onCopy: () => void
  /**
   * Jeu de feuilles d'un plan (M20 20.7) : indice et statut de la version, feuilles comparées à la
   * version précédente (`null` : première version). Absent : pas un plan, ou calcul impossible.
   */
  sheets?: { settings: SheetSetSettings; changes: SheetComparison[] | null }
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span aria-hidden="true" className="size-2.5 rounded-sm border-2" style={{ borderColor: color }} />
      {label}
    </span>
  )
}

/** Bandeau de l'aperçu d'une version (M15, lot C) : de quand elle date, qui l'a faite, ce qui a changé. */
export default function VersionBanner({
  projectId,
  version,
  changes,
  people,
  canRestore,
  busy,
  onRestore,
  onCopy,
  sheets,
}: VersionBannerProps) {
  const t = fr.history.preview
  const when = t.when(version.savedAt)
  const authors = version.authors.map(
    (id) => people.get(id) ?? { id, name: fr.history.unknownAuthor, color: colorForUser(id) },
  )
  const counts = changes ? countChanges(changes) : null
  const nothing = counts !== null && counts.added + counts.modified + counts.removed === 0

  return (
    <section
      aria-label={t.label}
      className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2 border-b border-amber-200 bg-amber-50 px-3 py-2 text-sm"
    >
      <Eye size={16} aria-hidden="true" className="shrink-0 text-amber-800" />
      <div className="min-w-0">
        <p className="truncate font-semibold text-slate-900">{t.title(version.name, when)}</p>
        <p className="text-xs text-slate-700">
          {version.name ? `${when} · ` : ''}
          {t.readOnly}
        </p>
      </div>

      {authors.length > 0 && (
        <div className="flex items-center gap-1.5">
          <div className="flex -space-x-1.5">
            {authors.slice(0, 4).map((person) => (
              <UserAvatar key={person.id} size="sm" name={person.name} color={person.color} avatarUrl={person.avatarUrl} />
            ))}
          </div>
          <span className="text-xs text-slate-700">{fr.history.authors(authors.map((p) => p.name))}</span>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-700">
        {counts === null ? (
          <span>{t.firstVersion}</span>
        ) : nothing ? (
          <span>{t.noChanges}</span>
        ) : (
          <>
            <span>{t.changesSince}</span>
            {counts.added > 0 && <Legend color={CHANGE_COLORS.added} label={t.added(counts.added)} />}
            {counts.modified > 0 && <Legend color={CHANGE_COLORS.modified} label={t.modified(counts.modified)} />}
            {counts.removed > 0 && <Legend color={CHANGE_COLORS.removed} label={t.removed(counts.removed)} />}
          </>
        )}
      </div>

      {sheets && <SheetSetSummary sheets={sheets} />}

      <div className="ml-auto flex flex-wrap items-center gap-2">
        {canRestore && (
          <Button
            variant="primary"
            onClick={onRestore}
            disabled={busy !== null}
            title={t.restoreHint}
            className="px-3 py-1.5"
          >
            {busy === 'restore' ? (
              <Loader2 size={16} className="animate-spin" aria-hidden="true" />
            ) : (
              <History size={16} aria-hidden="true" />
            )}
            {t.restore}
          </Button>
        )}
        <Button onClick={onCopy} disabled={busy !== null} title={t.copyHint} className="px-3 py-1.5">
          {busy === 'copy' ? (
            <Loader2 size={16} className="animate-spin" aria-hidden="true" />
          ) : (
            <Copy size={16} aria-hidden="true" />
          )}
          {t.copy}
        </Button>
        <Link
          to={`/p/${encodeURIComponent(projectId)}`}
          className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          {t.back}
        </Link>
      </div>
    </section>
  )
}

/** Jeu de feuilles de la version : indice, statut, et liste des feuilles modifiées depuis la précédente. */
function SheetSetSummary({ sheets }: { sheets: NonNullable<VersionBannerProps['sheets']> }) {
  const t = fr.history.preview.sheets
  const title = t.title(sheets.settings.revision, fr.views.sheetInfo.statuses[sheets.settings.status])
  const changed = (sheets.changes ?? []).filter((c) => c.change !== 'unchanged')
  if (sheets.changes === null) return <p className="text-xs text-slate-700">{title}</p>
  return (
    <details className="text-xs text-slate-700">
      <summary className="cursor-pointer">
        {title} · {t.summary(changed.length)}
      </summary>
      {changed.length > 0 && (
        <ul aria-label={t.listLabel} className="mt-1 space-y-0.5">
          {changed.map((c) => (
            <li key={c.key}>
              <span className="font-medium tabular-nums">{c.number}</span> {c.title} — {t.changes[c.change]}
              {c.previousNumber ? ` (${t.renumbered(c.previousNumber)})` : ''}
            </li>
          ))}
        </ul>
      )}
    </details>
  )
}
