import { fr } from '../../i18n/fr'
import type { CanvasElement, Level } from '../../types/document'
import { defaultStairLengths, stairSize } from '../stairs/stairs'
import {
  createDimensionElement,
  createFurnitureElement,
  createOpeningElement,
  createRoofElement,
  createRoomElement,
  createSectionElement,
  createStairElement,
  createWallElement,
} from './elements'

/**
 * Contenu du plan d'exemple « maison à étage » (créé pour Fabrics). Tout est en mm.
 *
 * Faces intérieures : x de 4000 à 15000, y de 4000 à 10500. Les murs extérieurs ont leur axe à
 * 100 mm de ces faces (200 mm d'épaisseur) ; les cloisons sont des murs de 200 mm.
 */

const X0 = 3900 // axe du mur extérieur gauche
const X1 = 15100 // droite
const Y0 = 3900 // haut
const Y1 = 10600 // bas
const MID_X = 9000 // cloison qui sépare le séjour du reste
const MID_Y = 7200 // cloisons horizontales
const FOOT_X = 13400 // cloison du WC (rez-de-chaussée) et du dressing (étage)
const TOP_X = 12000 // cloison entre salle de bains et bureau (étage)

type Furniture = readonly [symbol: string, cx: number, cy: number, width: number, depth: number, rotation?: number]

/**
 * Pose un objet par son centre. La rotation (degrés, sens horaire) tourne l'objet autour de son coin
 * haut-gauche : on recalcule ce coin pour que le centre reste là où on le veut.
 */
function furniture(items: readonly Furniture[], names: Map<string, number>) {
  return items.map(([symbol, cx, cy, width, depth, rotation = 0]) => {
    const name = fr.examplePlan.items[symbol as keyof typeof fr.examplePlan.items] ?? symbol
    const count = (names.get(name) ?? 0) + 1
    names.set(name, count)
    const angle = (rotation * Math.PI) / 180
    const x = Math.round(cx - (width * Math.cos(angle) - depth * Math.sin(angle)) / 2)
    const y = Math.round(cy - (width * Math.sin(angle) + depth * Math.cos(angle)) / 2)
    return { ...createFurnitureElement(`${name} ${count}`, symbol, x, y, width, depth), rotation }
  })
}

function box(x1: number, y1: number, x2: number, y2: number): number[] {
  return [x1, y1, x2, y1, x2, y2, x1, y2]
}

export interface ExampleBuildInput {
  levels: readonly Level[]
  thickness: number
  height: number
}

