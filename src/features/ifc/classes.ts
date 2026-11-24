/**
 * Classes IFC des éléments d'un plan Fabrics (M22, 22.1). L'IFC est écrit par l'exportateur de Pascal
 * (IFC4, D22-1, D22-4) : chaque nœud de la scène devient la classe donnée ici. Cette table dit aussi
 * le code Uniclass 2015 de la classe (D22-2), le jeu de quantités standard rempli avec les quantités
 * de métré (D22-7) et la catégorie Revit attendue à l'ouverture (D22-3, non essayé dans Revit).
 * `classes.test.ts` vérifie que l'exportateur écrit bien ces classes.
 */

export interface UniclassCode {
  identification: string
  name: string
}

export interface IfcClassRule {
  /** Type du nœud de la scène Pascal. */
  nodeType: string
  /** Élément Fabrics correspondant (texte de la documentation). */
  fabrics: string
  /** Classes IFC écrites pour un nœud (une toiture : `IFCROOF` et ses pans ; un escalier : ses volées). */
  entities: readonly string[]
  /** Géométrie : `parametric` (recalculée depuis la scène) ou `mesh` (forme 3D de la vue, absente sans vue 3D). */
  geometry: 'parametric' | 'mesh' | 'none'
  uniclass?: UniclassCode
  /** Jeu de quantités standard rempli par Fabrics. */
  qto?: string
  /** Catégorie Revit attendue (table de correspondance par défaut de Revit). */
  revit: string
}

/** Uniclass 2015, table EF (éléments et fonctions). Codes à faire relire par un praticien BIM. */
export const UNICLASS = {
  source: 'NBS',
  edition: '2015',
  name: 'Uniclass 2015',
  location: 'https://uniclass.thenbs.com',
} as const

const WALLS: UniclassCode = { identification: 'EF_25_10', name: 'Walls' }
const DOORS_WINDOWS: UniclassCode = { identification: 'EF_25_30', name: 'Doors and windows' }
const FLOORS: UniclassCode = { identification: 'EF_30_20', name: 'Floors' }
const ROOFS: UniclassCode = { identification: 'EF_30_10', name: 'Roofs' }
const STAIRS: UniclassCode = { identification: 'EF_35_10', name: 'Stairs' }

export const IFC_CLASSES: readonly IfcClassRule[] = [
  { nodeType: 'site', fabrics: 'Terrain', entities: ['IFCSITE'], geometry: 'none', revit: 'Site (informations du projet)' },
  { nodeType: 'building', fabrics: 'Bâtiment', entities: ['IFCBUILDING'], geometry: 'none', revit: 'Bâtiment (informations du projet)' },
  { nodeType: 'level', fabrics: 'Niveau', entities: ['IFCBUILDINGSTOREY'], geometry: 'none', revit: 'Niveaux' },
  { nodeType: 'wall', fabrics: 'Mur (un IfcWall par côté)', entities: ['IFCWALL'], geometry: 'parametric', uniclass: WALLS, qto: 'Qto_WallBaseQuantities', revit: 'Murs' },
  { nodeType: 'door', fabrics: 'Porte', entities: ['IFCDOOR'], geometry: 'parametric', uniclass: DOORS_WINDOWS, qto: 'Qto_DoorBaseQuantities', revit: 'Portes' },
  { nodeType: 'window', fabrics: 'Fenêtre, baie', entities: ['IFCWINDOW'], geometry: 'parametric', uniclass: DOORS_WINDOWS, qto: 'Qto_WindowBaseQuantities', revit: 'Fenêtres' },
  { nodeType: 'zone', fabrics: 'Pièce (contour tracé, D22-5)', entities: ['IFCSPACE'], geometry: 'parametric', qto: 'Qto_SpaceBaseQuantities', revit: 'Pièces (espaces)' },
  { nodeType: 'slab', fabrics: 'Dalle dessinée, dalle de niveau', entities: ['IFCSLAB'], geometry: 'parametric', uniclass: FLOORS, qto: 'Qto_SlabBaseQuantities', revit: 'Sols' },
  { nodeType: 'roof', fabrics: 'Toiture', entities: ['IFCROOF', 'IFCSLAB'], geometry: 'mesh', uniclass: ROOFS, revit: 'Toits' },
  { nodeType: 'roof-segment', fabrics: 'Pan de toiture (dans sa toiture)', entities: ['IFCSLAB'], geometry: 'mesh', uniclass: ROOFS, revit: 'Toits' },
  { nodeType: 'stair', fabrics: 'Escalier', entities: ['IFCSTAIR', 'IFCSTAIRFLIGHT'], geometry: 'mesh', uniclass: STAIRS, revit: 'Escaliers' },
  { nodeType: 'stair-segment', fabrics: 'Volée ou palier (dans son escalier)', entities: ['IFCSTAIRFLIGHT', 'IFCSLAB'], geometry: 'mesh', uniclass: STAIRS, revit: 'Escaliers' },
  { nodeType: 'item', fabrics: 'Mobilier, équipement', entities: ['IFCFURNISHINGELEMENT'], geometry: 'mesh', revit: 'Mobilier' },
  { nodeType: 'fabrics:platform', fabrics: 'Plateforme', entities: ['IFCBUILDINGELEMENTPROXY'], geometry: 'mesh', revit: 'Modèles génériques' },
]

/**
 * Nœuds sans objet IFC (annotations et repères, exclus de l'export). Les ouvertures des murs
 * deviennent des `IfcOpeningElement` qui percent le mur, remplis par la porte ou la fenêtre.
 */
export const NOT_EXPORTED: Readonly<Record<string, string>> = {
  'construction-dimension': 'cote (annotation)',
  'fabrics:section': 'repère de coupe (annotation)',
  'structural-grid': 'trame (repère)',
  separator: 'séparation de pièces (sans matière)',
}

const BY_NODE_TYPE = new Map(IFC_CLASSES.map((rule) => [rule.nodeType, rule]))

export function ifcClassOf(nodeType: string): IfcClassRule | undefined {
  return BY_NODE_TYPE.get(nodeType)
}
