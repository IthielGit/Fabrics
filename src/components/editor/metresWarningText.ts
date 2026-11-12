import type { MetresWarning } from '../../features/measurements/warnings'
import { formatArea, formatLength } from '../../features/units/format'
import { fr } from '../../i18n/fr'

/** Texte français d'un avertissement des métrés. */
export function metresWarningText(warning: MetresWarning): string {
  const t = fr.measurements.warnings
  switch (warning.kind) {
    case 'roomOverlap':
      return t.roomOverlap(warning.roomNames)
    case 'voidOverflow':
      return t.voidOverflow(warning.roomName)
    case 'hiddenRoom':
      return t.hiddenRoom(warning.roomName)
    case 'coverageGap':
      return t.coverageGap(warning.roomName, formatArea(warning.area), warning.wallRef)
    case 'coverageOverflow':
      return t.coverageOverflow(warning.roomName, formatArea(warning.area), warning.wallRef)
    case 'noLevel':
      return t.noLevel(t.types[warning.elementType] ?? t.otherType, warning.elementName)
    case 'openingOutside':
      return t.openingOutside(warning.openingRef, warning.wallRef)
    case 'openingOverlap':
      return t.openingOverlap(warning.openingRefs[0], warning.openingRefs[1])
    case 'wallGap':
      return t.wallGap(warning.wallRef, warning.otherWallRef, formatLength(warning.gap))
    case 'wallOverlap':
      return t.wallOverlap(warning.wallRefs[0], warning.wallRefs[1], formatLength(warning.length))
  }
}

/** Éléments à sélectionner quand on clique un avertissement. */
export function metresWarningTargets(warning: MetresWarning): string[] {
  switch (warning.kind) {
    case 'roomOverlap':
      return warning.roomIds
    case 'voidOverflow':
    case 'hiddenRoom':
    case 'coverageGap':
    case 'coverageOverflow':
      return [warning.roomId]
    case 'noLevel':
      return [warning.elementId]
    case 'openingOutside':
      return [warning.openingId]
    case 'openingOverlap':
      return [...warning.openingIds]
    case 'wallGap':
      return [warning.wallId]
    case 'wallOverlap':
      return [...warning.wallIds]
  }
}

/** Phrase « que faire » d'un avertissement (en français, via `fr.ts`). */
export function metresWarningAdvice(warning: MetresWarning): string {
  return fr.measurements.warnings.advice[warning.kind]
}
