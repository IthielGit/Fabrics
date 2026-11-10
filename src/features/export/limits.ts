import type { FabricsDocument } from '../../types/document'
import { PX_PER_MM_AT_ZOOM_1 } from '../units/scale'

/** Plus grand côté d'une image exportée (limite sûre du canvas sur Chrome, Firefox et Safari). */
export const MAX_SIDE_PX = 8192
/** Nombre total de pixels d'une image exportée (4096 × 4096). */
export const MAX_PIXELS = 16_777_216

/** Multiplicateurs de résolution proposés pour le PNG et le JPG (×0,5 évite l’impasse pour un A3, déjà au-dessus du plafond à ×1). */
export const IMAGE_MULTIPLIERS = [0.5, 1, 2, 3] as const

/** Résolution des PDF, en points par pouce. */
export const PDF_DPI = 200

const MM_PER_INCH = 25.4

export interface PixelSize {
  width: number
  height: number
}

/** Vrai si une image de cette taille respecte les deux plafonds. */
export function fitsPixelLimits(width: number, height: number): boolean {
  return width <= MAX_SIDE_PX && height <= MAX_SIDE_PX && width * height <= MAX_PIXELS
}

/**
 * Taille en pixels d'une image exportée. `width` et `height` sont dans l'unité du document :
 * 1 px = 1 px pour un Visuel ; pour un plan, ×1 vaut 0,2 px par mm (comme le zoom 100 %).
 */
export function imageExportSize(
  width: number,
  height: number,
  unit: FabricsDocument['unit'],
  multiplier: number,
): PixelSize {
  const perUnit = (unit === 'mm' ? PX_PER_MM_AT_ZOOM_1 : 1) * multiplier
  return {
    width: Math.max(1, Math.round(width * perUnit)),
    height: Math.max(1, Math.round(height * perUnit)),
  }
}

export interface ResolutionOption {
  multiplier: number
  size: PixelSize
  /** Faux si la taille dépasse un plafond : l'option est alors grisée. */
  allowed: boolean
}

export function resolutionOptions(
  width: number,
  height: number,
  unit: FabricsDocument['unit'],
): ResolutionOption[] {
  return IMAGE_MULTIPLIERS.map((multiplier) => {
    const size = imageExportSize(width, height, unit, multiplier)
    return { multiplier, size, allowed: fitsPixelLimits(size.width, size.height) }
  })
}

export interface PdfRaster {
  /** Résolution réellement utilisée (réduite si le plafond l'exige). */
  dpi: number
  size: PixelSize
}

/**
 * Taille de l'image à insérer dans un PDF pour une zone de `widthMm × heightMm` sur le papier,
 * à `dpi` points par pouce. Si les plafonds sont dépassés, la résolution est réduite d'autant.
 */
export function pdfRasterSize(widthMm: number, heightMm: number, dpi: number = PDF_DPI): PdfRaster {
  const sizeAt = (value: number): PixelSize => ({
    width: Math.max(1, Math.round((widthMm / MM_PER_INCH) * value)),
    height: Math.max(1, Math.round((heightMm / MM_PER_INCH) * value)),
  })
  let used = dpi
  let size = sizeAt(used)
  // On réduit par petits pas jusqu'à respecter les plafonds (au plus quelques itérations).
  while (!fitsPixelLimits(size.width, size.height) && used > 1) {
    used = Math.max(1, Math.floor(used * 0.9))
    size = sizeAt(used)
  }
  return { dpi: used, size }
}
