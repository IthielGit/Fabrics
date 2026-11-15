import { useEffect } from 'react'
import { markProjectSaved } from '../../features/collab/collabSession'
import { createAutosaver } from '../../features/persistence/autosave'
import { repository } from '../../features/persistence/repository'
import { useCollabStore } from '../../stores/collabStore'
import { useEditorStore } from '../../stores/editorStore'
import { planExportExtent } from '../../features/export/bounds'
import { captureThumbnail } from './thumbnail'

const AUTOSAVE_DELAY_MS = 1000

/** Enregistre le projet ouvert 1 seconde après la dernière modification, et à la fermeture de l'onglet. */
export function useAutosave() {
  useEffect(() => {
    const autosaver = createAutosaver({
      delayMs: AUTOSAVE_DELAY_MS,
      save: async (project) => {
        // Miniature régénérée à chaque sauvegarde ; si la capture échoue, on garde l'ancienne.
        // Pour un plan, la miniature cadre le dessin (et non la page, presque vide autour).
        const extent = project.kind === 'plan' ? planExportExtent(project.document.elements) : null
        const thumbnail = captureThumbnail(project.document.page, extent ?? undefined) ?? project.thumbnail
        const result = await repository.save({ ...project, thumbnail })
        // Lot F : la salle note l'heure serveur de l'enregistrement (voir `CollabBinding.start`).
        if (result?.updatedAt) markProjectSaved(project.id, result.updatedAt)
      },
      onStatus: (status) => useEditorStore.getState().setSaveStatus(status),
    })

    // Lot F : une modification venue d'une autre personne n'est enregistrée que par l'enregistreur
    // désigné (voir `saveLeader.ts`) ; on retient qu'on l'a laissée passer, pour la reprendre si
    // l'enregistreur quitte la salle.
    let skippedForLeader = false

    // `revision` repasse à 0 à l'ouverture d'un projet : seules les vraies modifications comptent.
    const unsubscribe = useEditorStore.subscribe((state, previous) => {
      if (state.revision !== previous.revision && state.revision > 0 && state.project) {
        const fromPeer = state.remoteRevision === state.revision
        if (fromPeer && !useCollabStore.getState().saveLeader) {
          skippedForLeader = true
          return
        }
        skippedForLeader = false
        autosaver.schedule(state.project)
      }
    })

    const unsubscribeCollab = useCollabStore.subscribe((state, previous) => {
      const project = useEditorStore.getState().project
      if (!project) return
      const becameLeader = state.saveLeader && !previous.saveLeader && skippedForLeader
      // Reconnexion après une coupure : on enregistre l'état fusionné sans attendre une modification.
      if (becameLeader || state.reconnections !== previous.reconnections) {
        skippedForLeader = false
        autosaver.schedule(project)
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
      unsubscribeCollab()
      unsubscribeOpen()
      clearTimeout(missingTimer)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('pagehide', flushNow)
      flushNow() // quitter l'éditeur : on n'attend pas la seconde
    }
  }, [])
}
