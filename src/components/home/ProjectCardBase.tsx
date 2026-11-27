import { Image, Ruler } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { displayProjectName } from '../../features/documents/projectName'
import type { Project } from '../../types/document'
import { useT } from '../../i18n/useT'
import { preloadEditor } from '../../pages/lazyPages'
import { formatRelativeTime } from '../../lib/relativeTime'
import Menu, { type MenuItem } from '../ui/Menu'

/** Champs d'un projet affichés sur sa carte (projets à soi comme projets partagés). */
type CardProject = Pick<Project, 'id' | 'name' | 'kind' | 'createdAt' | 'updatedAt'> & {
  thumbnail?: string | null
}

interface ProjectCardBaseProps {
  project: CardProject
  menuItems: MenuItem[]
  /** Ligne en plus sous le type et la date (ex. : rôle sur un projet partagé). */
  children?: ReactNode
}

/** Carte d'un projet, d'après `scene-card.tsx` de Pascal : miniature en 16/9, nom, date, menu. */
export default function ProjectCardBase({ project, menuItems, children }: ProjectCardBaseProps) {
  const t = useT()
  const isPlan = project.kind === 'plan'
  const KindIcon = isPlan ? Ruler : Image

  return (
    // Survol ou focus : l'éditeur se télécharge déjà, l'ouverture est plus rapide (lot Performance).
    <li
      onPointerEnter={() => preloadEditor(project.kind)}
      onFocus={() => preloadEditor(project.kind)}
      className="group relative rounded-xl border border-border/60 bg-background p-2 transition-colors hover:border-border hover:bg-accent">
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
          {children}
        </Link>
        <Menu label={t('projects.menuLabel')} items={menuItems} />
      </div>
    </li>
  )
}