/** Éléments des deux niveaux (rez-de-chaussée puis étage) et du toit. */
export function buildExampleElements({ levels, thickness, height }: ExampleBuildInput): CanvasElement[] {
  const [ground, upper] = levels
  const t = fr.examplePlan
  const wall = (name: string, points: number[]) => createWallElement(name, points, thickness, height)
  const outline = [X0, Y0, X1, Y0, X1, Y1, X0, Y1, X0, Y0]
  const names = new Map<string, number>()
  const onLevel = (levelId: string, elements: CanvasElement[]) => elements.map((el) => ({ ...el, levelId }))

  // --- Rez-de-chaussée ---------------------------------------------------------------------
  const outer0 = wall(t.outerWall, outline)
  const split0 = wall(t.partition, [MID_X, Y0, MID_X, Y1])
  const kitchenWall = wall(t.partition, [MID_X, MID_Y, X1, MID_Y])
  const wcWall = wall(t.partition, [FOOT_X, MID_Y, FOOT_X, Y1])
  // Segments du mur extérieur : 0 haut (gauche → droite), 1 droite (haut → bas),
  // 2 bas (droite → gauche), 3 gauche (bas → haut). `offset` = distance du début du segment au centre.
  const openings0 = [
    createOpeningElement('window', `${fr.elements.window} 1`, { wallId: outer0.id, segmentIndex: 0, offset: 2550, side: 'left' }),
    createOpeningElement('window', `${fr.elements.window} 2`, { wallId: outer0.id, segmentIndex: 0, offset: 8000, side: 'left' }),
    createOpeningElement('window', `${fr.elements.window} 3`, { wallId: outer0.id, segmentIndex: 1, offset: 1700, side: 'left' }),
    createOpeningElement('window', `${fr.elements.window} 4`, { wallId: outer0.id, segmentIndex: 1, offset: 5100, side: 'left' }),
    createOpeningElement('window', `${fr.elements.window} 5`, { wallId: outer0.id, segmentIndex: 3, offset: 3400, side: 'left' }),
    createOpeningElement('bay', `${fr.elements.bay} 1`, { wallId: outer0.id, segmentIndex: 2, offset: 8650, side: 'left' }),
    createOpeningElement('door', `${fr.elements.door} 1`, { wallId: outer0.id, segmentIndex: 2, offset: 4300, side: 'left' }),
    createOpeningElement('door', `${fr.elements.door} 2`, { wallId: split0.id, segmentIndex: 0, offset: 900, side: 'left' }),
    createOpeningElement('door', `${fr.elements.door} 3`, { wallId: split0.id, segmentIndex: 0, offset: 5000, side: 'left' }),
    createOpeningElement('door', `${fr.elements.door} 4`, { wallId: kitchenWall.id, segmentIndex: 0, offset: 1800, side: 'left' }),
    createOpeningElement('door', `${fr.elements.door} 5`, { wallId: wcWall.id, segmentIndex: 0, offset: 1700, side: 'left' }),
  ]
  const rooms0 = [
    createRoomElement(t.living, box(4000, 4000, 8900, 10500)),
    createRoomElement(t.kitchen, box(9100, 4000, 15000, 7100)),
    createRoomElement(t.hall, box(9100, 7300, 13300, 10500)),
    createRoomElement(t.wc, box(13500, 7300, 15000, 10500)),
  ]

  // Escalier : un L qui monte du hall vers l'étage, posé dans l'angle nord-est du hall.
  const rise = upper.elevation - ground.elevation
  const draft = createStairElement(t.stair, 'l', 0, 0, defaultStairLengths('l', rise))
  const size = stairSize(draft)
  // La trémie dépasse l'emprise de `voidMargin` : on laisse cette marge contre les murs du hall.
  const stair = { ...draft, x: 13300 - draft.voidMargin - size.width, y: 7300 + draft.voidMargin }

  const furniture0 = furniture(
    [
      // Séjour : coin salon (télé, canapé, table basse, tapis) puis coin repas.
      ['rug-rect', 6200, 5700, 1600, 2300],
      ['tv-unit', 4225, 5600, 2000, 450, 270],
      ['sofa-3', 7400, 5700, 2100, 900, 90],
      ['coffee-table', 6000, 5700, 1100, 600, 90],
      ['armchair', 5300, 6950, 850, 850, 180],
      ['plant-pot', 4300, 10200, 400, 400],
      ['table-rect-6', 6450, 8700, 1800, 900],
      ['chair', 5850, 7950, 450, 500],
      ['chair', 7050, 7950, 450, 500],
      ['chair', 5850, 9450, 450, 500, 180],
      ['chair', 7050, 9450, 450, 500, 180],
      ['chair', 5200, 8700, 450, 500, 270],
      ['chair', 7700, 8700, 450, 500, 90],
      ['sideboard', 4225, 8700, 1600, 450, 270],
      // Cuisine : plan de travail, îlot et tabourets.
      ['kitchen-linear', 11900, 4325, 3000, 650],
      ['fridge-freezer', 13700, 4325, 600, 650],
      ['kitchen-island', 12100, 5800, 1800, 900],
      ['stool-bar', 11600, 6450, 400, 400],
      ['stool-bar', 12600, 6450, 400, 400],
      // Hall : meuble d'entrée.
      ['shoe-rack', 9600, 10350, 800, 300, 180],
      ['coat-stand', 9300, 7550, 400, 400],
      // WC et buanderie.
      ['wc', 14500, 10150, 400, 700, 180],
      ['washbasin-small', 14850, 8900, 400, 300, 90],
      ['washing-machine', 14300, 7600, 600, 600],
    ],
    names,
  )

  // --- Étage -------------------------------------------------------------------------------
  const outer1 = wall(t.outerWall, outline)
  const split1 = wall(t.partition, [MID_X, Y0, MID_X, Y1])
  const left1 = wall(t.partition, [X0, MID_Y, MID_X, MID_Y]) // sépare les deux chambres
  const right1 = wall(t.partition, [MID_X, MID_Y, X1, MID_Y])
  const top1 = wall(t.partition, [TOP_X, Y0, TOP_X, MID_Y])
  const foot1 = wall(t.partition, [FOOT_X, MID_Y, FOOT_X, Y1])
  const openings1 = [
    createOpeningElement('window', `${fr.elements.window} 1`, { wallId: outer1.id, segmentIndex: 0, offset: 2550, side: 'left' }),
    createOpeningElement('window', `${fr.elements.window} 2`, { wallId: outer1.id, segmentIndex: 0, offset: 7600, side: 'left' }),
    createOpeningElement('window', `${fr.elements.window} 3`, { wallId: outer1.id, segmentIndex: 0, offset: 10100, side: 'left' }),
    createOpeningElement('window', `${fr.elements.window} 4`, { wallId: outer1.id, segmentIndex: 1, offset: 1700, side: 'left' }),
    createOpeningElement('window', `${fr.elements.window} 6`, { wallId: outer1.id, segmentIndex: 2, offset: 8650, side: 'left' }),
    createOpeningElement('window', `${fr.elements.window} 7`, { wallId: outer1.id, segmentIndex: 3, offset: 1700, side: 'left' }),
    createOpeningElement('window', `${fr.elements.window} 8`, { wallId: outer1.id, segmentIndex: 3, offset: 5100, side: 'left' }),
    createOpeningElement('door', `${fr.elements.door} 1`, { wallId: split1.id, segmentIndex: 0, offset: 1900, side: 'left' }),
    createOpeningElement('door', `${fr.elements.door} 2`, { wallId: split1.id, segmentIndex: 0, offset: 5000, side: 'left' }),
    createOpeningElement('door', `${fr.elements.door} 3`, { wallId: right1.id, segmentIndex: 0, offset: 1500, side: 'left' }),
    createOpeningElement('door', `${fr.elements.door} 4`, { wallId: right1.id, segmentIndex: 0, offset: 3600, side: 'left' }),
    createOpeningElement('door', `${fr.elements.door} 5`, { wallId: foot1.id, segmentIndex: 0, offset: 1700, side: 'left' }),
  ]
  const rooms1 = [
    createRoomElement(t.bedroom, box(4000, 4000, 8900, 7100)),
    createRoomElement(t.bedroom2, box(4000, 7300, 8900, 10500)),
    createRoomElement(t.bathroom, box(9100, 4000, 11900, 7100)),
    createRoomElement(t.office, box(12100, 4000, 15000, 7100)),
    createRoomElement(t.landing, box(9100, 7300, 13300, 10500)),
    createRoomElement(t.dressing, box(13500, 7300, 15000, 10500)),
  ]
  const furniture1 = furniture(
    [
      // Chambre parentale
      ['bed-queen', 6450, 5000, 1600, 2000],
      ['nightstand', 5350, 4200, 450, 400],
      ['nightstand', 7550, 4200, 450, 400],
      ['wardrobe-sliding', 6450, 6775, 2000, 650, 180],
      // Chambre 2
      ['bed-single', 5000, 7950, 900, 2000, 270],
      ['wardrobe-2', 8000, 7600, 1000, 600],
      ['desk', 6450, 10125, 1400, 700, 180],
      ['office-chair', 6450, 9400, 600, 600],
      // Salle de bains
      ['bathtub', 10250, 4400, 1700, 700],
      ['vanity-unit', 11650, 5700, 800, 460, 90],
      ['wc', 9450, 6300, 400, 700, 270],
      // Bureau
      ['desk-executive', 13550, 4650, 1800, 900],
      ['office-chair', 13550, 5450, 600, 600, 180],
      ['bookcase', 14200, 6950, 1200, 300, 180],
      // Dressing
      ['dressing-open', 14700, 8900, 1800, 600, 90],
    ],
    names,
  )
  const roof = createRoofElement(t.roof, [X0 - 100, Y0 - 100, X1 + 100, Y0 - 100, X1 + 100, Y1 + 100, X0 - 100, Y1 + 100], 'gable')

  // Cotes du rez-de-chaussée ; la ligne de coupe est commune à tous les niveaux.
  const dimensions = [
    createDimensionElement(t.overallWidth, [X0 - 100, Y0 - 100, X1 + 100, Y0 - 100], -900),
    createDimensionElement(t.overallDepth, [X0 - 100, Y0 - 100, X0 - 100, Y1 + 100], 900),
    createDimensionElement(t.livingWidth, [4000, Y1 + 100, 8900, Y1 + 100], 900),
  ]
  const section = createSectionElement(t.section, 'A', [11000, 3200, 11000, 11300])

  return [
    ...onLevel(ground.id, [outer0, split0, kitchenWall, wcWall, ...rooms0, ...openings0, stair, ...furniture0, ...dimensions]),
    ...onLevel(upper.id, [outer1, split1, left1, right1, top1, foot1, ...rooms1, ...openings1, ...furniture1, roof]),
    section,
  ]
}
