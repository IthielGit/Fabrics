import type { MetresWarning } from '../../features/measurements/warnings'
import { formatArea, formatDecimal, formatLength } from '../../features/units/format'
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
    case 'wallZeroHeight':
      return t.wallZeroHeight(warning.wallRef)
    case 'wallInvalidThickness':
      return t.wallInvalidThickness(warning.wallRef)
    case 'wallZeroLength':
      return t.wallZeroLength(warning.wallRef)
    case 'openingOverlap':
      return t.openingOverlap(warning.openingRefs[0], warning.openingRefs[1])
    case 'wallGap':
      return t.wallGap(warning.wallRef, warning.otherWallRef, formatLength(warning.gap))
    case 'wallOverlap':
      return t.wallOverlap(warning.wallRefs[0], warning.wallRefs[1], formatLength(warning.length))
    case 'openingTooTall':
      return t.openingTooTall(warning.openingRef, warning.wallRef)
    case 'openingInvalidSize':
      return t.openingInvalidSize(warning.openingRef)
    case 'roomSelfIntersecting':
      return t.roomSelfIntersecting(warning.roomName)
    case 'roofInvalid':
      return t.roofInvalid(warning.roofName)
    case 'wallNoMaterial':
      return t.wallNoMaterial(warning.wallRef)
    case 'roomNoName':
      return t.roomNoName(warning.roomName)
    case 'suspiciousUnit':
      // Valeur telle que saisie (0,2 mm reste lisible, pas arrondie à 0).
      return t.suspiciousUnit(warning.elementRef, t.unitFields[warning.field], `${formatDecimal(warning.value, Number.isInteger(warning.value) ? 0 : 2)} mm`)
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
    case 'wallZeroHeight':
    case 'wallInvalidThickness':
    case 'wallZeroLength':
      return [warning.wallId]
    case 'wallOverlap':
      return [...warning.wallIds]
    case 'openingTooTall':
    case 'openingInvalidSize':
      return [warning.openingId]
    case 'roomSelfIntersecting':
    case 'roomNoName':
      return [warning.roomId]
    case 'roofInvalid':
      return [warning.roofId]
    case 'wallNoMaterial':
      return [warning.wallId]
    case 'suspiciousUnit':
      return [warning.elementId]
  }
}

/** Phrase « que faire » d'un avertissement (en français, via `fr.ts`). */
export function metresWarningAdvice(warning: MetresWarning): string {
  return fr.measurements.warnings.advice[warning.kind]
}
