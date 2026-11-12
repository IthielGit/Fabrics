import { fr } from '../../i18n/fr'
import type { CanvasElement, Level, OpeningElement, WallElement } from '../../types/document'
import { defaultStairLengths, stairSize } from '../stairs/stairs'
import {
  createDimensionElement,
  createOpeningElement,
  createPlatformElement,
  createRoofElement,
  createRoomElement,
  createSectionElement,
  createStairElement,
  createWallElement,
} from './elements'
import { box, furniture, WC_WINDOW, type Furniture } from './examplePlan'

/**
 * Contenu du plan d'exemple « grande maison R+3 » (créé pour Fabrics). Tout est en mm.
 *
 * Emprise hors tout : 12000 × 10000 mm (120 m² au sol). Faces intérieures : x de 4000 à 15600,
 * y de 4000 à 13600. Trois bandes : pièces à gauche, circulation et escalier en U au centre, pièces à
 * droite. Les escaliers des niveaux 0 à 2 sont empilés au même endroit.
 *
 * Autour : garage deux voitures accolé à l'est (toit plat, terrasse dessus à l'étage 1), véranda
 * vitrée au sud du séjour, terrasse en L et plage de piscine au sud (plateformes).
 */

const X0 = 3900 // axe du mur extérieur gauche
const X1 = 15700 // droite
const Y0 = 3900 // haut
const Y1 = 13700 // bas
const LEFT_X = 8500 // cloison entre les pièces de gauche et la circulation
const RIGHT_X = 11500 // cloison entre la circulation et les pièces de droite
const MID_Y = 8800 // cloisons horizontales
const WC_X = 13600 // cloison entre buanderie et WC (rez-de-chaussée)
const STAIR_CENTER_X = 10000

// Annexes du rez-de-chaussée (axes des murs) : garage à l'est, véranda au sud du séjour.
const GARAGE_X = 21900 // mur est du garage
const GARAGE_Y = 10100 // mur sud du garage
const VERANDA_X = 9100 // mur est de la véranda
const VERANDA_Y = 17700 // mur sud de la véranda
const GARAGE = box(15800, 4000, 21800, 10000)
const VERANDA = box(4000, 13800, 9000, 17600)
/** Terrasse en L : devant l'entrée et au sud du garage. */
const TERRACE = [9300, 13800, 15800, 13800, 15800, 10200, 21800, 10200, 21800, 16000, 9300, 16000]
/** Bassin de 10000 × 5000 mm, posé au niveau du jardin. */
const POOL = { x1: 10550, y1: 16800, x2: 20550, y2: 21800 }
/**
 * Plage de la piscine : un U qui borde le bassin sur trois côtés (pas de trou dans une plateforme),
 * pour que la piscine reste visible en creux en 3D.
 */
const POOL_DECK = [
  9300, 16000, 21800, 16000, 21800, 22400, POOL.x2, 22400, POOL.x2, POOL.y1,
  POOL.x1, POOL.y1, POOL.x1, 22400, 9300, 22400,
]
/** Hauteur du dessus des terrasses au-dessus du sol (mm). */
const TERRACE_ELEVATION = 150
const ROOF_TERRACE_ELEVATION = 100
/** Couleurs des plateformes : lames de bois pour les terrasses, pierre claire autour de la piscine. */
const WOOD_DECK = '#b58a5c'
const STONE_DECK = '#d8d3c6'

const LEFT_TOP = box(4000, 4000, 8400, 8700)
const LEFT_BOTTOM = box(4000, 8900, 8400, 13600)
const LEFT_WHOLE = box(4000, 4000, 8400, 13600)
const MIDDLE = box(8600, 4000, 11400, 13600)
const RIGHT_TOP = box(11600, 4000, 15600, 8700)
const RIGHT_BOTTOM = box(11600, 8900, 15600, 13600)

interface LevelLayout {
  /** Une cloison coupe la bande de gauche en deux pièces. */
  leftSplit: boolean
  rooms: [name: string, points: number[]][]
  furniture: Furniture[]
}

