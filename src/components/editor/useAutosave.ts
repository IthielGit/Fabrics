import { useEffect } from 'react'
import { createAutosaver } from '../../features/persistence/autosave'
import { repository } from '../../features/persistence/repository'
import { useEditorStore } from '../../stores/editorStore'
import { planExportExtent } from '../../features/export/bounds'
import { captureThumbnail } from './thumbnail'

const AUTOSAVE_DELAY_MS = 1000

/** Enregistre le projet ouvert 1 seconde après la dernière modification, et à la fermeture de l'onglet. */
export function useAutosave() {
  useEffect(() => {
    const autosaver = createAutosaver({
      delayMs: AUTOSAVE_DELAY_MS,
      save: (project) => {
        // Miniature régénérée à chaque sauvegarde ; si la capture échoue, on garde l'ancienne.
        // Pour un plan, la miniature cadre le dessin (et non la page, presque vide autour).
        const extent = project.kind === 'plan' ? planExportExtent(project.document.elements) : null
        const thumbnail = captureThumbnail(project.document.page, extent ?? undefined) ?? project.thumbnail
        return repository.save({ ...project, thumbnail })
      },
      onStatus: (status) => useEditorStore.getState().setSaveStatus(status),
    })

    // `revision` repasse à 0 à l'ouverture d'un projet : seules les vraies modifications comptent.
    const unsubscribe = useEditorStore.subscribe((state, previous) => {
      if (state.revision !== previous.revision && state.revision > 0 && state.project) {
        autosaver.schedule(state.project)
      }
    })

    // Un plan ouvert sans miniature (maison d'exemple, ancien projet) en reçoit une, sans attendre une modification.
    let missingTimer: ReturnType<typeof setTimeout> | undefined
    const unsubscribeOpen = useEditorStore.subscribe((state, previous) => {
      if (state.project?.id === previous.project?.id) return
      clearTimeout(missingTimer)
      const opened = state.project
      if (opened && opened.kind === 'plan' && !opened.thumbnail && opened.document.elements.length > 0) {
        missingTimer = setTimeout(() => {
          const current = useEditorStore.getState().project
          if (current && current.id === opened.id && !current.thumbnail) autosaver.schedule(current)
        }, 600)
      }
    })

    const flushNow = () => void autosaver.flush()
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') flushNow()
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('pagehide', flushNow)

    return () => {
      unsubscribe()
      unsubscribeOpen()
      clearTimeout(missingTimer)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('pagehide', flushNow)
      flushNow() // quitter l'éditeur : on n'attend pas la seconde
    }
  }, [])
}
