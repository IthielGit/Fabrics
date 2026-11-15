import { useEffect, type RefObject } from 'react'

/**
 * Ferme un menu déroulant quand on clique en dehors ou qu'on appuie sur Échap.
 * Partagé par les menus de la barre « Niveau · Cotation ».
 */
export function useDismiss(
  rootRef: RefObject<HTMLElement | null>,
  open: boolean,
  close: () => void,
): void {
  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) close()
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
    }
    window.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [rootRef, open, close])
}
