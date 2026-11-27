import { useSyncExternalStore } from 'react'

/** Sous `sm` (téléphones), les dessins de l'introduction sont rendus en version compacte. */
const COMPACT_QUERY = '(max-width: 639px)'

function subscribeCompact(onChange: () => void): () => void {
  const mql = window.matchMedia(COMPACT_QUERY)
  mql.addEventListener('change', onChange)
  return () => mql.removeEventListener('change', onChange)
}

/** Vrai sur un écran de téléphone (suit le redimensionnement de la fenêtre). */
export function useCompact(): boolean {
  return useSyncExternalStore(
    subscribeCompact,
    () => window.matchMedia(COMPACT_QUERY).matches,
    () => false,
  )
}
