import { useEffect, useState } from 'react'
import { repository } from '../../features/persistence/repository'

export type AssetImageState =
  | { status: 'loading'; image: null }
  | { status: 'ready'; image: HTMLImageElement }
  | { status: 'error'; image: null }

interface Loaded {
  assetId: string
  state: AssetImageState
}

/** Charge une image du stockage (IndexedDB) pour l'afficher sur le canevas. */
export function useAssetImage(assetId: string): AssetImageState {
  const [loaded, setLoaded] = useState<Loaded | null>(null)

  useEffect(() => {
    let cancelled = false
    repository
      .getAssetUrl(assetId)
      .then(
        (url) =>
          new Promise<HTMLImageElement>((resolve, reject) => {
            const image = new window.Image()
            image.onload = () => resolve(image)
            image.onerror = () => reject(new Error('Image illisible'))
            image.src = url
          }),
      )
      .then((image) => {
        if (!cancelled) setLoaded({ assetId, state: { status: 'ready', image } })
      })
      .catch(() => {
        if (!cancelled) setLoaded({ assetId, state: { status: 'error', image: null } })
      })
    return () => {
      cancelled = true
    }
  }, [assetId])

  // Tant que le résultat ne correspond pas à l'image demandée : chargement.
  return loaded?.assetId === assetId ? loaded.state : { status: 'loading', image: null }
}
