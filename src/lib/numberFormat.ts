/** Affiche un nombre à la française (virgule) avec au plus 2 décimales. */
export function formatNumber(value: number): string {
  return String(Number(value.toFixed(2))).replace('.', ',')
}

/** Lit un nombre saisi (virgule ou point). Renvoie `null` si ce n'est pas un nombre. */
export function parseNumber(text: string): number | null {
  const normalized = text.trim().replace(',', '.')
  if (normalized === '') return null
  const value = Number(normalized)
  return Number.isFinite(value) ? value : null
}
