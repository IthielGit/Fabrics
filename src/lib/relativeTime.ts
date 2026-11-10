const MINUTE = 60
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

const rtf = new Intl.RelativeTimeFormat('fr', { numeric: 'auto' })
const dateFormat = new Intl.DateTimeFormat('fr', { day: 'numeric', month: 'long', year: 'numeric' })

/** Date relative en français : « maintenant », « il y a 5 minutes », « hier », « 3 mars 2026 »… */
export function formatRelativeTime(iso: string, now: Date = new Date()): string {
  const date = new Date(iso)
  const seconds = Math.round((now.getTime() - date.getTime()) / 1000)

  if (seconds < 45) return rtf.format(0, 'second')
  if (seconds < HOUR) return rtf.format(-Math.max(1, Math.round(seconds / MINUTE)), 'minute')
  if (seconds < DAY) return rtf.format(-Math.round(seconds / HOUR), 'hour')
  if (seconds < 30 * DAY) return rtf.format(-Math.round(seconds / DAY), 'day')
  return dateFormat.format(date)
}
