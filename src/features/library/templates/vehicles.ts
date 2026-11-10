import { circle, line, polygon, rect, translatePrimitives } from '../primitives'
import type { Primitive } from '../types'
import { countFor, type DrawFn } from './common'
import { marker } from './tech'

/** Voiture, vue de dessus, face avant vers le bas : carrosserie, pare-brise, lunette arrière, toit, roues et phares. */
export const car: DrawFn = (w, d) => {
  const wheelW = w * 0.09
  const wheelH = d * 0.15
  return [
    rect(0, 0, w, d, 'outline', Math.min(w * 0.4, 220)),
    polygon([w * 0.14, d * 0.55, w * 0.86, d * 0.55, w * 0.78, d * 0.68, w * 0.22, d * 0.68], 'detail'),
    polygon([w * 0.16, d * 0.28, w * 0.84, d * 0.28, w * 0.8, d * 0.2, w * 0.2, d * 0.2], 'detail'),
    rect(w * 0.14, d * 0.28, w * 0.72, d * 0.27, 'detail', 40),
    rect(0, d * 0.16, wheelW, wheelH, 'detail', 8),
    rect(w - wheelW, d * 0.16, wheelW, wheelH, 'detail', 8),
    rect(0, d * 0.7, wheelW, wheelH, 'detail', 8),
    rect(w - wheelW, d * 0.7, wheelW, wheelH, 'detail', 8),
    line([w * 0.1, d * 0.97, w * 0.28, d * 0.97], 'detail'),
    line([w * 0.72, d * 0.97, w * 0.9, d * 0.97], 'detail'),
  ]
}

/** Camionnette, camion (cabine et caisse) ou autocar (vitres) : `van`, `truck`, `bus`. */
export function bigVehicle(kind: 'van' | 'truck' | 'bus'): DrawFn {
  return (w, d) => {
    const cab = kind === 'van' ? d * 0.26 : d * 0.2
    const out: Primitive[] = [rect(0, 0, w, d, 'outline', Math.min(w * 0.15, 120))]
    if (kind === 'bus') {
      const n = countFor(d * 0.8, 1000, 4)
      for (let i = 0; i < n; i++) {
        const y = d * 0.08 + ((d * 0.78) * i) / n
        out.push(rect(w * 0.04, y, w * 0.07, (d * 0.78) / n - 120, 'detail', 6), rect(w * 0.89, y, w * 0.07, (d * 0.78) / n - 120, 'detail', 6))
      }
      out.push(polygon([w * 0.12, d * 0.9, w * 0.88, d * 0.9, w * 0.8, d * 0.96, w * 0.2, d * 0.96], 'detail'))
      return out
    }
    out.push(line([0, d - cab, w, d - cab], 'detail'), polygon([w * 0.12, d - cab * 0.55, w * 0.88, d - cab * 0.55, w * 0.8, d - cab * 0.2, w * 0.2, d - cab * 0.2], 'detail'))
    if (kind === 'truck') out.push(rect(w * 0.08, d * 0.04, w * 0.84, d - cab - d * 0.08, 'detail', 20))
    const wheel = Math.min(w * 0.1, 150)
    for (const y of [d * 0.1, d * 0.72]) out.push(rect(0, y, wheel, d * 0.1, 'detail', 6), rect(w - wheel, y, wheel, d * 0.1, 'detail', 6))
    return out
  }
}

/** Deux-roues motorisé : roues avant et arrière, réservoir et selle, guidon (moto) ou plancher (scooter). */
export function motorbike(kind: 'moto' | 'scooter'): DrawFn {
  return (w, d) => {
    const out: Primitive[] = [
      rect(w * 0.36, d * 0.02, w * 0.28, d * 0.22, 'detail', 20),
      rect(w * 0.36, d * 0.76, w * 0.28, d * 0.22, 'detail', 20),
      rect(w * 0.22, d * 0.27, w * 0.56, d * 0.34, 'outline', 40),
      line([0, d * 0.68, w, d * 0.68], 'outline'),
    ]
    if (kind === 'moto') out.push(rect(w * 0.3, d * 0.3, w * 0.4, d * 0.12, 'detail', 15), rect(w * 0.3, d * 0.45, w * 0.4, d * 0.13, 'detail', 15))
    else out.push(rect(w * 0.26, d * 0.32, w * 0.48, d * 0.26, 'detail', 15))
    return out
  }
}

/** Vélo : cadre (ligne), roues fines et guidon ; le vélo cargo a une caisse à l'avant. */
export function bicycle(cargo = false): DrawFn {
  return (w, d) => {
    const out: Primitive[] = [
      rect(w * 0.42, d * 0.02, w * 0.16, d * 0.28, 'detail', 20),
      rect(w * 0.42, d * 0.7, w * 0.16, d * 0.28, 'detail', 20),
      line([w / 2, d * 0.15, w / 2, d * 0.85], 'outline'),
      line([w * 0.1, d * 0.68, w * 0.9, d * 0.68], 'outline'),
      rect(w * 0.4, d * 0.35, w * 0.2, d * 0.1, 'detail', 15),
    ]
    if (cargo) out.push(rect(w * 0.05, d * 0.55, w * 0.9, d * 0.3, 'outline', 30))
    return out
  }
}

/** Arceau à vélos : rangée d'arceaux (U renversés) régulièrement espacés. */
export const bikeRack: DrawFn = (w, d) => {
  const out: Primitive[] = [rect(0, 0, w, d, 'outline', d / 2)]
  const n = countFor(w, 800)
  for (let i = 0; i < n; i++) out.push(circle((w * (i + 0.5)) / n, d / 2, d * 0.25, 'detail'))
  return out
}

/** Emplacement de stationnement : cadre, flèche d'entrée et, pour les places réservées, pictogramme d'accessibilité. */
export function parkingBay(kind: 'standard' | 'pmr' | 'parallel' | 'loading'): DrawFn {
  return (w, d) => {
    const out: Primitive[] = [rect(0, 0, w, d, 'outline', 0)]
    if (kind === 'loading') {
      const n = countFor(d, 700, 3)
      for (let i = 1; i < n; i++) out.push(line([0, (d * i) / n, w, (d * i) / n], 'detail'))
      return out
    }
    if (kind === 'parallel') {
      out.push(line([0, d * 0.08, w * 0.2, d * 0.08], 'detail'), line([w * 0.8, d * 0.08, w, d * 0.08], 'detail'), line([0, d * 0.92, w * 0.2, d * 0.92], 'detail'), line([w * 0.8, d * 0.92, w, d * 0.92], 'detail'))
      return out
    }
    out.push(line([w / 2, d * 0.75, w / 2, d * 0.25, w * 0.34, d * 0.35], 'detail'), line([w / 2, d * 0.25, w * 0.66, d * 0.35], 'detail'))
    if (kind === 'pmr') {
      const s = Math.min(w * 0.4, d * 0.2)
      out.push(...translatePrimitives(marker('wheelchair')(s, s), (w - s) / 2, d * 0.78 - s / 2))
    }
    return out
  }
}
