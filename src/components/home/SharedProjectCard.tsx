import { Eye, LogOut, Pencil } from 'lucide-react'
import type { SharedProjectSummary } from '../../features/sharing/membersLogic'
import { useT } from '../../i18n/useT'
import ProjectCardBase from './ProjectCardBase'

interface SharedProjectCardProps {
  project: SharedProjectSummary
  onLeave: () => void
}

/** Carte d'un projet d'un autre compte : même présentation que les siens, avec le rôle et « Quitter ». */
export default function SharedProjectCard({ project, onLeave }: SharedProjectCardProps) {
  const t = useT()
  const canEdit = project.role === 'editor'
  const RoleIcon = canEdit ? Pencil : Eye

  return (
    <ProjectCardBase
      project={project}
      menuItems={[{ label: t('shared.leave'), icon: <LogOut size={16} />, danger: true, onSelect: onLeave }]}
    >
      <p className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
        <RoleIcon size={12} aria-hidden="true" />
        {canEdit ? t('shared.roleEditor') : t('shared.roleViewer')}
      </p>
    </ProjectCardBase>
  )
}
