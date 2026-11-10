import { useState, type FormEvent } from 'react'
import { fr } from '../../i18n/fr'
import Button from '../ui/Button'
import Modal from '../ui/Modal'

interface RenameDialogProps {
  currentName: string
  onSubmit: (name: string) => void
  onClose: () => void
}

export default function RenameDialog({ currentName, onSubmit, onClose }: RenameDialogProps) {
  const [name, setName] = useState(currentName)

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (name.trim()) onSubmit(name)
  }

  return (
    <Modal title={fr.projects.renameTitle} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <label className="block text-sm font-medium text-slate-700">
          {fr.projects.nameLabel}
          <input
            autoFocus
            value={name}
            maxLength={200}
            onChange={(event) => setName(event.target.value)}
            onFocus={(event) => event.target.select()}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none"
          />
        </label>
        <div className="mt-6 flex justify-end gap-2">
          <Button onClick={onClose}>{fr.common.cancel}</Button>
          <Button type="submit" variant="primary" disabled={!name.trim()}>
            {fr.common.save}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
