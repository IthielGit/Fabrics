import { useEffect } from 'react'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import { CollabBinding } from '../../features/collab/collabBinding'
import { collabProtocols, collabRoomBase } from '../../features/collab/collabUrl'
import { setCollabSession } from '../../features/collab/collabSession'
import { listPeers, MAX_SELECTION, userFromAccount } from '../../features/collab/presence'
import { isSaveLeader } from '../../features/collab/saveLeader'
import { fr } from '../../i18n/fr'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../stores/authStore'
import { useCollabStore } from '../../stores/collabStore'
import { setCollabHistory, useEditorStore } from '../../stores/editorStore'

const ROOM_BASE = collabRoomBase(import.meta.env.VITE_COLLAB_URL as string | undefined)

/** Vrai si un serveur temps réel est configuré (`VITE_COLLAB_URL`) et Supabase disponible. */
export function isCollaborationConfigured(): boolean {
  return ROOM_BASE !== null && supabase !== null
}

/** Attente maximale entre deux tentatives de reconnexion (serveur injoignable ou accès refusé). */
const MAX_BACKOFF_MS = 30_000

/** Délai minimal entre deux envois de présence (curseur, sélection) : ~16 par seconde. */
const PRESENCE_INTERVAL_MS = 60

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
    let stopPresence: (() => void) | null = null
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
        applyRemoteDocument: (document, fromPeer) => editor.getState().applyRemoteDocument(document, fromPeer),
        getSavedAt: () => editor.getState().project?.updatedAt ?? null,
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
      stopPresence = startPresence(ws, userId)

      // « Connexion… » au premier essai seulement ; après un échec on reste « Hors ligne »
      // (les nouvelles tentatives sont automatiques), et « En direct » une fois synchronisé.
      // Lot F : après une coupure, Yjs fusionne tout seul ce qui a été fait de part et d'autre ;
      // on prévient la personne et on force un enregistrement (voir `useAutosave`).
      let wasOffline = false
      const goOffline = () => {
        if (current.started) wasOffline = true
        useCollabStore.getState().setStatus('offline')
      }
      ws.on('connection-close', goOffline)
      ws.on('status', ({ status }) => {
        if (status === 'disconnected') goOffline()
      })
      ws.on('sync', (synced: boolean) => {
        if (!synced) return
        if (!current.started) {
          current.start()
          if (!current.started) return
          setCollabHistory({ undo: () => current.undo(), redo: () => current.redo() })
          setCollabSession({ projectId, markSaved: (savedAt) => current.markSaved(savedAt) })
          useCollabStore.getState().setActive(true)
        } else if (wasOffline) {
          wasOffline = false
          useEditorStore.getState().setNotice(fr.realtime.reconnected, 'success')
          useCollabStore.getState().markReconnected()
        }
        useCollabStore.getState().setStatus('live')
      })
    })

    return () => {
      disposed = true
      authListener.subscription.unsubscribe()
      unsubscribeEditor?.()
      stopPresence?.()
      if (binding?.started) setCollabHistory(null)
      setCollabSession(null)
      binding?.destroy()
      provider?.destroy()
      ydoc.destroy()
      useCollabStore.getState().reset()
    }
  }, [projectId, ready, userId])
}

/**
 * Présence (lot E) : publie qui je suis, où est ma souris et ce que je sélectionne, et range dans
 * `collabStore` les autres connexions. Renvoie la fonction qui arrête tout.
 */
function startPresence(provider: WebsocketProvider, userId: string): () => void {
  const awareness = provider.awareness
  const account = useAuthStore.getState().user
  const me = account && account.id === userId ? userFromAccount(account, fr.presence.anonymous) : null
  if (!me) return () => {}

  const publish = () => {
    const editor = useEditorStore.getState()
    awareness.setLocalState({
      user: me,
      cursor: useCollabStore.getState().localCursor,
      levelId: editor.activeLevelId,
      selection: editor.selectedIds.slice(0, MAX_SELECTION),
    })
  }

  // Au plus un envoi toutes les 60 ms ; le dernier état est toujours envoyé (fin de limite).
  let timer: ReturnType<typeof setTimeout> | null = null
  const schedule = () => {
    if (timer) return
    timer = setTimeout(() => {
      timer = null
      publish()
    }, PRESENCE_INTERVAL_MS)
  }

  const refreshPeers = () => {
    const states = awareness.getStates()
    const collab = useCollabStore.getState()
    collab.setPeers(listPeers(states, awareness.clientID))
    collab.setSaveLeader(isSaveLeader(awareness.clientID, states.keys()))
  }
  awareness.on('change', refreshPeers)
  publish()
  refreshPeers()

  const unsubscribeEditor = useEditorStore.subscribe((state, previous) => {
    if (state.selectedIds !== previous.selectedIds || state.activeLevelId !== previous.activeLevelId) schedule()
  })
  const unsubscribeCursor = useCollabStore.subscribe((state, previous) => {
    if (state.localCursor !== previous.localCursor) schedule()
  })

  return () => {
    unsubscribeEditor()
    unsubscribeCursor()
    awareness.off('change', refreshPeers)
    if (timer) clearTimeout(timer)
    awareness.setLocalState(null)
  }
}
