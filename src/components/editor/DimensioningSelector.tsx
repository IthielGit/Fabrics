import clsx from 'clsx'
import { Check, ChevronDown, Ruler } from 'lucide-react'
import { useCallback, useRef, useState } from 'react'
import type { DimensioningMode } from '../../features/dimensioning/types'
import { fr } from '../../i18n/fr'
import { useEditorStore } from '../../stores/editorStore'
import { MENU_LIST, MENU_TRIGGER, menuItemClass } from '../ui/menuStyles'
import { useDismiss } from './useDismiss'

const MODES: readonly DimensioningMode[] = ['none', 'client', 'execution']

/**
 * Réglage « Cotation » d'un plan (M10 ter lot B) : aucune cote automatique, version Client ou
 * version Exécution. Un bouton « Cotation  Aucune ▾ » qui ouvre la liste, placé dans la barre
 * « Niveau · Cotation » (M15 bis). État d'interface : changer de version ne modifie pas le document.
 */
export default function DimensioningSelector() {
  const isPlan = useEditorStore((state) => state.project?.kind === 'plan')
  const mode = useEditorStore((state) => state.dimensioningMode)
  const setMode = useEditorStore((state) => state.setDimensioningMode)
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const close = useCallback(() => setOpen(false), [])
  useDismiss(rootRef, open, close)

  if (!isPlan) return null

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        title={fr.dimensioning.title}
        onClick={() => setOpen((value) => !value)}
        className={MENU_TRIGGER}
      >
        <Ruler size={16} aria-hidden className="text-slate-500" />
        <span className="text-slate-500 max-sm:sr-only">{fr.dimensioning.label}</span>
        <span className={clsx('font-medium', mode !== 'none' ? 'text-indigo-700' : 'text-slate-900')}>
          {fr.dimensioning.modes[mode]}
        </span>
        <ChevronDown size={14} aria-hidden className="text-slate-500" />
      </button>
      {open && (
        <div role="menu" aria-label={fr.dimensioning.label} className={MENU_LIST}>
          {MODES.map((value) => (
            <button
              key={value}
              type="button"
              role="menuitemradio"
              aria-checked={mode === value}
              onClick={() => {
                setMode(value)
                setOpen(false)
              }}
              className={menuItemClass(mode === value)}
            >
              {fr.dimensioning.modes[value]}
              {mode === value && <Check size={14} aria-hidden />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
