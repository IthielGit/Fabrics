import type { FabricsDocument, PlanSettings, Project } from '../../types/document'

export type DesignFormatId = 'post-square' | 'story' | 'a4' | 'a3' | 'banner'

export interface DesignFormat {
  id: DesignFormatId
  width: number // px
  height: number // px
}

// A4 et A3 à 300 dpi (voir docs/02-ARCHITECTURE.md).
export const DESIGN_FORMATS: readonly DesignFormat[] = [
  { id: 'post-square', width: 1080, height: 1080 },
  { id: 'story', width: 1080, height: 1920 },
  { id: 'a4', width: 2480, height: 3508 },
  { id: 'a3', width: 3508, height: 4961 },
  { id: 'banner', width: 1500, height: 500 },
]

export const DEFAULT_PLAN_SETTINGS: PlanSettings = {
  scale: 50,
  gridSize: 100,
  snapToGrid: true,
  defaultWallThickness: 200,
  defaultWallHeight: 2500,
}

export const PLAN_PAGE = { width: 20000, height: 15000 } as const // mm

export function createDesignProject(
  formatId: DesignFormatId,
  name: string,
  now: Date = new Date(),
): Project {
  const format = DESIGN_FORMATS.find((f) => f.id === formatId)
  if (!format) throw new Error(`Format inconnu : ${formatId}`)
  const document: FabricsDocument = {
    version: 1,
    unit: 'px',
    page: { width: format.width, height: format.height, background: '#ffffff' },
    elements: [],
  }
  return newProject('design', name, document, now)
}

export function createPlanProject(name: string, now: Date = new Date()): Project {
  const document: FabricsDocument = {
    version: 1,
    unit: 'mm',
    page: { ...PLAN_PAGE, background: '#ffffff' },
    elements: [],
    plan: { ...DEFAULT_PLAN_SETTINGS },
  }
  return newProject('plan', name, document, now)
}

/** Copie indépendante d'un projet : nouvel identifiant, nouveau nom, mêmes images (assetId). */
export function duplicateProject(source: Project, name: string, now: Date = new Date()): Project {
  const iso = now.toISOString()
  return {
    ...structuredClone(source),
    id: crypto.randomUUID(),
    name,
    createdAt: iso,
    updatedAt: iso,
  }
}

function newProject(
  kind: Project['kind'],
  name: string,
  document: FabricsDocument,
  now: Date,
): Project {
  const iso = now.toISOString()
  return { id: crypto.randomUUID(), name, kind, document, createdAt: iso, updatedAt: iso }
}
