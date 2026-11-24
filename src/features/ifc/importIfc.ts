/**
 * Import d'un fichier IFC (M22, 22.4, D22-6) : la conversion de Pascal (`convertIfcToPascalWithReport`,
 * web-ifc) donne une scène ; Fabrics y joint le bilan objet par objet (`importReport.ts`). La scène
 * devient un nouveau projet Plan : aucun projet existant n'est modifié.
 */
import type { Project } from '../../types/document'
import { createPlanProject } from '../documents/createProject'
import { adoptForeignScene } from '../scene/foreignScene'
import type { PlanScene, SceneNodeData } from '../scene/sceneTypes'
import { sceneToFabricsView } from '../scene/view/toFabricsView'
import { ifcImportReport, type IfcImportReport } from './importReport'

export interface IfcImportOptions {
  /** Dossier des fichiers web-ifc (Node, tests). */
  wasmPath?: string
  /** Adresse d'un fichier web-ifc (navigateur). */
  locateWasmFile?: (fileName: string) => string
  onProgress?: (percent: number) => void
}

export interface IfcImportResult {
  scene: PlanScene
  report: IfcImportReport
}

export async function importIfc(bytes: Uint8Array, options: IfcImportOptions = {}): Promise<IfcImportResult> {
  const { convertIfcToPascalWithReport } = await import('@pascal-app/ifc-converter')
  const { scene, report } = await convertIfcToPascalWithReport(bytes, (_message, percent) => options.onProgress?.(percent), {
    wasmPath: options.wasmPath,
    locateWasmFile: options.locateWasmFile,
  })
  const nodes = Object.fromEntries(
    Object.entries(scene.nodes).map(([id, node]) => [id, { ...node, metadata: (node.metadata ?? {}) as Record<string, unknown> }]),
  ) as unknown as Record<string, SceneNodeData>
  const text = new TextDecoder().decode(bytes)
  // Bilan sur la scène convertie telle quelle ; puis terrain, bâtiment et réglages d'un plan neuf.
  const planScene = adoptForeignScene({ nodes, rootNodeIds: [...scene.rootNodeIds] }, createPlanProject('').document)
  return { scene: planScene, report: ifcImportReport(text, nodes, report) }
}

/** Nouveau projet Plan d'une scène importée (D22-6) : la scène est la source de vérité (D79). */
export function importedPlanProject(name: string, scene: PlanScene, now: Date = new Date()): Project {
  const iso = now.toISOString()
  return { id: crypto.randomUUID(), name, kind: 'plan', document: sceneToFabricsView(scene), scene, createdAt: iso, updatedAt: iso }
}