function layouts(): LevelLayout[] {
  const t = fr.largeHouse
  return [
    {
      leftSplit: false,
      rooms: [
        [t.living, LEFT_WHOLE],
        [t.hall, MIDDLE],
        [t.kitchen, RIGHT_TOP],
        [t.laundry, box(11600, 8900, 13500, 13600)],
        [t.wc, box(13700, 8900, 15600, 13600)],
        [t.garage, GARAGE],
        [t.veranda, VERANDA],
      ],
      furniture: [
        // Séjour : salon au nord, repas au sud.
        ['rug-rect', 6400, 6200, 1600, 2300],
        ['sofa-3', 5000, 6200, 2100, 900, 270],
        ['coffee-table', 6400, 6200, 1100, 600, 90],
        ['tv-unit', 8175, 6200, 2000, 450, 90],
        ['armchair', 6400, 4600, 850, 850],
        ['table-rect-6', 6200, 11300, 1800, 900],
        ['chair', 5600, 10550, 450, 500],
        ['chair', 6800, 10550, 450, 500],
        ['chair', 5600, 12050, 450, 500, 180],
        ['chair', 6800, 12050, 450, 500, 180],
        ['chair', 4950, 11300, 450, 500, 270],
        ['chair', 7450, 11300, 450, 500, 90],
        ['sideboard', 8175, 11900, 1600, 450, 90],
        // Hall
        ['shoe-rack', 8750, 12500, 800, 300, 270],
        ['console', 11250, 9300, 1000, 300, 90],
        ['coat-stand', 11100, 13200, 400, 400],
        // Cuisine
        ['kitchen-linear', 13600, 4325, 3600, 650],
        ['kitchen-island', 13600, 6200, 2400, 1000],
        ['stool-bar', 12900, 7000, 400, 400],
        ['stool-bar', 13600, 7000, 400, 400],
        ['stool-bar', 14300, 7000, 400, 400],
        // Buanderie et WC
        ['washing-machine', 11900, 9200, 600, 600],
        ['dryer', 12550, 9225, 600, 650],
        ['utility-sink', 13175, 9150, 600, 500],
        ['water-heater', 13200, 13300, 500, 500],
        ['wc', 15250, 12500, 400, 700, 90],
        ['washbasin-small', 15450, 10000, 400, 300, 90],
        // Garage : deux voitures face à la porte est.
        ['car-suv', 19000, 5600, 1950, 4700, 90],
        ['car', 19000, 8400, 1800, 4500, 90],
        ['garage-rack', 16050, 5000, 1200, 500, 270],
        // Véranda
        ['sofa-3', 6500, 17100, 2100, 900, 180],
        ['armchair', 4600, 15700, 850, 850, 270],
        ['armchair', 8400, 15700, 850, 850, 90],
        ['coffee-table-round', 6500, 15700, 800, 800],
        ['plant-pot', 4300, 14100, 400, 400],
        ['plant-pot', 8700, 14100, 400, 400],
        // Terrasse : repas dehors sous parasol, cuisine d'été contre le garage.
        ['outdoor-kitchen', 18800, 10550, 2400, 700],
        ['table-garden', 18800, 12800, 1600, 900],
        ['chair-garden', 18400, 11900, 550, 600],
        ['chair-garden', 19200, 11900, 550, 600],
        ['chair-garden', 18400, 13700, 550, 600, 180],
        ['chair-garden', 19200, 13700, 550, 600, 180],
        ['parasol', 18800, 12800, 3000, 3000],
        // Plage de la piscine
        ['swimming-pool', (POOL.x1 + POOL.x2) / 2, (POOL.y1 + POOL.y2) / 2, POOL.x2 - POOL.x1, POOL.y2 - POOL.y1],
        ['sun-lounger', 9900, 17400, 700, 2000],
        ['sun-lounger', 9900, 19700, 700, 2000],
        ['sun-lounger', 21175, 18300, 700, 2000],
      ],
    },
    {
      leftSplit: true,
      rooms: [
        [t.bedroom1, LEFT_TOP],
        [t.bedroom2, LEFT_BOTTOM],
        [t.landing, MIDDLE],
        [t.bedroom3, RIGHT_TOP],
        [t.bathroom, RIGHT_BOTTOM],
      ],
      furniture: [
        // Chambre 1
        ['bed-queen', 6200, 5000, 1600, 2000],
        ['nightstand', 5150, 4200, 450, 400],
        ['nightstand', 7250, 4200, 450, 400],
        ['wardrobe-sliding', 6000, 8375, 2000, 650, 180],
        // Chambre 2
        ['bed-double', 4950, 11250, 1400, 1900, 270],
        ['nightstand', 4200, 10250, 450, 400, 270],
        ['nightstand', 4200, 12250, 450, 400, 270],
        ['desk', 6200, 13250, 1400, 700, 180],
        ['office-chair', 6200, 12500, 600, 600],
        ['wardrobe-2', 8100, 12500, 1000, 600, 90],
        // Chambre 3
        ['bed-double', 13600, 4950, 1400, 1900],
        ['nightstand', 12650, 4200, 450, 400],
        ['nightstand', 14550, 4200, 450, 400],
        ['wardrobe-3', 14600, 8400, 1500, 600, 180],
        ['desk', 11950, 6200, 1400, 700, 270],
        // Salle de bains
        ['bathtub', 14650, 9250, 1700, 700],
        ['shower-rect', 15000, 13200, 1200, 800, 180],
        ['washbasin-double', 15350, 11300, 1400, 500, 90],
        ['wc', 11950, 12500, 400, 700, 270],
        // Palier
        ['plant-pot', 11100, 13300, 400, 400],
        // Terrasse de l'étage, sur le toit du garage.
        ['sun-lounger', 20600, 5300, 700, 2000],
        ['sun-lounger', 21400, 5300, 700, 2000],
        ['table-garden', 18500, 7500, 1600, 900],
        ['chair-garden', 18100, 6700, 550, 600],
        ['chair-garden', 18900, 6700, 550, 600],
        ['chair-garden', 18100, 8300, 550, 600, 180],
        ['chair-garden', 18900, 8300, 550, 600, 180],
        ['planter-box', 17000, 4250, 1500, 500],
        ['planter-box', 17000, 9750, 1500, 500, 180],
      ],
    },
    {
      leftSplit: true,
      rooms: [
        [t.suite, LEFT_TOP],
        [t.kidsRoom, LEFT_BOTTOM],
        [t.landing, MIDDLE],
        [t.suiteBathroom, RIGHT_TOP],
        [t.bedroom5, RIGHT_BOTTOM],
      ],
      furniture: [
        // Suite parentale
        ['bed-king', 6200, 5000, 1800, 2000],
        ['nightstand', 5000, 4200, 450, 400],
        ['nightstand', 7400, 4200, 450, 400],
        ['armchair', 4600, 7900, 850, 850],
        // Chambre des enfants
        ['bed-single', 5000, 10000, 900, 2000, 270],
        ['bed-single', 5000, 12500, 900, 2000, 270],
        ['desk-child', 8125, 12500, 1100, 550, 90],
        ['chest-drawers', 8175, 11300, 800, 450, 90],
        // Salle de bains parentale
        ['washbasin-double', 13600, 4250, 1400, 500],
        ['bathtub-freestanding', 13600, 5800, 1700, 800],
        ['shower-walk-in', 15150, 7700, 1200, 900, 90],
        ['wc', 11950, 5000, 400, 700, 270],
        // Chambre 5
        ['bed-queen', 14600, 11250, 1600, 2000, 90],
        ['nightstand', 15400, 9950, 450, 400, 90],
        ['nightstand', 15400, 12550, 450, 400, 90],
        ['wardrobe-3', 12400, 13300, 1500, 600, 180],
      ],
    },
    {
      leftSplit: false,
      rooms: [
        [t.playroom, LEFT_WHOLE],
        [t.landing, MIDDLE],
        [t.office, RIGHT_TOP],
        [t.guestRoom, RIGHT_BOTTOM],
      ],
      furniture: [
        // Salle de jeux
        ['rug-round', 6200, 6000, 2000, 2000],
        ['sofa-3', 6200, 4500, 2100, 900],
        ['coffee-table-round', 6200, 6000, 800, 800],
        ['tv-unit', 6200, 7500, 2000, 450, 180],
        ['table-square', 6200, 11000, 900, 900],
        ['chair', 6200, 10300, 450, 500],
        ['chair', 6200, 11700, 450, 500, 180],
        ['chair', 5500, 11000, 450, 500, 270],
        ['chair', 6900, 11000, 450, 500, 90],
        ['bookcase', 4150, 11000, 900, 300, 270],
        // Bureau
        ['desk-executive', 13600, 4650, 1800, 900],
        ['office-chair', 13600, 5450, 600, 600, 180],
        ['chair-visitor', 13100, 6300, 550, 550, 180],
        ['chair-visitor', 14100, 6300, 550, 550, 180],
        ['bookcase', 15450, 7000, 900, 300, 90],
        ['sofa-2', 13600, 8250, 1600, 900, 180],
        // Chambre d'amis
        ['bed-double', 14650, 11250, 1400, 1900, 90],
        ['nightstand', 15400, 10100, 450, 400, 90],
        ['nightstand', 15400, 12400, 450, 400, 90],
        ['wardrobe-2', 12300, 13300, 1000, 600, 180],
      ],
    },
  ]
}

