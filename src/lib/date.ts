/** Date au format belge, jour/mois/année (« 11/11/2026 »), pour les cartouches des PDF. */
export function formatDate(date: Date): string {
  return date.toLocaleDateString('fr-BE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

/** Date ISO « 2026-10-01 » affichée « 01/10/2026 », sans passer par un fuseau horaire. */
export function formatIsoDay(iso: string): string {
  const [year, month, day] = iso.slice(0, 10).split('-')
  return year && month && day ? `${day}/${month}/${year}` : iso
}
