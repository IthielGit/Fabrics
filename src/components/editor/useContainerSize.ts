import { useEffect, useRef, useState } from 'react'
import type { Size } from '../../features/geometry/viewport'

/** Suit la taille (px) d'un élément HTML, y compris quand la fenêtre est redimensionnée. */
export function useContainerSize<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [size, setSize] = useState<Size>({ width: 0, height: 0 })

  useEffect(() => {
    const element = ref.current
    if (!element) return
    const update = () => setSize({ width: element.clientWidth, height: element.clientHeight })
    update()
    const observer = new ResizeObserver(update)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return { ref, size }
}
