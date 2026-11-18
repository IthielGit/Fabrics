import { ItemsPanel } from '@pascal-app/editor'

/** Le catalogue de Pascal sans filtres de source ni d'étiquettes, comme dans Pascal lancé seul. */
export function EditorItemsPanel() {
  return <ItemsPanel showSourceFilter={false} showTagFilters={false} />
}

/** Contenu fourni par Pascal lui-même (onglets `site` et `settings`) : seul l'identifiant compte. */
export function BuiltInPanel() {
  return null
}
