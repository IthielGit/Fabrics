import { useScene } from '@pascal-app/core'

/** Identifiant du module de réalité virtuelle de Pascal (`@webxr/plugin`, `WEBXR_PLUGIN_ID`). */
const WEBXR_PLUGIN_ID = 'webxr:core'

/** Vrai quand le module de réalité virtuelle est installé dans le projet ouvert. */
export function useWebXRInstalled(): boolean {
  return useScene((state) => state.installedPlugins.includes(WEBXR_PLUGIN_ID))
}
