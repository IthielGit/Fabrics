import { useState, type FormEvent } from 'react'
import { parseLength } from '../../features/units/format'
import { fr } from '../../i18n/fr'
import Button from '../ui/Button'
import Modal from '../ui/Modal'

interface CalibrateDialogProps {
  /** Reçoit la distance réelle saisie, en mm. Renvoie `false` si elle n'a pas pu être appliquée. */
  onConfirm: (distanceMm: number) => boolean
  onCancel: () => void
}

/** Demande la distance réelle entre les deux points cliqués (`3,50 m`, `350 cm`, `3500 mm`). */
export default function CalibrateDialog({ onConfirm, onCancel }: CalibrateDialogProps) {
  const [text, setText] = useState('')
  const [invalid, setInvalid] = useState(false)

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const distance = parseLength(text)
    if (distance === null || !onConfirm(distance)) setInvalid(true)
  }

  return (
    <Modal title={fr.calibrate.title} onClose={onCancel}>
      <form onSubmit={handleSubmit}>
        <p className="text-sm text-slate-600">{fr.calibrate.description}</p>
        <label className="mt-4 block text-sm font-medium text-slate-700">
          {fr.calibrate.label}
          <input
            autoFocus
            value={text}
            placeholder={fr.calibrate.placeholder}
            onChange={(event) => {
              setText(event.target.value)
              setInvalid(false)
            }}
            aria-invalid={invalid}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none"
          />
        </label>
        {invalid && (
          <p role="alert" className="mt-2 text-sm text-red-600">
            {fr.calibrate.invalid}
          </p>
        )}
        <div className="mt-6 flex justify-end gap-2">
          <Button onClick={onCancel}>{fr.common.cancel}</Button>
          <Button type="submit" variant="primary" disabled={text.trim() === ''}>
            {fr.calibrate.apply}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
