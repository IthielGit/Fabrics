/**
 * Réglage « sons de l'interface » (D81). Mémorisé dans ce navigateur ; les sons eux-mêmes
 * (`howler`) arrivent au sous-lot A6 de M19, qui lira ce réglage.
 */
const KEY = 'fabrics.sounds'

type Store = Pick<Storage, 'getItem' | 'setItem'>

function defaultStore(): Store | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage
  } catch {
    return null
  }
}

/** Sons activés par défaut ; seul « off » les coupe. */
export function readSoundsEnabled(store: Store | null = defaultStore()): boolean {
  try {
    return store?.getItem(KEY) !== 'off'
  } catch {
    return true
  }
}

export function writeSoundsEnabled(enabled: boolean, store: Store | null = defaultStore()): void {
  try {
    store?.setItem(KEY, enabled ? 'on' : 'off')
  } catch {
    // Stockage refusé (navigation privée) : le réglage reste valable jusqu'au rechargement.
  }
}
