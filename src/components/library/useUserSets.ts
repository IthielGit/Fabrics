import { create } from 'zustand'
import type { CanvasElement } from '../../types/document'
import { getUserSet, setUserSets, type UserSet } from '../../features/library/userRegistry'
import { addUserSet, createUserSet, parseUserSets, removeUserSet } from '../../features/library/userSets'

const KEY = 'fabrics.library.userSets'

function read(): UserSet[] {
  try {
    return parseUserSets(window.localStorage.getItem(KEY))
  } catch {
    return [] // stockage indisponible (navigation privée, accès refusé)
  }
}

function write(sets: readonly UserSet[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(sets))
  } catch {
    // Pas grave : les ensembles ne survivront pas au rechargement.
  }
}

interface UserSetsState {
  sets: UserSet[]
  /** Enregistre les objets de la bibliothèque de `selection` sous `name` ; renvoie l'ensemble, ou `null` s'il n'y a rien à enregistrer. */
  save: (selection: readonly CanvasElement[], name: string) => UserSet | null
  remove: (id: string) => void
}

const initial = read()
setUserSets(initial)

/**
 * Bibliothèque personnelle : ensembles d'objets enregistrés par l'utilisateur, gardés dans le
 * navigateur (jamais dans le projet) ; la synchronisation avec le compte viendra au jalon M13.
 */
export const useUserSets = create<UserSetsState>()((set, get) => ({
  sets: initial,
  save: (selection, name) => {
    const created = createUserSet(selection, name)
    if (!created) return null
    const sets = addUserSet(get().sets, created)
    setUserSets(sets)
    write(sets)
    set({ sets })
    return created
  },
  remove: (id) => {
    if (!getUserSet(id)) return
    const sets = removeUserSet(get().sets, id)
    setUserSets(sets)
    write(sets)
    set({ sets })
  },
}))
