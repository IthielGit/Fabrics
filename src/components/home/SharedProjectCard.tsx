import { Eye, Image, LogOut, Pencil, Ruler } from 'lucide-react'
import { Link } from 'react-router'
import type { SharedProjectSummary } from '../../features/sharing/membersLogic'
import { fr } from '../../i18n/fr'
import { formatRelativeTime } from '../../lib/relativeTime'
import Menu from '../ui/Menu'

interface SharedProjectCardProps {
  project: SharedProjectSummary
  onLeave: () => void
}

/** Carte d'un projet d'un autre compte : même présentation que les siens, avec le rôle et « Quitter ». */
export default function SharedProjectCard({ project, onLeave }: SharedProjectCardProps) {
  const isPlan = project.kind === 'plan'
  const KindIcon = isPlan ? Ruler : Image
  const canEdit = project.role === 'editor'
  const RoleIcon = canEdit ? Pencil : Eye
  const t = fr.sharedWithMe

  return (
    <li className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow duration-200 hover:shadow-md">
      <Link
        to={`/p/${project.id}`}
        className="flex h-36 items-center justify-center border-b border-slate-100 bg-slate-50 bg-[linear-gradient(to_right,rgb(199_210_254/0.35)_1px,transparent_1px),linear-gradient(to_bottom,rgb(199_210_254/0.35)_1px,transparent_1px)] bg-[size:20px_20px] text-indigo-300 transition-colors hover:bg-indigo-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-400"
      >
        {project.thumbnail ? (
          <img src={project.thumbnail} alt="" className="h-full w-full object-contain p-2" draggable={false} />
        ) : (
          <KindIcon size={40} aria-hidden="true" />
        )}
      </Link>
      <div className="flex items-start justify-between gap-2 p-3">
        <Link to={`/p/${project.id}`} className="min-w-0">
          <p className="truncate font-medium text-slate-900">{project.name}</p>
          <p className="text-sm text-slate-600">
            {isPlan ? fr.projects.kindPlan : fr.projects.kindDesign} · {formatRelativeTime(project.updatedAt)}
          </p>
          <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
            <RoleIcon size={12} aria-hidden="true" />
            {canEdit ? t.roleEditor : t.roleViewer}
          </p>
        </Link>
        <Menu
          label={fr.projects.menuLabel}
          items={[{ label: t.leave, icon: <LogOut size={16} />, danger: true, onSelect: onLeave }]}
        />
      </div>
    </li>
  )
}
