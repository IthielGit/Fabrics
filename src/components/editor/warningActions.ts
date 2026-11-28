import { applyWallFix } from '../../features/geometry/wallContacts'
import { fitBoxView } from '../../features/geometry/navigation'
import { boxRing, warningFocusBox } from '../../features/measurements/warningFocus'
import type { MetresWarning } from '../../features/measurements/warnings'
import { pxPerUnit } from '../../features/units/scale'
import { fr } from '../../i18n/fr'
import { useEditorStore } from '../../stores/editorStore'
import { metresWarningTargets } from './metresWarningText'

/** Affiche le niveau, sélectionne l'élément, entoure la zone et centre le plan dessus. */
export function focusWarning(warning: MetresWarning): void {
  const state = useEditorStore.getState()
  const elements = state.project?.document.elements
  if (!elements || !state.project) return
  if ('levelId' in warning && warning.levelId !== state.activeLevelId) state.setActiveLevel(warning.levelId)
  const targets = metresWarningTargets(warning)
  state.setSelection(targets)
  const box = warningFocusBox(warning, targets, elements)
  const levelId = 'levelId' in warning ? warning.levelId : state.activeLevelId
  if (box && levelId) {
    state.setSurfaceHighlight({
      levelId,
      rings: 'rings' in warning ? warning.rings : [boxRing(box)],
      elements,
    })
    if (state.viewportSize.width > 0) {
      const view = fitBoxView(box, state.viewportSize, pxPerUnit(state.project.document.unit))
      state.setView({ zoom: view.zoom, stagePosition: { x: view.x, y: view.y } })
    }
  } else {
    state.setSurfaceHighlight(null)
  }
}

/** Vrai si le point propose une correction sûre (raccorder deux murs). */
export function canFixWarning(warning: MetresWarning): boolean {
  return 'fix' in warning && Boolean(warning.fix)
}

/** Applique la correction proposée (annulable avec Ctrl+Z) ; le contrôle se recalcule tout seul. */
export function fixWarning(warning: MetresWarning): void {
  if (!('fix' in warning) || !warning.fix) return
  const { fix } = warning
  const state = useEditorStore.getState()
  state.updateElements([fix.wallId], (el) => (el.type === 'wall' ? applyWallFix(el, fix) : el))
  state.setNotice(fr.measurements.warnings.fixed, 'success')
}
