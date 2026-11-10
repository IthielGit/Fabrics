import clsx from 'clsx'
import { useEffect, useId, useRef, useState } from 'react'
import { NO_COLOR, isNoColor } from '../../features/documents/properties'

interface ColorFieldProps {
  label: string
  value: string
  /** Texte du bouton « pas de couleur » ; absent = la couleur est obligatoire. */
  noneLabel?: string
  onCommit: (color: string) => void
}

const HEX = /^#[0-9a-f]{6}$/i

/**
 * Sélecteur de couleur. Pendant que l'utilisateur déplace le curseur du sélecteur on n'affiche
 * qu'un aperçu ; la couleur n'est enregistrée (un état d'historique) qu'à la fermeture du sélecteur.
 */
export default function ColorField({ label, value, noneLabel, onCommit }: ColorFieldProps) {
  const id = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const onCommitRef = useRef(onCommit)

  useEffect(() => {
    onCommitRef.current = onCommit
  })

  // L'événement natif « change » ne se déclenche qu'à la validation du choix.
  useEffect(() => {
    const input = inputRef.current
    if (!input) return
    const handleChange = () => {
      setPreview(null)
      onCommitRef.current(input.value)
    }
    input.addEventListener('change', handleChange)
    return () => input.removeEventListener('change', handleChange)
  }, [])

  const none = isNoColor(value)
  const swatch = preview ?? (HEX.test(value) ? value : '#000000')

  return (
    <div className="flex items-center justify-between gap-2">
      <label htmlFor={id} className="text-sm text-slate-600">
        {label}
      </label>
      <div className="flex items-center gap-2">
        {noneLabel && (
          <button
            type="button"
            aria-pressed={none}
            onClick={() => onCommit(NO_COLOR)}
            className={clsx(
              'rounded-md border px-2 py-1 text-xs',
              none
                ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                : 'border-slate-300 text-slate-600 hover:bg-slate-50',
            )}
          >
            {noneLabel}
          </button>
        )}
        <input
          ref={inputRef}
          id={id}
          type="color"
          value={swatch}
          onChange={(event) => setPreview(event.target.value)}
          className={clsx('h-8 w-10 cursor-pointer rounded border border-slate-300 bg-white p-0.5', none && 'opacity-40')}
        />
      </div>
    </div>
  )
}
