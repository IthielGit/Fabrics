import { useEffect } from 'react'
import { createAutosaver } from '../../features/persistence/autosave'
import { repository } from '../../features/persistence/repository'
import { useEditorStore } from '../../stores/editorStore'

const AUTOSAVE_DELAY_MS = 1000

/** Enregistre le projet ouvert 1 seconde après la dernière modification, et à la fermeture de l'onglet. */
export function useAutosave() {
  useEffect(() => {
    const autosaver = createAutosaver({
      delayMs: AUTOSAVE_DELAY_MS,
      save: (project) => repository.save(project),
      onStatus: (status) => useEditorStore.getState().setSaveStatus(status),
    })

    // `revision` repasse à 0 à l'ouverture d'un projet : seules les vraies modifications comptent.
    const unsubscribe = useEditorStore.subscribe((state, previous) => {
      if (state.revision !== previous.revision && state.revision > 0 && state.project) {
        autosaver.schedule(state.project)
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
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('pagehide', flushNow)
      flushNow() // quitter l'éditeur : on n'attend pas la seconde
    }
  }, [])
}
