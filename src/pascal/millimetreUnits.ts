// Unités « Métrique architectural » dans l'éditeur de Pascal (M19 B1) : longueurs en mm entiers,
// surfaces en m² à 2 décimales, partout (étiquettes, cotes, panneaux, saisie au clavier). Pascal
// stocke en mètres (D79) ; seule sa notation d'affichage est réglée ici.
import { configureMeasurementDisplay } from '@pascal-app/core'
import { useViewer } from '@pascal-app/viewer'

interface UnitState {
  unit: 'metric' | 'imperial'
  metricNotation: 'meters' | 'millimeters'
  unitExplicit: boolean
}

/**
 * Changement à appliquer au réglage d'unités de Pascal pour rester en mm, ou `null` s'il y est déjà.
 * Un nombre tapé sans unité est alors lu en mm par Pascal (`placementTypingLengthOptions`).
 */
export function millimetrePatch(state: UnitState): Partial<UnitState> | null {
  if (state.unit === 'metric' && state.metricNotation === 'millimeters' && state.unitExplicit) return null
  return { unit: 'metric', metricNotation: 'millimeters', unitExplicit: true }
}

let pinned = false

/** Verrouille Pascal en mm : réglages par défaut du moteur et réglage d'unités de la vue. */
export function pinMillimetres(): void {
  if (pinned) return
  pinned = true
  // Formatage par défaut (étiquettes sans notation explicite) et menu d'unités masqué.
  configureMeasurementDisplay({ metricNotation: 'millimeters', areaFractionDigits: 2, locked: true })
  const enforce = (state: UnitState) => {
    const patch = millimetrePatch(state)
    if (patch) useViewer.setState(patch)
  }
  enforce(useViewer.getState())
  // Un réglage relu du navigateur (Pascal le mémorise) ou changé par une commande revient en mm.
  useViewer.subscribe(enforce)
}
