import { createContext } from 'react'

/**
 * Remplace trois modules internes de Next.js (`next/dist/shared/lib/…`) lus par `node-icon-image.tsx`
 * de Pascal (alias dans `vite.config.ts`, M19 A2). Sans serveur d'images, `NextImageShim` affiche
 * toute image telle quelle : aucune liste de domaines à vérifier.
 */
export const imageConfigDefault = {}
export const ImageConfigContext = createContext<unknown>(null)
export const hasRemoteMatch = (): boolean => true
