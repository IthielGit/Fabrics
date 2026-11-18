import { registerBundledLocales } from '@pascal-app/editor/locales'
import { type AnyNodeDefinition, nodeRegistry, registerNode } from '@pascal-app/core'
import { builtinPlugin } from '@pascal-app/nodes'
import { configureViewer } from '@pascal-app/viewer'

configureViewer({ sfxBaseUrl: '/audios/sfx', iconsBaseUrl: '/icons' })

let loaded = false
if (!loaded) {
  loaded = true
  for (const def of builtinPlugin.nodes ?? []) {
    if (nodeRegistry.has((def as AnyNodeDefinition).kind)) continue
    registerNode(def as AnyNodeDefinition)
  }
}

// Catalogues de Pascal (dont le français) ; la langue active est celle de `src/i18n/runtime.tsx`.
registerBundledLocales()
