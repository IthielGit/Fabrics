/**
 * Convention d'unités de Fabrics : « Métrique architectural » (comme Revit).
 * - longueurs : millimètres, sans décimale (`3500 mm`) ;
 * - surfaces : mètres carrés, 2 décimales (`12,40 m²`) ;
 * - volumes (plus tard) : mètres cubes.
 * Le stockage reste en mm / mm². Le centimètre et le mètre ne servent qu'à la saisie (`parseLength`).
 */
const MM_PER_M = 1000
const MM_PER_CM = 10
const MM2_PER_M2 = 1_000_000

export function mToMm(m: number): number {
  return m * MM_PER_M
}

export function cmToMm(cm: number): number {
  return cm * MM_PER_CM
}

/** Surface en mm² → m². */
export function mm2ToM2(mm2: number): number {
  return mm2 / MM2_PER_M2
}

/** Nombre à la française : virgule décimale, nombre de décimales fixe. `-0,00` devient `0,00`. */
export function formatDecimal(value: number, decimals: number = 2): string {
  const text = value.toFixed(decimals)
  const normalized = Number(text) === 0 ? (0).toFixed(decimals) : text
  return normalized.replace('.', ',')
}

/** Longueur en mm affichée en millimètres entiers : `3500 mm`. */
export function formatLength(mm: number): string {
  return `${formatDecimal(mm, 0)} mm`
}

/** Surface en mm² affichée en mètres carrés : `12,40 m²`. */
export function formatArea(mm2: number): string {
  return `${formatDecimal(mm2ToM2(mm2))} m²`
}

/**
 * Lit une longueur saisie par l'utilisateur et la renvoie en mm.
 * Accepte `3500`, `3500 mm`, `350 cm`, `3,5 m`. Sans unité, on suppose des millimètres.
 * Renvoie `null` si le texte n'est pas une longueur strictement positive.
 */
export function parseLength(text: string): number | null {
  const match = text
    .trim()
    .toLowerCase()
    .match(/^(\d+(?:[.,]\d+)?)\s*(mm|cm|m)?$/)
  if (!match) return null
  const value = Number(match[1].replace(',', '.'))
  if (!Number.isFinite(value) || value <= 0) return null
  switch (match[2]) {
    case 'm':
      return mToMm(value)
    case 'cm':
      return cmToMm(value)
    default:
      return value
  }
}
