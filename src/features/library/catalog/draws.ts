import { drawBed, drawBunkBed, drawCrib } from '../templates/bed'
import { box, wallStrip } from '../templates/box'
import type { DrawFn } from '../templates/common'
import {
  drawFireplace,
  drawGrandPiano,
  drawPlant,
  drawPoint,
  drawRoundRug,
  drawRug,
  drawScreen,
  drawStove,
  drawUprightPiano,
} from '../templates/living'
import { drawBench, drawOfficeChair, seat } from '../templates/seat'
import { drawSofa, sofaL } from '../templates/sofa'
import { drawOvalTable, drawRectTable, drawRound, drawRoundTable } from '../templates/table'

/** Dessin de chaque objet du catalogue, par identifiant. Un objet sans dessin prend un simple contour. */
export const DRAWS: Record<string, DrawFn> = {}

function assign(ids: readonly string[], draw: DrawFn) {
  for (const id of ids) DRAWS[id] = draw
}

export const FALLBACK_DRAW: DrawFn = box('plain')

// --- Séjour et salon ---
assign(['sofa-2', 'sofa-3', 'sofa-bed'], drawSofa)
assign(['sofa-corner', 'sofa-modular'], sofaL('corner'))
assign(['sofa-chaise'], sofaL('chaise', 0.34))
assign(['daybed', 'bench', 'bench-dining', 'bench-bed', 'bench-hall'], drawBench)
assign(['armchair'], seat('armchair'))
assign(['armchair-wing'], seat('wing'))
assign(['pouf-square', 'side-table', 'console'], box('top'))
assign(['pouf-round', 'coffee-table-round', 'side-table-round', 'stool', 'stool-bar', 'umbrella-stand'], drawRound)
assign(['coffee-table', 'table-square', 'table-high'], drawRectTable)
assign(['tv-unit', 'sideboard', 'buffet-dining', 'display-cabinet'], box('doors'))
assign(['tv-wall'], wallStrip(400))
assign(['bookcase', 'shelving', 'shoe-rack', 'garage-rack'], box('shelves'))
assign(['fireplace'], drawFireplace)
assign(['wood-stove'], drawStove)
assign(['rug-rect'], drawRug)
assign(['rug-round'], drawRoundRug)
assign(['piano-upright'], drawUprightPiano)
assign(['piano-grand'], drawGrandPiano)
assign(['floor-lamp', 'coat-stand'], drawPoint)
assign(['plant-pot'], drawPlant)
assign(['room-divider'], drawScreen)

// --- Salle à manger ---
assign(['table-rect-4', 'table-rect-6', 'table-rect-8', 'table-rect-12'], drawRectTable)
assign(['table-round-4', 'table-round-6', 'table-round-8'], drawRoundTable)
assign(['table-oval'], drawOvalTable)
assign(['chair', 'chair-high-child'], seat('chair'))
assign(['chair-arm'], seat('arm'))

// --- Chambre ---
assign(['bed-single', 'bed-double', 'bed-queen', 'bed-king', 'bed-king-xl', 'bed-child'], drawBed)
assign(['bed-bunk'], drawBunkBed)
assign(['crib'], drawCrib)
assign(['nightstand', 'chest-drawers', 'dresser', 'vanity', 'desk-child', 'changing-table'], box('drawers'))
assign(['wardrobe-2', 'wardrobe-3', 'wardrobe-sliding', 'wardrobe-built-in'], box('doors'))
assign(['dressing-open'], box('open'))
assign(['mirror-standing'], wallStrip(600))
assign(['trunk', 'storage-chest'], box('top'))

// --- Rangements et entrée ---
assign(['cabinet-low', 'pantry-cabinet', 'tool-cabinet'], box('doors'))
assign(['cabinet-tall'], box('cross'))
assign(['shelf-wall'], box('shelves'))
assign(['coat-rack-wall'], wallStrip(200))
assign(['workbench'], box('drawers'))
assign(['bike-storage'], box('open'))
assign(['mailbox-indoor'], box('shelves'))

// --- Bureau (aperçu du lot F : sièges et tables déjà disponibles) ---
assign(['office-chair'], drawOfficeChair)
