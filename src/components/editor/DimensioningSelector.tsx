import clsx from 'clsx'
import { Check, ChevronDown, Ruler } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { DimensioningMode } from '../../features/dimensioning/types'
import { fr } from '../../i18n/fr'
import { useEditorStore } from '../../stores/editorStore'
import { SEGMENTED_BAR } from '../ui/segmented'

const MODES: readonly DimensioningMode[] = ['none', 'client', 'execution']

/**
 * Réglage « Cotation » d'un plan (M10 ter lot B) : aucune cote automatique, version Client ou
 * version Exécution. Un seul bouton (« Cotation : Aucune ») qui ouvre la liste : ce réglage change
 * rarement, il ne doit pas occuper la barre du haut en permanence. État d'interface : changer de
 * version ne modifie pas le document.
 */
export default function DimensioningSelector() {
  const isPlan = useEditorStore((state) => state.project?.kind === 'plan')
  const mode = useEditorStore((state) => state.dimensioningMode)
  const setMode = useEditorStore((state) => state.setDimensioningMode)
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  if (!isPlan) return null

  return (
    <div ref={rootRef} className="pointer-events-auto relative shrink-0">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        title={fr.dimensioning.title}
        onClick={() => setOpen((value) => !value)}
        className={clsx(
          SEGMENTED_BAR,
          'h-10 gap-1.5 px-3 text-sm font-medium hover:bg-slate-50',
          mode !== 'none' ? 'text-indigo-700' : 'text-slate-700',
        )}
      >
        <Ruler size={16} aria-hidden />
        {fr.dimensioning.label} : {fr.dimensioning.modes[mode]}
        <ChevronDown size={14} aria-hidden />
      </button>
      {open && (
        <div
          role="menu"
          aria-label={fr.dimensioning.label}
          className="absolute left-0 top-full z-30 mt-1 w-44 rounded-lg border border-slate-200 bg-white p-1 shadow-lg"
        >
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
              className={clsx(
                'flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm',
                mode === value ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-100',
              )}
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