export interface LargeHouseBuildInput {
  /** Quatre niveaux, du rez-de-chaussée au 3e étage. */
  levels: readonly Level[]
  thickness: number
  height: number
}

/** Éléments des quatre niveaux, du toit, des cotes et de la ligne de coupe. */
export function buildLargeHouseElements({ levels, thickness, height }: LargeHouseBuildInput): CanvasElement[] {
  const t = fr.largeHouse
  const outline = [X0, Y0, X1, Y0, X1, Y1, X0, Y1, X0, Y0]
  const names = new Map<string, number>()
  const elements: CanvasElement[] = []

  layouts().forEach((layout, index) => {
    const level = levels[index]
    const isGround = index === 0
    const isTop = index === levels.length - 1
    const wall = (name: string, points: number[]): WallElement => createWallElement(name, points, thickness, height)
    const outer: WallElement = { ...wall(t.outerWall, outline), material: 'masonry' }
    const left = wall(t.partition, [LEFT_X, Y0, LEFT_X, Y1])
    const right = wall(t.partition, [RIGHT_X, Y0, RIGHT_X, Y1])
    const walls = [outer, left, right, wall(t.partition, [RIGHT_X, MID_Y, X1, MID_Y])]
    if (layout.leftSplit) walls.push(wall(t.partition, [X0, MID_Y, LEFT_X, MID_Y]))
    const wcWall = isGround ? wall(t.partition, [WC_X, MID_Y, WC_X, Y1]) : null
    if (wcWall) walls.push(wcWall)
    // Garage et véranda : murs en U qui s'appuient sur le mur extérieur de la maison.
    // Garage : segments 0 nord, 1 est, 2 sud. Véranda : segments 0 ouest, 1 sud, 2 est.
    const garageWall: WallElement | null = isGround
      ? { ...wall(t.garageWall, [X1, Y0, GARAGE_X, Y0, GARAGE_X, GARAGE_Y, X1, GARAGE_Y]), material: 'brick' }
      : null
    const verandaWall: WallElement | null = isGround
      ? { ...wall(t.verandaWall, [X0, Y1, X0, VERANDA_Y, VERANDA_X, VERANDA_Y, VERANDA_X, Y1]), material: 'masonry' }
      : null
    if (garageWall) walls.push(garageWall)
    if (verandaWall) walls.push(verandaWall)

    const counts = { door: 0, window: 0, bay: 0 }
    const opening = (
      kind: OpeningElement['kind'],
      host: WallElement,
      segmentIndex: number,
      offset: number,
      size: Partial<Pick<OpeningElement, 'width' | 'height' | 'sillHeight' | 'style'>> = {},
    ): OpeningElement => {
      counts[kind] += 1
      return {
        ...createOpeningElement(kind, `${fr.elements[kind]} ${counts[kind]}`, {
          wallId: host.id,
          segmentIndex,
          offset,
          side: 'left',
        }),
        ...size,
      }
    }
    // Grande baie coulissante (véranda, accès à la terrasse de l'étage).
    const wideBay = (host: WallElement, segmentIndex: number, offset: number, width: number) =>
      opening('bay', host, segmentIndex, offset, { width, style: 'bay-sliding' })
    // Façade est : au rez-de-chaussée elle donne dans le garage (porte de service vers la cuisine),
    // à l'étage 1 sur la terrasse du toit du garage (baie depuis la chambre 3).
    const eastOpening = isGround
      ? opening('door', outer, 1, 4100)
      : index === 1
        ? wideBay(outer, 1, 2450, 2400)
        : opening('window', outer, 1, 2450, index === 2 ? WC_WINDOW : {})
    // Segments du mur extérieur : 0 haut (gauche → droite), 1 droite (haut → bas),
    // 2 bas (droite → gauche), 3 gauche (bas → haut). `offset` = distance du début du segment au centre.
    // Les têtes de lit ne doivent pas être devant une fenêtre : aux étages 1 et 2, la fenêtre nord de
    // la chambre de gauche est décalée à côté du lit (le lit est centré en x = 6200), celle de la
    // chambre de droite (étage 1, lit en x = 13600) est supprimée (elle a déjà la baie est), et la
    // fenêtre ouest de la chambre 2 (étage 1, tête de lit à l'ouest) est supprimée aussi.
    // Les lits de l'étage 2 (chambre 5) et du 3e étage (chambre d'amis) ont leur tête à l'est : pas de fenêtre est.
    // Salles de bains avec WC (étages 1 et 2) : mêmes fenêtres petites et hautes que les WC.
    const bedLevel = index === 1 || index === 2
    const openings = [
      bedLevel ? opening('window', outer, 0, 4000, { width: 900 }) : opening('window', outer, 0, 2300),
      ...(index === 1 ? [] : [opening('window', outer, 0, 9700, index === 2 ? WC_WINDOW : {})]),
      eastOpening,
      // Au rez-de-chaussée, la fenêtre du WC est petite et haute (600 × 600 mm, allège à 1500 mm),
      // centrée sur la cuvette.
      ...(isGround
        ? [opening('window', outer, 1, 8600, WC_WINDOW)]
        : index === 2 || index === 3
          ? []
          : [opening('window', outer, 1, 7350, WC_WINDOW)]),
      opening('window', outer, 3, 7350),
      ...(index === 1 ? [] : [opening('window', outer, 3, 2450)]),
      // Portes depuis la circulation (cloisons verticales, de haut en bas).
      ...(layout.leftSplit ? [opening('door', left, 0, 3900)] : []),
      opening('door', left, 0, 5900),
      opening('door', right, 0, 3900),
      opening('door', right, 0, isGround ? 7100 : 5900),
    ]
    if (isGround) {
      openings.push(
        opening('bay', outer, 2, 9500),
        opening('door', outer, 2, 5700), // porte d'entrée
        opening('window', outer, 2, 3150),
        opening('window', outer, 2, 1050),
        opening('door', wcWall as WallElement, 0, 2200),
        // Porte sectionnelle de 5000 mm à l'est du garage.
        opening('door', garageWall as WallElement, 1, 3100, { width: 5000, height: 2200, style: 'garageSectional' }),
        // Véranda vitrée sur trois côtés.
        wideBay(verandaWall as WallElement, 0, 2000, 3000),
        wideBay(verandaWall as WallElement, 1, 2600, 4400),
        wideBay(verandaWall as WallElement, 2, 2000, 3000),
      )
    } else {
      openings.push(opening('window', outer, 2, 9500), opening('window', outer, 2, 5700), opening('window', outer, 2, 2100, index === 1 ? WC_WINDOW : {}))
    }

    const rooms = layout.rooms.map(([name, points]) => createRoomElement(name, points))
    const platforms = isGround
      ? [
          { ...createPlatformElement(t.terrace, TERRACE, TERRACE_ELEVATION), fill: WOOD_DECK },
          { ...createPlatformElement(t.poolDeck, POOL_DECK, TERRACE_ELEVATION), fill: STONE_DECK },
        ]
      : index === 1
        ? [{ ...createPlatformElement(t.roofTerrace, GARAGE, ROOF_TERRACE_ELEVATION), fill: WOOD_DECK }]
        : []
    const levelElements: CanvasElement[] = [...walls, ...rooms, ...platforms, ...openings]

    // Escalier en U au centre, du niveau courant au suivant ; la marge laisse la trémie dans le palier.
    const upper = levels[index + 1]
    if (upper) {
      const draft = createStairElement(t.stair, 'u', 0, 0, defaultStairLengths('u', upper.elevation - level.elevation))
      const size = stairSize(draft)
      levelElements.push({ ...draft, x: STAIR_CENTER_X - Math.round(size.width / 2), y: 4000 + 2 * draft.voidMargin })
    }
    levelElements.push(...furniture(layout.furniture, names))
    if (isTop) {
      levelElements.push({
        ...createRoofElement(t.roof, [X0 - 100, Y0 - 100, X1 + 100, Y0 - 100, X1 + 100, Y1 + 100, X0 - 100, Y1 + 100], 'gable'),
        covering: 'tiles',
      })
    }
    if (isGround) {
      levelElements.push(
        createDimensionElement(t.overallWidth, [X0 - 100, Y0 - 100, X1 + 100, Y0 - 100], -900),
        createDimensionElement(t.overallDepth, [X0 - 100, Y0 - 100, X0 - 100, Y1 + 100], 900),
      )
    }
    elements.push(...levelElements.map((el) => ({ ...el, levelId: level.id })))
  })

  // La ligne de coupe traverse l'escalier ; elle est commune à tous les niveaux.
  elements.push(createSectionElement(t.section, 'A', [STAIR_CENTER_X, 3000, STAIR_CENTER_X, 23200]))
  return elements
}
