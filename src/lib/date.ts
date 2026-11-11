/** Date au format belge, jour/mois/année (« 11/11/2026 »), pour les cartouches des PDF. */
export function formatDate(date: Date): string {
  return date.toLocaleDateString('fr-BE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
