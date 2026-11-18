import { useT } from '../../i18n/useT'
import Button from '../ui/Button'
import Modal from '../ui/Modal'

interface DeleteDialogProps {
  projectName: string
  onConfirm: () => void
  onClose: () => void
}

export default function DeleteDialog({ projectName, onConfirm, onClose }: DeleteDialogProps) {
  const t = useT()
  return (
    <Modal title={t('projects.deleteTitle')} onClose={onClose}>
      <p className="text-sm text-muted-foreground">{t('projects.deleteMessage', { name: projectName })}</p>
      <div className="mt-6 flex justify-end gap-2">
        <Button onClick={onClose}>{t('common.cancel')}</Button>
        <Button variant="danger" onClick={onConfirm}>
          {t('projects.delete')}
        </Button>
      </div>
    </Modal>
  )
}
