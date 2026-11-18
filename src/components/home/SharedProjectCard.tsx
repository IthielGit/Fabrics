import { Eye, Image, LogOut, Pencil, Ruler } from 'lucide-react'
import { Link } from 'react-router'
import { displayProjectName } from '../../features/documents/projectName'
import type { SharedProjectSummary } from '../../features/sharing/membersLogic'
import { useT } from '../../i18n/useT'
import { formatRelativeTime } from '../../lib/relativeTime'
import Menu from '../ui/Menu'

interface SharedProjectCardProps {
  project: SharedProjectSummary
  onLeave: () => void
}

/** Carte d'un projet d'un autre compte : même présentation que les siens, avec le rôle et « Quitter ». */
export default function SharedProjectCard({ project, onLeave }: SharedProjectCardProps) {
  const t = useT()
  const isPlan = project.kind === 'plan'
  const KindIcon = isPlan ? Ruler : Image
  const canEdit = project.role === 'editor'
  const RoleIcon = canEdit ? Pencil : Eye

  return (
    <li className="group relative rounded-xl border border-border/60 bg-background p-2 transition-colors hover:border-border hover:bg-accent">
      <Link
        to={`/p/${project.id}`}
        className="flex aspect-video items-center justify-center overflow-hidden rounded-lg bg-accent text-muted-foreground/40 focus-visible:outline-2 focus-visible:outline-ring"
      >
        {project.thumbnail ? (
          <img src={project.thumbnail} alt="" className="h-full w-full object-contain p-2" draggable={false} />
        ) : (
          <KindIcon size={36} aria-hidden="true" />
        )}
      </Link>
      <div className="flex items-start justify-between gap-2 px-1.5 pb-1 pt-2.5">
        <Link to={`/p/${project.id}`} className="min-w-0">
          <p className="truncate text-sm font-medium">{displayProjectName(project)}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {isPlan ? t('projects.kindPlan') : t('projects.kindDesign')} · {formatRelativeTime(project.updatedAt)}
          </p>
          <p className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
            <RoleIcon size={12} aria-hidden="true" />
            {canEdit ? t('shared.roleEditor') : t('shared.roleViewer')}
          </p>
        </Link>
        <Menu
          label={t('projects.menuLabel')}
          items={[{ label: t('shared.leave'), icon: <LogOut size={16} />, danger: true, onSelect: onLeave }]}
        />
      </div>
    </li>
  )
}
