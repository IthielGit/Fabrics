import { fr } from '../../i18n/fr'
import type { FabricsDocument, PlanSettings, Project } from '../../types/document'
import { createOpeningElement, createRoomElement, createWallElement } from './elements'
import { createLevel } from './levels'
import { CURRENT_DOCUMENT_VERSION } from './migrations'

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
 * Plan d'exemple créé pour Fabrics : un petit logement (séjour + chambre) avec murs, cloison,
 * portes et fenêtres, pour voir tout de suite les surfaces calculées.
 */
export function createExamplePlanProject(now: Date = new Date()): Project {
  const project = createPlanProject(fr.examplePlan.name, now)
  const level = project.document.levels![0]
  const thickness = DEFAULT_PLAN_SETTINGS.defaultWallThickness
  const height = DEFAULT_PLAN_SETTINGS.defaultWallHeight
  // Faces intérieures : x de 4000 à 12700, y de 4000 à 8000 ; cloison à x = 9000 (200 d'épaisseur).
  const outer = createWallElement(
    fr.examplePlan.outerWall,
    [3900, 3900, 12800, 3900, 12800, 8100, 3900, 8100, 3900, 3900],
    thickness,
    height,
  )
  const partition = createWallElement(fr.examplePlan.partition, [9000, 3900, 9000, 8100], thickness, height)
  const living = createRoomElement(fr.examplePlan.living, [4000, 4000, 8900, 4000, 8900, 8000, 4000, 8000])
  const bedroom = createRoomElement(fr.examplePlan.bedroom, [9100, 4000, 12700, 4000, 12700, 8000, 9100, 8000])
  // Segments du mur extérieur : 0 haut, 1 droite, 2 bas (de droite à gauche), 3 gauche.
  const openings = [
    createOpeningElement('window', `${fr.elements.window} 1`, { wallId: outer.id, segmentIndex: 0, offset: 2500, side: 'left' }),
    createOpeningElement('window', `${fr.elements.window} 2`, { wallId: outer.id, segmentIndex: 0, offset: 7300, side: 'left' }),
    createOpeningElement('door', `${fr.elements.door} 1`, { wallId: outer.id, segmentIndex: 2, offset: 6000, side: 'left' }),
    createOpeningElement('door', `${fr.elements.door} 2`, { wallId: partition.id, segmentIndex: 0, offset: 5000, side: 'left' }),
  ]
  project.document.elements = [outer, partition, living, bedroom, ...openings].map((element) => ({
    ...element,
    levelId: level.id,
  }))
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
