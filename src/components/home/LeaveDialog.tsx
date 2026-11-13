import { fr } from '../../i18n/fr'
import Button from '../ui/Button'
import Modal from '../ui/Modal'

interface LeaveDialogProps {
  projectName: string
  onConfirm: () => void
  onClose: () => void
}

/** Confirmation avant de quitter un projet partagé (le projet n'est pas supprimé pour son propriétaire). */
export default function LeaveDialog({ projectName, onConfirm, onClose }: LeaveDialogProps) {
  const t = fr.sharedWithMe
  return (
    <Modal title={t.leaveTitle} onClose={onClose}>
      <p className="text-sm text-slate-600">{t.leaveMessage(projectName)}</p>
      <div className="mt-6 flex justify-end gap-2">
        <Button onClick={onClose}>{fr.common.cancel}</Button>
        <Button variant="danger" onClick={onConfirm}>
          {t.leaveConfirm}
        </Button>
      </div>
    </Modal>
  )
}
