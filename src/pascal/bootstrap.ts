// Démarrage de l'éditeur de Pascal dans Fabrics, d'après `apps/editor/lib/bootstrap.ts` de Pascal :
// nœuds intégrés, modules d'extension, réglages du moteur de rendu, catalogues de langues.
import {
  type AnyNodeDefinition,
  type CompiledTranslationMessages,
  discoverPlugins,
  extendPluginDiscovery,
  loadPlugin,
  nodeRegistry,
  registerCompiledMessages,
  registerNode,
} from '@pascal-app/core'
import { registerEditorHostPanel } from '@pascal-app/editor'
import { builtinPlugin } from '@pascal-app/nodes'
import { bonesHostPanel, bonesPlugin } from '@pascal-app/plugin-bones'
import { environmentHostPanel, environmentPlugin, environmentPresentation } from '@pascal-app/plugin-environment'
import { treesHostPanel, treesPlugin } from '@pascal-app/plugin-trees'
import { configureViewer, registerViewerPresentation } from '@pascal-app/viewer'
import { pascalTexts } from '../i18n/pascalTexts'

// Fichiers du moteur (sons, icônes) servis par Fabrics (`vite.config.ts`). Les objets du catalogue
// viennent du CDN de Pascal (adresse par défaut du moteur).
configureViewer({ sfxBaseUrl: '/audios/sfx', iconsBaseUrl: '/icons' })

// Garde contre un second chargement (rechargement à chaud) : `registerNode` refuse un type en double.
let builtinsLoaded = false
let externalsStarted = false

function loadBuiltins(): void {
  if (builtinsLoaded) return
  builtinsLoaded = true
  for (const def of builtinPlugin.nodes ?? []) {
    if (nodeRegistry.has((def as AnyNodeDefinition).kind)) continue
    registerNode(def as AnyNodeDefinition)
  }
}

async function loadExternalPlugins(): Promise<void> {
  if (externalsStarted) return
  externalsStarted = true
  for (const plugin of await discoverPlugins()) await loadPlugin(plugin)
}

// Modules de Pascal, comme dans Pascal lancé seul (D81). WebXR (réalité virtuelle) arrive en A6.
// Mint (objets 3D générés, service externe) : retiré à la demande de l'utilisateur le 2026-11-18.
extendPluginDiscovery(async () => [treesPlugin])
registerEditorHostPanel(treesHostPanel)
extendPluginDiscovery(async () => [environmentPlugin])
registerEditorHostPanel(environmentHostPanel)
registerViewerPresentation(environmentPresentation as never)
extendPluginDiscovery(async () => [bonesPlugin])
// Comme dans Pascal : Bones (ossature) n'est pas installé par défaut, on l'ajoute par projet.
registerEditorHostPanel({ ...bonesHostPanel, defaultInstalled: false })
extendPluginDiscovery(async () => {
  const { poolHostPanel, poolPlugin } = await import('@pascal-app/plugin-pool')
  registerEditorHostPanel(poolHostPanel)
  return [poolPlugin]
})
extendPluginDiscovery(async () => {
  const { landscapeHostPanel, landscapePlugin } = await import('@pascal-app/plugin-landscape')
  registerEditorHostPanel(landscapeHostPanel)
  return [landscapePlugin]
})
extendPluginDiscovery(async () => {
  const { bathSpaceHostPanel, bathSpacePlugin } = await import('@pascal-app/plugin-bath-space')
  registerEditorHostPanel(bathSpaceHostPanel)
  return [bathSpacePlugin]
})
extendPluginDiscovery(async () => {
  const { streetscapeHostPanel, streetscapePlugin } = await import('@pascal-app/plugin-streetscape')
  registerEditorHostPanel({
    ...streetscapeHostPanel,
    creator: { name: 'Sudhir Yadav', url: 'https://github.com/sudhir9297' },
  })
  return [streetscapePlugin]
})

loadBuiltins()
void loadExternalPlugins()

// Textes de l'interface de Pascal : un seul fichier, en français (`scripts/compile-pascal-texts.mjs`).
// Aucune autre langue n'est chargée (choix de l'utilisateur du 2026-11-18).
registerCompiledMessages('fr', '', pascalTexts as CompiledTranslationMessages)
