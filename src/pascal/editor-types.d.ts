// Types minimaux de `@pascal-app/editor` (M19 A2). Le paquet est fourni en source TypeScript,
// compilée par Vite ; `paths` (tsconfig.app.json) envoie ici tout import de ce nom, pour que `tsc`
// ne parcoure pas son code avec les réglages stricts de Fabrics (ADR 0002 § 5).
import type { ComponentType, ReactNode } from 'react'

export interface SceneGraph {
  nodes: Record<string, unknown>
  rootNodeIds: string[]
}

export interface EditorProps {
  layoutVersion?: 'v1' | 'v2'
  navbarSlot?: ReactNode
  onLoad?: () => Promise<SceneGraph | null>
  onSave?: (graph: SceneGraph, options?: { keepalive?: boolean }) => Promise<void>
  projectId?: string
  projectName?: string
  [key: string]: unknown
}

export declare const Editor: ComponentType<EditorProps>
export declare function applySceneGraphToEditor(graph: SceneGraph): void
export declare function showSidebarPanel(id: string): void
export declare function registerEditorHostPanel(panel: { id: string; [key: string]: unknown }): void
export declare const ItemsPanel: ComponentType<{ showSourceFilter?: boolean; showTagFilters?: boolean }>
export declare const MaterialPaintPanel: ComponentType
export declare const useEditor: {
  getState(): {
    mode: string
    setMode(mode: string): void
    setPhase(phase: string): void
    armMaterialPaint(): void
  }
}

/** Géométrie de plan d'un niveau, sans interface (M20 20.1a, ADR 0007 : escaliers et mobilier sur les feuilles). */
export interface SheetGeometryEntry {
  id: string
  type: string
  model: import('@pascal-app/core').FloorplanGeometry | null
  annotations: import('@pascal-app/core').FloorplanGeometry | null
}
export declare function collectSheetGeometry(options: {
  nodes: Record<string, import('@pascal-app/core').AnyNode>
  levelId: import('@pascal-app/core').AnyNodeId
  drawingType: 'floor-plan' | 'site-plan' | 'foundation-plan' | 'reflected-ceiling-plan' | 'roof-plan'
  annotationVisibility: Record<string, boolean>
  accept?: (node: import('@pascal-app/core').AnyNode, category: string | undefined) => boolean
  unit?: 'metric' | 'imperial'
  metricNotation?: 'meters' | 'millimeters'
}): SheetGeometryEntry[]
