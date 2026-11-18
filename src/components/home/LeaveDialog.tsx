import { useT } from '../../i18n/useT'
import Button from '../ui/Button'
import Modal from '../ui/Modal'

interface LeaveDialogProps {
  projectName: string
  onConfirm: () => void
  onClose: () => void
}

/** Confirmation avant de quitter un projet partagé (le projet n'est pas supprimé pour son propriétaire). */
export default function LeaveDialog({ projectName, onConfirm, onClose }: LeaveDialogProps) {
  const t = useT()
  return (
    <Modal title={t('shared.leaveTitle')} onClose={onClose}>
      <p className="text-sm text-muted-foreground">{t('shared.leaveMessage', { name: projectName })}</p>
      <div className="mt-6 flex justify-end gap-2">
        <Button onClick={onClose}>{t('common.cancel')}</Button>
        <Button variant="danger" onClick={onConfirm}>
          {t('shared.leaveConfirm')}
        </Button>
      </div>
    </Modal>
  )
}
