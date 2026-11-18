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
