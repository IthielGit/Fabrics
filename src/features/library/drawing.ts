import { mirrorPrimitives } from './primitives'
import type { Primitive, SymbolDef } from './types'

/** Dessin d'un objet posé (taille et retournement compris), prêt à afficher. */
export function drawSymbol(
  def: SymbolDef,
  width: number,
  depth: number,
  mirrored = false,
): Primitive[] {
  const primitives = def.draw(width, depth)
  return mirrored ? mirrorPrimitives(primitives, width) : primitives
}
