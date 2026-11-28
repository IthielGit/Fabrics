import { useEffect, useState } from 'react'
import { dropRescueCopy, isRescueNewer, readRescueCopy } from '../../features/persistence/rescue'
import { fr } from '../../i18n/fr'
import { useEditorStore } from '../../stores/editorStore'
import type { Project } from '../../types/document'
import { downloadProjectBackup } from './backupActions'

const BUTTON = 'rounded border border-amber-400 bg-white px-2 py-0.5 text-xs font-medium text-amber-900 hover:bg-amber-100'

/**
 * « Reprendre là où vous en étiez ? » (M24, 24.3, D24-8) : seulement si cet appareil garde une copie
 * plus récente que le projet ouvert (enregistrement refusé), jamais à chaque ouverture.
 */
export default function RescueBanner() {
  const opened = useEditorStore((state) => state.project)
  const projectId = opened?.id ?? null
  const [rescue, setRescue] = useState<Project | null>(null)

  useEffect(() => {
    if (!projectId) return
    let cancelled = false
    const openedAt = useEditorStore.getState().project
    void readRescueCopy(projectId)
      .then((copy) => {
        if (cancelled || !openedAt) return
        if (isRescueNewer(copy, openedAt)) setRescue(copy)
        else if (copy) void dropRescueCopy(projectId)
      })
      .catch(() => {})
    return () => {
      cancelled = true
      setRescue(null)
    }
  }, [projectId])

  if (!rescue || rescue.id !== projectId) return null
  const t = fr.editor.rescue
  const close = () => {
    void dropRescueCopy(rescue.id).catch(() => {})
    setRescue(null)
  }
  const resume = () => {
    useEditorStore.getState().replaceDocument(rescue.document)
    useEditorStore.getState().setNotice(t.resumed, 'success')
    close()
  }

  return (
    <div role="alertdialog" aria-label={t.title} className="mx-auto mt-2 w-fit max-w-xl rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 shadow-lg">
      <p className="font-semibold">{t.title}</p>
      <p className="mt-1">{t.text(new Date(rescue.updatedAt).toLocaleString('fr-FR'))}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        <button type="button" className={BUTTON} onClick={resume}>
          {t.resume}
        </button>
        <button type="button" className={BUTTON} onClick={() => void downloadProjectBackup(rescue, { withEstimate: false }).catch(() => {})}>
          {t.download}
        </button>
        <button type="button" className={BUTTON} onClick={close}>
          {t.ignore}
        </button>
      </div>
    </div>
  )
}
