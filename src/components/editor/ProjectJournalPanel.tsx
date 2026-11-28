import { useCallback } from 'react'
import { listProjectEvents } from '../../features/audit/auditApi'
import { useT } from '../../i18n/useT'
import { useEditorStore } from '../../stores/editorStore'
import JournalPanel from './JournalPanel'

/** Journal du projet ouvert (M24, 24.3) : visible de son propriétaire. */
export default function ProjectJournalPanel() {
  const t = useT()
  const projectId = useEditorStore((state) => state.project?.id ?? null)
  const load = useCallback(() => (projectId ? listProjectEvents(projectId) : Promise.resolve([])), [projectId])
  if (!projectId) return null
  return <JournalPanel key={projectId} load={load} intro={t('journal.projectIntro')} />
}
