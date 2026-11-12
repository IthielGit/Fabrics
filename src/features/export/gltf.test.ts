import * as THREE from 'three'
import { beforeAll, describe, expect, it } from 'vitest'
import { exportCopy, exportGlb, GLB_MAGIC } from './gltf'

// Node n'a pas de FileReader (le GLTFExporter s'en sert pour assembler le fichier) : version minimale.
beforeAll(() => {
  if (typeof globalThis.FileReader !== 'undefined') return
  class MiniFileReader {
    result: ArrayBuffer | string | null = null
    onloadend: (() => void) | null = null
    readAsArrayBuffer(blob: Blob) {
      void blob.arrayBuffer().then((buffer) => {
        this.result = buffer
        this.onloadend?.()
      })
    }
    readAsDataURL(blob: Blob) {
      void blob.arrayBuffer().then((buffer) => {
        this.result = `data:${blob.type};base64,${Buffer.from(buffer).toString('base64')}`
        this.onloadend?.()
      })
    }
  }
  ;(globalThis as unknown as { FileReader: unknown }).FileReader = MiniFileReader
})

/** Bâtiment minimal comme dans la vue 3D : un groupe à l'échelle 0,001 (mm → m) et un mur de 5000 mm. */
function building(material: THREE.Material) {
  const group = new THREE.Group()
  group.scale.setScalar(0.001)
  const wall = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), material)
  wall.scale.set(5000, 2700, 200)
  wall.position.set(2500, 1350, 0)
  group.add(wall)
  return { group, wall }
}

/** Partie JSON d'un fichier .glb. */
function glbJson(buffer: ArrayBuffer): { nodes: { scale?: number[]; translation?: number[] }[]; materials: { name?: string }[] } {
  const view = new DataView(buffer)
  const length = view.getUint32(12, true)
  return JSON.parse(new TextDecoder().decode(new Uint8Array(buffer, 20, length)))
}

describe('exportGlb', () => {
  it('produit un fichier glTF binaire en mètres', async () => {
    const { group } = building(new THREE.MeshStandardMaterial({ name: 'Mur' }))
    const buffer = await exportGlb(group)
    expect(new DataView(buffer).getUint32(0, true)).toBe(GLB_MAGIC)
    const json = glbJson(buffer)
    // Le mur de 5000 mm fait 5 m : échelle 0,001 du groupe × 5000 du mur.
    const scales = json.nodes.map((n) => n.scale ?? [1, 1, 1])
    expect(scales).toContainEqual([0.001, 0.001, 0.001])
    expect(scales).toContainEqual([5000, 2700, 200])
  })
})

describe('exportCopy', () => {
  it('remplace la matière de sélection sans toucher la scène affichée', () => {
    const normal = new THREE.MeshStandardMaterial({ name: 'Mur' })
    const selected = new THREE.MeshStandardMaterial({ name: 'Sélection' })
    const { group, wall } = building(selected)
    const copy = exportCopy(group, (mesh) => (mesh.material === selected ? normal : null))
    expect(wall.material).toBe(selected)
    const copied = copy.children[0] as THREE.Mesh
    expect(copied.material).toBe(normal)
    expect(copied.geometry).toBe(wall.geometry)
  })
})
