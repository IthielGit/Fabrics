/**
 * Unités des lignes de prix (M23). Une unité est un libellé de la bibliothèque de l'utilisateur ; on
 * normalise seulement les écritures courantes (« m2 » → « m² »), et toute normalisation est signalée.
 */

/** Unités reconnues, sous leur forme normalisée. */
export const KNOWN_UNITS = [
  'U',
  'm²',
  'm³',
  'ml',
  'm',
  'kg',
  't',
  'L',
  'Sac',
  'FFT',
  'J',
  'H',
  'Mois',
  'Semaine',
  'Paquet',
  'Rouleau',
  'Boîte',
  'Pot',
  'Barre',
  'Feuille',
  'Paire',
  'Lot',
] as const

const ALIASES: Record<string, string> = {
  u: 'U',
  unite: 'U',
  unité: 'U',
  pce: 'U',
  pièce: 'U',
  piece: 'U',
  m2: 'm²',
  'm²': 'm²',
  m3: 'm³',
  'm³': 'm³',
  ml: 'ml',
  m: 'm',
  kg: 'kg',
  t: 't',
  tonne: 't',
  l: 'L',
  litre: 'L',
  sac: 'Sac',
  fft: 'FFT',
  ff: 'FFT',
  forfait: 'FFT',
  j: 'J',
  jour: 'J',
  jr: 'J',
  h: 'H',
  hr: 'H',
  heure: 'H',
  mois: 'Mois',
  semaine: 'Semaine',
  paquet: 'Paquet',
  rouleau: 'Rouleau',
  boite: 'Boîte',
  boîte: 'Boîte',
  pot: 'Pot',
  barre: 'Barre',
  feuille: 'Feuille',
  paire: 'Paire',
  lot: 'Lot',
}

export interface NormalizedUnit {
  unit: string
  /** Vrai si l'écriture a été changée (à signaler dans un rapport d'import). */
  changed: boolean
  /** Vrai si l'unité figure dans `KNOWN_UNITS`. */
  known: boolean
}

/** Normalise une unité : espaces retirés, alias courants remplacés. Une unité inconnue est gardée. */
export function normalizeUnit(raw: string): NormalizedUnit {
  const trimmed = raw.replace(/\s+/g, ' ').trim()
  const alias = ALIASES[trimmed.toLowerCase()]
  const unit = alias ?? trimmed
  return {
    unit,
    changed: unit !== raw,
    known: (KNOWN_UNITS as readonly string[]).includes(unit),
  }
}
