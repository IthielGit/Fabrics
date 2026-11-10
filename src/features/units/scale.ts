import type { FabricsDocument } from '../../types/document'

/** 1 mm = 0,2 px à zoom 100 % (donc 1 m = 200 px). Voir docs/02-ARCHITECTURE.md. */
export const PX_PER_MM_AT_ZOOM_1 = 0.2

/** Nombre de pixels écran par unité du document à zoom 100 %. */
export function pxPerUnit(unit: FabricsDocument['unit']): number {
  return unit === 'mm' ? PX_PER_MM_AT_ZOOM_1 : 1
}
