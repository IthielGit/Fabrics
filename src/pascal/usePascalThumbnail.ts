import { emitter, useScene } from '@pascal-app/core'
import { useCallback, useEffect } from 'react'
import { setCapturedThumbnail } from '../components/editor/thumbnail'
import { useEditorStore } from '../stores/editorStore'

// Taille de la photo demandée à Pascal : assez pour une carte de l'accueil, légère à enregistrer.
const CAPTURE = { w: 640, h: 360 }
const QUIET_MS = 5000
const CHECK_MS = 30_000
const FIRST_CAPTURE_MS = 20_000

/**
 * Miniature d'un plan photographiée par l'éditeur de Pascal (lot Performance, à la place du plan
 * Konva caché). D'après `apps/editor/lib/use-thumbnail-autosave.ts` de Pascal : une photo 5 s après
 * la dernière modification (vérifiée toutes les 30 s et quand on quitte l'onglet), plus une à
 * l'ouverture si le projet n'en a pas. Renvoie le gestionnaire à passer à `onThumbnailCapture`.
 */
export function usePascalThumbnail(projectId: string | undefined, enabled: boolean) {
  useEffect(() => {
    if (!enabled || !projectId) return
    let armed = false
    let dirty = !useEditorStore.getState().project?.thumbnail
    let lastChange = Date.now()
    const unsubscribe = useScene.subscribe((state, previous) => {
      if (state.nodes === previous.nodes) return
      // Le premier changement charge la scène : ce n'est pas une modification.
      if (!armed) {
        armed = true
        return
      }
      dirty = true
      lastChange = Date.now()
    })
    const capture = () => {
      if (!dirty || document.visibilityState !== 'visible' || Date.now() - lastChange < QUIET_MS) return
      dirty = false
      emitter.emit('camera-controls:generate-thumbnail', { projectId, snapLevels: true, standardSize: CAPTURE })
    }
    // À l'ouverture, on laisse à la scène le temps d'être construite (sinon la photo est vide).
    const first = setTimeout(capture, FIRST_CAPTURE_MS)
    const interval = setInterval(capture, CHECK_MS)
    document.addEventListener('visibilitychange', capture)
    return () => {
      unsubscribe()
      clearTimeout(first)
      clearInterval(interval)
      document.removeEventListener('visibilitychange', capture)
      setCapturedThumbnail(null)
    }
  }, [projectId, enabled])

  return useCallback((blob: Blob, camera: { requestId?: string }) => {
    // Une photo demandée par l'utilisateur (outil de capture de Pascal) n'est pas une miniature.
    if (camera.requestId) return
    const reader = new FileReader()
    reader.onload = () => setCapturedThumbnail(typeof reader.result === 'string' ? reader.result : null)
    reader.readAsDataURL(blob)
  }, [])
}
