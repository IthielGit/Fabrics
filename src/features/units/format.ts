const MM_PER_M = 1000
const MM_PER_CM = 10
const MM2_PER_M2 = 1_000_000

export function mmToM(mm: number): number {
  return mm / MM_PER_M
}

export function mToMm(m: number): number {
  return m * MM_PER_M
}

export function cmToMm(cm: number): number {
  return cm * MM_PER_CM
}

export function mmToCm(mm: number): number {
  return mm / MM_PER_CM
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

/** Longueur en mm affichée en mètres : `3,50 m`. */
export function formatLength(mm: number): string {
  return `${formatDecimal(mmToM(mm))} m`
}

/** Surface en mm² affichée en mètres carrés : `12,40 m²`. */
export function formatArea(mm2: number): string {
  return `${formatDecimal(mm2ToM2(mm2))} m²`
}

/** Épaisseur ou hauteur courte, en centimètres : `20 cm`. */
export function formatCentimeters(mm: number): string {
  return `${formatDecimal(mmToCm(mm), 1).replace(/,0$/, '')} cm`
}

/**
 * Lit une longueur saisie par l'utilisateur et la renvoie en mm.
 * Accepte `3,50`, `3.5 m`, `350 cm`, `3500mm`. Sans unité, on suppose des mètres.
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
    case 'mm':
      return value
    case 'cm':
      return cmToMm(value)
    default:
      return mToMm(value)
  }
}
