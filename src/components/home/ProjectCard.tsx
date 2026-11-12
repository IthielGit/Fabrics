import { Copy, Image, Pencil, Ruler, Trash2 } from 'lucide-react'
import { Link } from 'react-router'
import type { ProjectSummary } from '../../features/persistence/types'
import { fr } from '../../i18n/fr'
import { formatRelativeTime } from '../../lib/relativeTime'
import Menu from '../ui/Menu'

interface ProjectCardProps {
  project: ProjectSummary
  onRename: () => void
  onDuplicate: () => void
  onDelete: () => void
}

export default function ProjectCard({
  project,
  onRename,
  onDuplicate,
  onDelete,
}: ProjectCardProps) {
  const isPlan = project.kind === 'plan'
  const KindIcon = isPlan ? Ruler : Image

  return (
    <li className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow duration-200 hover:shadow-md">
      <Link
        to={`/p/${project.id}`}
        className="flex h-36 items-center justify-center border-b border-slate-100 bg-slate-50 bg-[linear-gradient(to_right,rgb(199_210_254/0.35)_1px,transparent_1px),linear-gradient(to_bottom,rgb(199_210_254/0.35)_1px,transparent_1px)] bg-[size:20px_20px] text-indigo-300 transition-colors hover:bg-indigo-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-400"
      >
        {project.thumbnail ? (
          <img
            src={project.thumbnail}
            alt=""
            className="h-full w-full object-contain p-2"
            draggable={false}
          />
        ) : (
          <KindIcon size={40} aria-hidden="true" />
        )}
      </Link>
      <div className="flex items-start justify-between gap-2 p-3">
        <Link to={`/p/${project.id}`} className="min-w-0">
          <p className="truncate font-medium text-slate-900">{project.name}</p>
          <p className="text-sm text-slate-600">
            {isPlan ? fr.projects.kindPlan : fr.projects.kindDesign} ·{' '}
            {formatRelativeTime(project.updatedAt)}
          </p>
        </Link>
        <Menu
          label={fr.projects.menuLabel}
          items={[
            { label: fr.projects.rename, icon: <Pencil size={16} />, onSelect: onRename },
            { label: fr.projects.duplicate, icon: <Copy size={16} />, onSelect: onDuplicate },
            {
              label: fr.projects.delete,
              icon: <Trash2 size={16} />,
              danger: true,
              onSelect: onDelete,
            },
          ]}
        />
      </div>
    </li>
  )
}
