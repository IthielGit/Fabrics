import { PascalWebXRButton } from '@webxr/plugin/pascal-editor'
import { useEffect } from 'react'
import { useWebXRFeature, WebXRFeatureRuntime } from '@pascal-app-host/webxr-feature-gate'

/** Fonction de réalité virtuelle en cours (session, entrée, sortie), telle que l'expose le module WebXR de Pascal. */
export type WebXRFeature = NonNullable<ReturnType<typeof useWebXRFeature>>

function Reporter({ onFeature }: { onFeature: (feature: WebXRFeature | null) => void }) {
  const feature = useWebXRFeature()
  useEffect(() => {
    onFeature(feature)
    return () => onFeature(null)
  }, [feature, onFeature])
  return null
}

/**
 * Environnement de réalité virtuelle (M19 A6) : fichier chargé seulement quand le module WebXR est
 * installé dans le projet (il apporte `@react-three/xr` et l'émulateur), repris de l'application Pascal.
 */
export default function PascalWebXRRuntime({ onFeature }: { onFeature: (feature: WebXRFeature | null) => void }) {
  return (
    <WebXRFeatureRuntime enabled>
      <Reporter onFeature={onFeature} />
    </WebXRFeatureRuntime>
  )
}

/** Bouton « Entrer en VR » de la barre de vue. */
export function PascalVrButton({ feature }: { feature: WebXRFeature }) {
  return (
    <PascalWebXRButton
      className="flex h-8 w-8 items-center justify-center text-muted-foreground hover:bg-accent disabled:opacity-50"
      feature={feature}
    />
  )
}
