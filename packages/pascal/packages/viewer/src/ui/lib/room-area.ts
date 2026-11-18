import {
  formatNumber,
  getAreaUnitLabel,
  getMeasurementDisplayDefaults,
  type LinearUnit,
  squareMetersToAreaUnit,
} from '@pascal-app/core'

export function formatRoomArea(squareMeters: number, unit: LinearUnit, locale?: string): string {
  // Host-pinned precision (Fabrics: 2 decimals); 1 decimal by default.
  const digits = getMeasurementDisplayDefaults().areaFractionDigits
  return `${formatNumber(squareMetersToAreaUnit(squareMeters, unit), {
    min: digits,
    max: digits,
    locale,
  })} ${getAreaUnitLabel(unit)}`
}
