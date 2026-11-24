// Fichiers WebAssembly de web-ifc (lecture des IFC par la conversion de Pascal, M22 import) : servis par
// Vite depuis les dépendances de Pascal (alias `web-ifc/*.wasm`, `vite.config.ts`) (copiés dans `dist` au build), chargés seulement à l'import.
import wasmUrl from 'web-ifc/web-ifc.wasm?url'
import wasmMtUrl from 'web-ifc/web-ifc-mt.wasm?url'

export function locateWebIfcWasm(fileName: string): string {
  return fileName.includes('-mt') ? wasmMtUrl : wasmUrl
}
