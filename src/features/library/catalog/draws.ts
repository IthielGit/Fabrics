import { appliance, dryingRack, ironingBoard } from '../templates/appliance'
import { drawBed, drawBunkBed, drawCrib } from '../templates/bed'
import {
  basket,
  bathtub,
  bidet,
  grabBar,
  shower,
  showerSeat,
  toilet,
  toiletCubicle,
  toiletPmr,
  towelRadiator,
  urinal,
  vanityUnit,
  washbasin,
  wellness,
  whirlpool,
} from '../templates/bathroom'
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
import { desk, cornerDesk, lounge, phoneBooth, printer } from '../templates/office'
import { ladderStair, lift, ramp, shaft, spiralStair, straightStair, turningStair, escalator } from '../templates/stairs'
import { barTop, bin, cooker, cornerUnit, hob, kitchen, peninsula, sink, trolley } from '../templates/kitchen'
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

// --- Cuisine ---
assign(['kitchen-base'], box('doors'))
assign(['kitchen-base-drawers'], box('drawers'))
assign(['kitchen-wall'], box('doors'))
assign(['kitchen-corner', 'kitchen-corner-wall'], cornerUnit)
assign(['kitchen-tall'], box('cross'))
assign(['worktop', 'kitchen-island', 'coffee-station'], box('top'))
assign(['sink-kitchen-1', 'sink-utility-kitchen', 'utility-sink'], sink(1))
assign(['sink-kitchen-1d'], sink(1, true))
assign(['sink-kitchen-2'], sink(2))
assign(['hob-4'], hob(4))
assign(['hob-5'], hob(5))
assign(['hob-induction'], hob(4, true))
assign(['cooker'], cooker)
assign(['oven-built-in'], appliance('oven'))
assign(['microwave'], appliance('microwave'))
assign(['hood', 'hood-island'], appliance('hood'))
assign(['fridge', 'fridge-freezer', 'freezer'], appliance('fridge'))
assign(['fridge-side'], appliance('fridge-side'))
assign(['freezer-chest'], appliance('chest'))
assign(['dishwasher'], appliance('dishwasher'))
assign(['wine-cooler'], appliance('wine'))
assign(['breakfast-bar', 'kitchen-bar-counter'], barTop)
assign(['kitchen-trolley'], trolley)
assign(['pantry-walk-in'], box('open'))
assign(['trash-bin-kitchen'], bin)
assign(['table-kitchen'], drawRectTable)
assign(['kitchen-peninsula'], peninsula)
assign(['kitchenette'], kitchen('kitchenette'))
assign(['kitchen-linear'], kitchen('linear'))
assign(['kitchen-parallel'], kitchen('parallel'))
assign(['kitchen-l'], kitchen('l'))
assign(['kitchen-l-island'], kitchen('l-island'))
assign(['kitchen-u'], kitchen('u'))
assign(['kitchen-american'], kitchen('american'))
assign(['kitchen-american-l'], kitchen('american-l'))
assign(['kitchen-american-island'], kitchen('american-island'))

// --- Salle de bain et sanitaires ---
assign(['wc'], toilet('floor'))
assign(['wc-wall'], toilet('wall'))
assign(['wc-child'], toilet('child'))
assign(['urinal'], urinal)
assign(['bidet'], bidet)
assign(['washbasin', 'washbasin-small', 'washbasin-pmr'], washbasin(1))
assign(['washbasin-double'], washbasin(2))
assign(['vanity-unit'], vanityUnit)
assign(['basin-vessel'], drawRound)
assign(['shower-square', 'shower-rect'], shower('square'))
assign(['shower-corner'], shower('corner'))
assign(['shower-walk-in'], shower('walk-in'))
assign(['shower-pmr'], shower('pmr'))
assign(['bathtub'], bathtub('rect'))
assign(['bathtub-corner'], bathtub('corner'))
assign(['bathtub-freestanding'], bathtub('free'))
assign(['bathtub-small'], bathtub('small'))
assign(['whirlpool'], whirlpool)
assign(['sauna'], wellness('sauna'))
assign(['hammam'], wellness('hammam'))
assign(['towel-radiator'], towelRadiator)
assign(['mirror-wall'], wallStrip(400))
assign(['bathroom-cabinet'], box('doors'))
assign(['bathroom-shelf', 'baby-changing-wall'], box('top'))
assign(['laundry-basket', 'wc-brush-bin'], basket)
assign(['wc-pmr'], toiletPmr)
assign(['grab-bar'], grabBar)
assign(['shower-seat'], showerSeat)
assign(['toilet-cubicle'], toiletCubicle)

// --- Buanderie et technique domestique ---
assign(['washing-machine'], appliance('washer'))
assign(['dryer'], appliance('dryer'))
assign(['washer-dryer-column'], appliance('column'))
assign(['ironing-board'], ironingBoard)
assign(['drying-rack'], dryingRack)
assign(['water-heater', 'buffer-tank'], drawRound)
assign(['boiler-wall', 'boiler-floor'], appliance('boiler'))
assign(['water-softener'], appliance('softener'))
assign(['vmc-unit'], appliance('vmc'))
assign(['electrical-panel'], box('shelves'))
assign(['meter-cupboard'], box('doors'))

// --- Escaliers et circulation verticale ---
assign(['stair-straight'], straightStair)
assign(['stair-quarter'], turningStair('quarter'))
assign(['stair-half'], turningStair('half'))
assign(['stair-l'], turningStair('l'))
assign(['stair-u'], turningStair('u'))
assign(['stair-spiral'], spiralStair)
assign(['stair-ladder'], ladderStair)
assign(['ramp', 'ramp-pmr'], ramp)
assign(['lift', 'lift-pmr', 'lift-goods', 'platform-lift'], lift)
assign(['escalator'], escalator)
assign(['shaft', 'stair-opening'], shaft)

// --- Bureau et travail ---
assign(['desk', 'desk-standing'], desk(1))
assign(['desk-corner'], cornerDesk)
assign(['desk-executive'], desk(1, true))
assign(['desk-double'], desk(2))
assign(['chair-visitor'], seat('chair'))
assign(['meeting-table-6', 'meeting-table-10'], drawRectTable)
assign(['meeting-table-round'], drawRoundTable)
assign(['reception-desk'], barTop)
assign(['filing-pedestal', 'filing-cabinet'], box('drawers'))
assign(['shelf-unit'], box('shelves'))
assign(['lockers'], box('doors'))
assign(['whiteboard'], wallStrip(600))
assign(['printer', 'copier'], printer)
assign(['server-rack'], box('open'))
assign(['phone-booth'], phoneBooth)
assign(['lounge-office'], lounge)
assign(['plant-office'], drawPlant)
