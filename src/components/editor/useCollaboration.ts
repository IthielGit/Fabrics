import { useEffect } from 'react'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import { CollabBinding } from '../../features/collab/collabBinding'
import { collabProtocols, collabRoomBase } from '../../features/collab/collabUrl'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../stores/authStore'
import { useCollabStore } from '../../stores/collabStore'
import { setCollabHistory, useEditorStore } from '../../stores/editorStore'

const ROOM_BASE = collabRoomBase(import.meta.env.VITE_COLLAB_URL as string | undefined)

/** Attente maximale entre deux tentatives de reconnexion (serveur injoignable ou accès refusé). */
const MAX_BACKOFF_MS = 30_000

/**
 * Collaboration temps réel (M14, lot D) : relie le projet ouvert au serveur, si une personne est
 * connectée et que `VITE_COLLAB_URL` est renseigné. Sans serveur, l'éditeur fonctionne comme avant.
 */
export function useCollaboration(projectId: string | undefined, ready: boolean) {
  const userId = useAuthStore((state) => state.user?.id ?? null)

  useEffect(() => {
    if (!ROOM_BASE || !supabase || !userId || !projectId || !ready) return
    const client = supabase
    const roomBase = ROOM_BASE
    const collab = useCollabStore.getState()
    let disposed = false
    let provider: WebsocketProvider | null = null
    let binding: CollabBinding | null = null
    let unsubscribeEditor: (() => void) | null = null
    const ydoc = new Y.Doc()
    collab.setStatus('connecting')

    // Le jeton Supabase change toutes les heures : chaque reconnexion doit envoyer le jeton du moment.
    const { data: authListener } = client.auth.onAuthStateChange((_event, session) => {
      if (provider && session) provider.protocols = collabProtocols(session.access_token)
    })

    void client.auth.getSession().then(({ data }) => {
      const token = data.session?.access_token
      if (disposed) return
      if (!token) {
        collab.setStatus('offline')
        return
      }

      const editor = useEditorStore
      const current = new CollabBinding(ydoc, {
        getDocument: () => editor.getState().project?.document ?? null,
        isLiveEditing: () => editor.getState().liveEditing,
        applyRemoteDocument: (document) => editor.getState().applyRemoteDocument(document),
        onHistoryChange: (canUndo, canRedo) => useCollabStore.getState().setHistory(canUndo, canRedo),
      })
      binding = current

      // Chaque modification de l'éditeur (ou la fin d'un geste) part vers le document partagé.
      unsubscribeEditor = editor.subscribe((state, previous) => {
        if (state.project?.document !== previous.project?.document || state.liveEditing !== previous.liveEditing) {
          current.localChanged()
        }
      })

      const ws = new WebsocketProvider(roomBase, projectId, ydoc, {
        protocols: collabProtocols(token),
        disableBc: true,
        maxBackoffTime: MAX_BACKOFF_MS,
      })
      provider = ws

      // « Connexion… » au premier essai seulement ; après un échec on reste « Hors ligne »
      // (les nouvelles tentatives sont automatiques), et « En direct » une fois synchronisé.
      ws.on('connection-close', () => useCollabStore.getState().setStatus('offline'))
      ws.on('status', ({ status }) => {
        if (status === 'disconnected') useCollabStore.getState().setStatus('offline')
      })
      ws.on('sync', (synced: boolean) => {
        if (!synced) return
        if (!current.started) {
          current.start()
          if (!current.started) return
          setCollabHistory({ undo: () => current.undo(), redo: () => current.redo() })
          useCollabStore.getState().setActive(true)
        }
        useCollabStore.getState().setStatus('live')
      })
    })

    return () => {
      disposed = true
      authListener.subscription.unsubscribe()
      unsubscribeEditor?.()
      if (binding?.started) setCollabHistory(null)
      binding?.destroy()
      provider?.destroy()
      ydoc.destroy()
      useCollabStore.getState().reset()
    }
  }, [projectId, ready, userId])
}
