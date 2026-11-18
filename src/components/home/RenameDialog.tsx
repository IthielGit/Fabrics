import { useState, type FormEvent } from 'react'
import { useT } from '../../i18n/useT'
import Button from '../ui/Button'
import Modal from '../ui/Modal'

interface RenameDialogProps {
  currentName: string
  onSubmit: (name: string) => void
  onClose: () => void
}

export default function RenameDialog({ currentName, onSubmit, onClose }: RenameDialogProps) {
  const t = useT()
  const [name, setName] = useState(currentName)

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (name.trim()) onSubmit(name)
  }

  return (
    <Modal title={t('projects.renameTitle')} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <label className="block text-sm font-medium text-foreground">
          {t('projects.nameLabel')}
          <input
            autoFocus
            value={name}
            maxLength={200}
            onChange={(event) => setName(event.target.value)}
            onFocus={(event) => event.target.select()}
            className="mt-1 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-foreground focus:border-ring focus:outline-none"
          />
        </label>
        <div className="mt-6 flex justify-end gap-2">
          <Button onClick={onClose}>{t('common.cancel')}</Button>
          <Button type="submit" variant="primary" disabled={!name.trim()}>
            {t('common.save')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
