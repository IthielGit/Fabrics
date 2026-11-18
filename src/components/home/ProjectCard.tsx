import { Copy, Image, Pencil, Ruler, SquareDashedMousePointer, Trash2 } from 'lucide-react'
import { Link, useNavigate } from 'react-router'
import { displayProjectName } from '../../features/documents/projectName'
import type { ProjectSummary } from '../../features/persistence/types'
import { useT } from '../../i18n/useT'
import { formatRelativeTime } from '../../lib/relativeTime'
import Menu from '../ui/Menu'

interface ProjectCardProps {
  project: ProjectSummary
  onRename: () => void
  onDuplicate: () => void
  onDelete: () => void
}

/** Carte d'un projet, d'après `scene-card.tsx` de Pascal : miniature en 16/9, nom, date, menu. */
export default function ProjectCard({ project, onRename, onDuplicate, onDelete }: ProjectCardProps) {
  const t = useT()
  const navigate = useNavigate()
  const isPlan = project.kind === 'plan'
  const KindIcon = isPlan ? Ruler : Image

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
        </Link>
        <Menu
          label={t('projects.menuLabel')}
          items={[
            ...(isPlan
              ? [
                  {
                    label: t('projects.openInPascal'),
                    icon: <SquareDashedMousePointer size={16} />,
                    onSelect: () => navigate(`/p/${project.id}/pascal`),
                  },
                ]
              : []),
            { label: t('projects.rename'), icon: <Pencil size={16} />, onSelect: onRename },
            { label: t('projects.duplicate'), icon: <Copy size={16} />, onSelect: onDuplicate },
            { label: t('projects.delete'), icon: <Trash2 size={16} />, danger: true, onSelect: onDelete },
          ]}
        />
      </div>
    </li>
  )
}
