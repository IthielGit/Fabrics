import type { Material, Mesh, Object3D } from 'three'

/**
 * Export 3D du bâtiment au format glTF binaire (`.glb`) avec le `GLTFExporter` fourni par `three`
 * (M11). La scène est en mètres (unité du glTF), y vers le haut ; x et z suivent le plan.
 */

/** Signature d'un fichier glTF binaire : « glTF » en petit-boutiste. */
export const GLB_MAGIC = 0x46546c67

/**
 * Copie de `root` à exporter : mêmes géométries et matières, sauf pour les maillages dont
 * `replace` renvoie une autre matière (mur surligné par la sélection → sa matière normale).
 */
export function exportCopy(root: Object3D, replace: (mesh: Mesh) => Material | null): Object3D {
  const copy = root.clone(true)
  const originals: Object3D[] = []
  const copies: Object3D[] = []
  root.traverse((node) => originals.push(node))
  copy.traverse((node) => copies.push(node))
  originals.forEach((node, index) => {
    const twin = copies[index]
    if (!(node as Mesh).isMesh || !twin) return
    const material = replace(node as Mesh)
    if (material) (twin as Mesh).material = material
  })
  copy.updateMatrixWorld(true)
  return copy
}

/** Fichier `.glb` de `root` (objets visibles seulement). */
export async function exportGlb(root: Object3D): Promise<ArrayBuffer> {
  const { GLTFExporter } = await import('three/examples/jsm/exporters/GLTFExporter.js')
  const result = await new GLTFExporter().parseAsync(root, { binary: true, onlyVisible: true, trs: true })
  if (!(result instanceof ArrayBuffer)) throw new Error('glTF export did not return a binary file')
  return result
}
