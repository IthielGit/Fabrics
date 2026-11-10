import type { TextElement } from '../../types/document'

/** Polices système proposées (aucune police à télécharger). Le rendu varie légèrement d'un appareil à l'autre. */
export const FONT_FAMILIES = [
  { name: 'Arial', fallback: 'sans-serif' },
  { name: 'Georgia', fallback: 'serif' },
  { name: 'Times New Roman', fallback: 'serif' },
  { name: 'Courier New', fallback: 'monospace' },
  { name: 'Verdana', fallback: 'sans-serif' },
  { name: 'Trebuchet MS', fallback: 'sans-serif' },
] as const

export const DEFAULT_FONT_FAMILY = FONT_FAMILIES[0].name

/** Valeur CSS / Canvas de la police : `"Georgia", serif`. Une police inconnue retombe sur sans-serif. */
export function fontStack(fontFamily: string): string {
  const known = FONT_FAMILIES.find((font) => font.name === fontFamily)
  return `"${fontFamily}", ${known?.fallback ?? 'sans-serif'}`
}

export function isBold(fontStyle: TextElement['fontStyle']): boolean {
  return fontStyle === 'bold' || fontStyle === 'bold italic'
}

export function isItalic(fontStyle: TextElement['fontStyle']): boolean {
  return fontStyle === 'italic' || fontStyle === 'bold italic'
}

export function buildFontStyle(bold: boolean, italic: boolean): TextElement['fontStyle'] {
  if (bold && italic) return 'bold italic'
  if (bold) return 'bold'
  if (italic) return 'italic'
  return 'normal'
}
