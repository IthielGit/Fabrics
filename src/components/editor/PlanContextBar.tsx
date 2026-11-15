import clsx from 'clsx'
import { useEditorStore } from '../../stores/editorStore'
import { SEGMENT_DIVIDER, SEGMENTED_BAR } from '../ui/segmented'
import DimensioningSelector from './DimensioningSelector'
import LevelSelector from './LevelSelector'

interface PlanContextBarProps {
  /** Page en lecture seule : on garde le choix du niveau, sans le réglage de cotation. */
  readOnly?: boolean
}

/**
 * Barre « Niveau · Cotation » en haut à gauche du plan (M15 bis, lot A) : les deux réglages de
 * contexte dans une seule carte, au lieu de deux cartes de tailles différentes.
 */
export default function PlanContextBar({ readOnly = false }: PlanContextBarProps) {
  const isPlan = useEditorStore((state) => state.project?.kind === 'plan')
  const hasLevels = useEditorStore(
    (state) => (state.project?.document.levels?.length ?? 0) > 0 && state.activeLevelId !== null,
  )
  const showDimensioning = isPlan && !readOnly
  if (!hasLevels && !showDimensioning) return null

  return (
    <div className={clsx('pointer-events-auto min-w-0 max-w-full', SEGMENTED_BAR)}>
      <LevelSelector />
      {hasLevels && showDimensioning && <span className={SEGMENT_DIVIDER} aria-hidden />}
      {showDimensioning && <DimensioningSelector />}
    </div>
  )
}
