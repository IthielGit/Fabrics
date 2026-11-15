import { useCallback, useEffect, useRef, useState } from 'react'
import { listProjectPeople, listVersions } from '../../features/versions/versionsApi'
import type { ProjectPerson, ProjectVersion } from '../../features/versions/versionsLogic'
import { fr } from '../../i18n/fr'
import { useEditorStore } from '../../stores/editorStore'

/** Relecture régulière tant que le panneau est ouvert (les autres personnes enregistrent aussi). */
const REFRESH_INTERVAL_MS = 30_000
/** Après un de mes enregistrements : la base a pu prolonger ou créer une étape. */
const AFTER_SAVE_DELAY_MS = 1500

export interface VersionsState {
  status: 'loading' | 'ready' | 'error'
  versions: ProjectVersion[]
  people: ReadonlyMap<string, ProjectPerson>
  /** Heure de la dernière lecture réussie (sert à dire « Aujourd'hui » / « Hier »). */
  loadedAt: Date | null
  refresh: () => Promise<void>
}

/**
 * Versions et personnes d'un projet (M15, lot B), relues à l'ouverture, toutes les 30 s et peu après
 * chaque enregistrement. Une réponse arrivée après une plus récente est ignorée.
 */
export function useVersions(projectId: string | undefined): VersionsState {
  const [status, setStatus] = useState<VersionsState['status']>('loading')
  const [versions, setVersions] = useState<ProjectVersion[]>([])
  const [people, setPeople] = useState<ReadonlyMap<string, ProjectPerson>>(new Map())
  const [loadedAt, setLoadedAt] = useState<Date | null>(null)
  const request = useRef(0)

  const refresh = useCallback(async () => {
    if (!projectId) return
    const id = ++request.current
    try {
      const [nextVersions, nextPeople] = await Promise.all([
        listVersions(projectId),
        listProjectPeople(projectId, fr.history.unknownAuthor),
      ])
      if (id !== request.current) return
      setVersions(nextVersions)
      setPeople(new Map(nextPeople.map((person) => [person.id, person])))
      setLoadedAt(new Date())
      setStatus('ready')
    } catch {
      if (id !== request.current) return
      // Une liste déjà affichée reste visible ; seule une première lecture ratée montre l'erreur.
      setStatus((previous) => (previous === 'ready' ? 'ready' : 'error'))
    }
  }, [projectId])

  // Un autre projet : le composant est recréé (clé `projectId` dans `SidePanel`), l'état repart de zéro.
  useEffect(() => {
    // Première lecture juste après l'affichage (pas d'écriture d'état pendant l'effet lui-même).
    const first = setTimeout(() => void refresh(), 0)
    const interval = setInterval(() => void refresh(), REFRESH_INTERVAL_MS)
    let afterSave: ReturnType<typeof setTimeout> | undefined
    const unsubscribe = useEditorStore.subscribe((state, previous) => {
      if (state.saveStatus === 'saved' && previous.saveStatus === 'saving') {
        clearTimeout(afterSave)
        afterSave = setTimeout(() => void refresh(), AFTER_SAVE_DELAY_MS)
      }
    })
    return () => {
      request.current += 1 // ignore les réponses encore en route
      clearTimeout(first)
      clearInterval(interval)
      clearTimeout(afterSave)
      unsubscribe()
    }
  }, [refresh])

  return { status, versions, people, loadedAt, refresh }
}

/**
 * Attend que le projet soit enregistré (avant de nommer « l'état actuel », qui est lu dans la base).
 * Renvoie `false` si l'enregistrement échoue ou tarde plus de `timeoutMs`.
 */
export function waitForSaved(timeoutMs = 10_000): Promise<boolean> {
  if (useEditorStore.getState().saveStatus === 'saved') return Promise.resolve(true)
  return new Promise((resolve) => {
    const finish = (ok: boolean) => {
      clearTimeout(timer)
      unsubscribe()
      resolve(ok)
    }
    const timer = setTimeout(() => finish(false), timeoutMs)
    const unsubscribe = useEditorStore.subscribe((state) => {
      if (state.saveStatus === 'saved') finish(true)
      else if (state.saveStatus === 'error') finish(false)
    })
  })
}
