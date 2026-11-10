import type { FabricsDocument, Page } from '../../types/document'

export const MAX_IMAGE_BYTES = 20 * 1024 * 1024 // 20 Mo
export const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'] as const

export type ImageCheck = 'ok' | 'unsupported' | 'too-large'

/** Vérifie le type et la taille d'un fichier avant de l'importer. */
export function checkImageFile(file: { type: string; size: number }): ImageCheck {
  if (!(ACCEPTED_IMAGE_TYPES as readonly string[]).includes(file.type)) return 'unsupported'
  if (file.size > MAX_IMAGE_BYTES) return 'too-large'
  return 'ok'
}

/**
 * Taille d'une image importée : elle tient dans la moitié de la page, proportions conservées.
 * Sur un visuel (px), on ne l'agrandit jamais au-delà de sa taille d'origine ; sur un plan (mm),
 * les pixels de l'image n'ont pas de taille réelle : on l'ajuste à la moitié de la page.
 */
export function fitImageSize(
  natural: { width: number; height: number },
  page: Pick<Page, 'width' | 'height'>,
  unit: FabricsDocument['unit'],
): { width: number; height: number } {
  const maxScale = unit === 'px' ? 1 : Infinity
  const scale = Math.min(
    (page.width * 0.5) / natural.width,
    (page.height * 0.5) / natural.height,
    maxScale,
  )
  return { width: natural.width * scale, height: natural.height * scale }
}
