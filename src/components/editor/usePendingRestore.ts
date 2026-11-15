import { useEffect } from 'react'
import { peekPendingRestore, setPendingRestore, takePendingRestore } from '../../features/versions/pendingRestore'
import { createNamedVersion } from '../../features/versions/versionsApi'
import { fr } from '../../i18n/fr'
import { useAuthStore } from '../../stores/authStore'
import { useCollabStore } from '../../stores/collabStore'
import { useEditorStore } from '../../stores/editorStore'
import { isCollaborationConfigured } from './useCollaboration'
import { waitForSaved } from './useVersions'

/** Attente maximale de la collaboration avant de renoncer à restaurer. */
const COLLAB_TIMEOUT_MS = 15_000

/** Attend que la collaboration soit synchronisée ; `false` après `timeoutMs`. */
function waitForCollaboration(timeoutMs: number): Promise<boolean> {
  if (useCollabStore.getState().active) return Promise.resolve(true)
  return new Promise((resolve) => {
    const finish = (ok: boolean) => {
      clearTimeout(timer)
      unsubscribe()
      resolve(ok)
    }
    const timer = setTimeout(() => finish(false), timeoutMs)
    const unsubscribe = useCollabStore.subscribe((state) => {
      if (state.active) finish(true)
    })
  })
}

/**
 * Applique, à l'ouverture de l'éditeur, une restauration demandée depuis l'aperçu d'une version
 * (M15, lot D) :
 *  1. attendre la collaboration (sinon la version de la salle remplacerait la restauration) ;
 *  2. enregistrer l'état actuel, puis le nommer « Avant restauration » (rien n'est jamais perdu) ;
 *  3. remplacer le document comme une modification normale : partagée en direct, annulable (Ctrl+Z).
 */
export function usePendingRestore(projectId: string | undefined, ready: boolean) {
  const signedIn = useAuthStore((state) => state.user !== null)

  useEffect(() => {
    if (!ready || !projectId || !peekPendingRestore(projectId)) return
    let cancelled = false
    const notify = useEditorStore.getState().setNotice

    const run = async () => {
      if (isCollaborationConfigured() && signedIn) {
        const connected = await waitForCollaboration(COLLAB_TIMEOUT_MS)
        if (cancelled) return
        if (!connected) {
          setPendingRestore(null)
          notify(fr.history.restore.needsConnection, 'error')
          return
        }
      }
      const pending = takePendingRestore(projectId)
      if (!pending) return
      notify(fr.history.restore.running, 'info')
      try {
        if (!(await waitForSaved())) throw new Error('not saved')
        await createNamedVersion(projectId, fr.history.restore.backupName(pending.label))
      } catch {
        notify(fr.history.restore.backupError, 'error')
        return
      }
      if (cancelled) return
      useEditorStore.getState().replaceDocument(pending.document)
      notify(fr.history.restore.done(pending.label), 'success')
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [projectId, ready, signedIn])
}
