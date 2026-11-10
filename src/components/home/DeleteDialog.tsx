import { fr } from '../../i18n/fr'
import Button from '../ui/Button'
import Modal from '../ui/Modal'

interface DeleteDialogProps {
  projectName: string
  onConfirm: () => void
  onClose: () => void
}

export default function DeleteDialog({ projectName, onConfirm, onClose }: DeleteDialogProps) {
  return (
    <Modal title={fr.projects.deleteTitle} onClose={onClose}>
      <p className="text-sm text-slate-600">{fr.projects.deleteMessage(projectName)}</p>
      <div className="mt-6 flex justify-end gap-2">
        <Button onClick={onClose}>{fr.common.cancel}</Button>
        <Button variant="danger" onClick={onConfirm}>
          {fr.projects.delete}
        </Button>
      </div>
    </Modal>
  )
}
