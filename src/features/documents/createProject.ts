import { fr } from '../../i18n/fr'
import type { FabricsDocument, PlanSettings, Project } from '../../types/document'
import { buildExampleElements } from './examplePlan'
import { createLevel } from './levels'
import { CURRENT_DOCUMENT_VERSION } from './migrations'

export type DesignFormatId = 'post-square' | 'a4' | 'a3' | 'banner'

export interface DesignFormat {
  id: DesignFormatId
  width: number // px
  height: number // px
}

// A4 et A3 à 300 dpi (voir docs/02-ARCHITECTURE.md).
export const DESIGN_FORMATS: readonly DesignFormat[] = [
  { id: 'post-square', width: 1080, height: 1080 },
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
  northAngle: 0,
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
    version: CURRENT_DOCUMENT_VERSION,
    unit: 'px',
    page: { width: format.width, height: format.height, background: '#ffffff' },
    elements: [],
  }
  return newProject('design', name, document, now)
}

export function createPlanProject(name: string, now: Date = new Date()): Project {
  // Un plan a toujours au moins un niveau : le rez-de-chaussée.
  const document: FabricsDocument = {
    version: CURRENT_DOCUMENT_VERSION,
    unit: 'mm',
    page: { ...PLAN_PAGE, background: '#ffffff' },
    elements: [],
    plan: { ...DEFAULT_PLAN_SETTINGS },
    levels: [createLevel(fr.levels.groundFloor, 0)],
  }
  return newProject('plan', name, document, now)
}

/**
 * Plan d'exemple créé pour Fabrics : une maison à deux niveaux (rez-de-chaussée et étage) avec
 * pièces, murs, portes, fenêtres, escalier, meubles, cotes, ligne de coupe et toiture, pour voir
 * tout de suite les métrés, la 3D et les exports sur un cas réaliste.
 */
export function createExamplePlanProject(now: Date = new Date()): Project {
  const project = createPlanProject(fr.examplePlan.name, now)
  const ground = project.document.levels![0]
  const upper = createLevel(fr.levels.floorName(1), ground.elevation + ground.height, ground.height, ground.slabThickness)
  project.document.levels = [ground, upper]
  project.document.elements = buildExampleElements({
    levels: project.document.levels,
    thickness: DEFAULT_PLAN_SETTINGS.defaultWallThickness,
    height: DEFAULT_PLAN_SETTINGS.defaultWallHeight,
  })
  return project
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
