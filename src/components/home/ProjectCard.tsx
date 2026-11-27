import { Copy, Pencil, Trash2 } from 'lucide-react'
import type { ProjectSummary } from '../../features/persistence/types'
import { useT } from '../../i18n/useT'
import ProjectCardBase from './ProjectCardBase'

interface ProjectCardProps {
  project: ProjectSummary
  onRename: () => void
  onDuplicate: () => void
  onDelete: () => void
}

/** Carte d'un de ses projets : renommer, dupliquer, supprimer. */
export default function ProjectCard({ project, onRename, onDuplicate, onDelete }: ProjectCardProps) {
  const t = useT()
  return (
    <ProjectCardBase
      project={project}
      menuItems={[
        { label: t('projects.rename'), icon: <Pencil size={16} />, onSelect: onRename },
        { label: t('projects.duplicate'), icon: <Copy size={16} />, onSelect: onDuplicate },
        { label: t('projects.delete'), icon: <Trash2 size={16} />, danger: true, onSelect: onDelete },
      ]}
    />
  )
}
