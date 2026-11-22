import type { Pdf } from './pdf'

/**
 * Polices intégrées aux PDF de feuilles (M20 20.6) : Liberation Sans (SIL OFL 1.1, fichiers de Pascal,
 * notice dans `THIRD_PARTY_NOTICES.md`), mêmes chasses qu'Helvetica et Arial : les mises en page et la
 * détection des conflits restent valables. Une feuille garde Helvetica (police standard, non intégrée)
 * si les fichiers ne peuvent pas être chargés.
 */

/** Nom de la famille dans le PDF. */
export const SHEET_FONT = 'LiberationSans'

export type SheetFontStyle = 'normal' | 'bold' | 'italic'

const FILES = {
  normal: new URL('../../../packages/pascal/packages/editor/src/lib/floorplan/pdf-fonts/LiberationSans-Regular.ttf', import.meta.url),
  bold: new URL('../../../packages/pascal/packages/editor/src/lib/floorplan/pdf-fonts/LiberationSans-Bold.ttf', import.meta.url),
} as const

/** Lit un fichier de police ; `null` s'il ne peut pas être lu. */
export type FontLoader = (url: URL) => Promise<ArrayBuffer | null>

const fetchLoader: FontLoader = async (url) => {
  try {
    const response = await fetch(url)
    return response.ok ? await response.arrayBuffer() : null
  } catch {
    return null
  }
}

let loader: FontLoader = fetchLoader
let cache: Promise<{ normal: string; bold: string } | null> | null = null

/** Remplace la lecture des fichiers de police (tests sous Node, sans `fetch` de fichiers locaux). */
export function setFontLoader(next: FontLoader | null): void {
  loader = next ?? fetchLoader
  cache = null
}

function toBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(binary)
}

function loadFonts() {
  cache ??= (async () => {
    const [normal, bold] = await Promise.all([loader(FILES.normal), loader(FILES.bold)])
    return normal && bold ? { normal: toBase64(normal), bold: toBase64(bold) } : null
  })()
  return cache
}

const embedded = new WeakSet<object>()

/** Intègre Liberation Sans (normal et gras) au PDF ; `false` si les fichiers manquent (Helvetica reste). */
export async function embedSheetFonts(pdf: Pdf): Promise<boolean> {
  const fonts = await loadFonts()
  if (!fonts) return false
  pdf.addFileToVFS('LiberationSans-Regular.ttf', fonts.normal)
  pdf.addFont('LiberationSans-Regular.ttf', SHEET_FONT, 'normal')
  pdf.addFileToVFS('LiberationSans-Bold.ttf', fonts.bold)
  pdf.addFont('LiberationSans-Bold.ttf', SHEET_FONT, 'bold')
  embedded.add(pdf)
  return true
}

/**
 * Choisit la police d'un texte de feuille. Avec Liberation Sans intégrée, l'italique (notes) s'écrit
 * en romain : pas de fichier italique, et une police standard non intégrée ne doit pas s'y mêler.
 */
export function setSheetFont(pdf: Pdf, style: SheetFontStyle): void {
  if (embedded.has(pdf)) pdf.setFont(SHEET_FONT, style === 'bold' ? 'bold' : 'normal')
  else pdf.setFont('helvetica', style)
}
