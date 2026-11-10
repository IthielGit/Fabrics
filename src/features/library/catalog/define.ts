import { restyle } from '../primitives'
import type { Primitive, SymbolCategory, SymbolDef } from '../types'
import type { DrawFn } from '../templates/common'
import type { SymbolSpec } from './specs'

/** Hauteur typique par catégorie, en mm (réservée à la 3D, M8). */
const CATEGORY_HEIGHT: Record<SymbolCategory, number> = {
  living: 800,
  dining: 750,
  bedroom: 600,
  office: 750,
  storage: 1800,
  kitchen: 900,
  bathroom: 800,
  laundry: 900,
  stairs: 2700,
  electrical: 100,
  hvac: 600,
  safety: 300,
  outdoor: 1000,
  vehicles: 1500,
  hospitality: 900,
  'health-education': 800,
  leisure: 900,
  sets: 0,
}

/** Hauteur de pose d'un élément mural ou haut (mm). */
const ABOVE_ELEVATION = 1400

const floorTo10 = (value: number) => Math.max(10, Math.floor(value / 10) * 10)
const ceilTo10 = (value: number) => Math.ceil(value / 10) * 10

/**
 * Objet du catalogue à partir de sa fiche (`SymbolSpec`) et de son dessin de base.
 * Limites : de la moitié au double de la taille par défaut, élargies pour contenir toutes les
 * tailles rapides ; `fixed` n'a qu'une taille, `length` garde sa profondeur.
 * Les objets « au-dessus du plan de coupe » sont dessinés en pointillé, les zones en pointillé long.
 */
export function defineSymbol(spec: SymbolSpec, drawBase: DrawFn): SymbolDef {
  const sizes = (spec.sizes ?? []).map(([width, depth]) => ({
    label: spec.resize === 'ratio' ? `${width}` : `${width} × ${depth}`,
    width,
    depth,
  }))
  const widths = [spec.width, ...sizes.map((s) => s.width)]
  const depths = [spec.depth, ...sizes.map((s) => s.depth)]

  let min = { width: floorTo10(Math.min(spec.width * 0.5, ...widths)), depth: floorTo10(Math.min(spec.depth * 0.5, ...depths)) }
  let max = { width: ceilTo10(Math.max(spec.width * 2, ...widths)), depth: ceilTo10(Math.max(spec.depth * 2, ...depths)) }
  if (spec.resize === 'fixed') {
    min = { width: spec.width, depth: spec.depth }
    max = { width: spec.width, depth: spec.depth }
  } else if (spec.resize === 'length') {
    min = { ...min, depth: spec.depth }
    max = { ...max, depth: spec.depth }
  }

  const style = spec.zone ? 'zone' : spec.above ? 'above' : null
  const draw = (width: number, depth: number): Primitive[] => {
    const primitives = drawBase(width, depth)
    return style ? restyle(primitives, style) : primitives
  }

  return {
    id: spec.id,
    category: spec.category,
    width: spec.width,
    depth: spec.depth,
    sizes: sizes.length > 0 ? sizes : undefined,
    min,
    max,
    resize: spec.resize,
    mirrorable: spec.mirror === true,
    nominal: spec.nominal,
    zone: spec.zone,
    height: spec.zone ? 0 : spec.above ? 700 : CATEGORY_HEIGHT[spec.category],
    elevation: spec.above ? ABOVE_ELEVATION : undefined,
    draw,
  }
}
