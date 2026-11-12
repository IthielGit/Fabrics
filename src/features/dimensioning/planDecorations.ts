import type { FabricsDocument } from '../../types/document'
import type { PlanOverlay } from '../building/views/drawing'
import type { ExecutionLabels } from './executionDimensions'
import { lengthLabels } from './lengthLabels'
import { mergeOverlays, planMarks } from './planMarks'

/**
 * Ce que les options du plan ajoutent au dessin d'un niveau (M11 bis, lot F) : flèche du nord et
 * repère de niveau, étiquettes de longueur des murs et de largeur des ouvertures. `null` sans option.
 * Même calcul pour l'écran, les exports PDF et PNG, la planche et le DXF.
 */
export function planDecorations(
  document: Pick<FabricsDocument, 'elements' | 'levels' | 'plan'>,
  levelId: string,
  labels: Pick<ExecutionLabels, 'north' | 'east' | 'south' | 'west' | 'levelMark'>,
  fontMm: number,
): PlanOverlay | null {
  return mergeOverlays(planMarks(document, levelId, labels, fontMm), lengthLabels(document, levelId, fontMm))
}
