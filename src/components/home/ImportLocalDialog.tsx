import { useState } from 'react'
import { importLocalProjects, type ImportResult } from '../../features/persistence/importLocal'
import { markImportAsked } from '../../features/persistence/importPrompt'
import { localRepository, repository } from '../../features/persistence/repository'
import { fr } from '../../i18n/fr'
import Button from '../ui/Button'
import Modal from '../ui/Modal'

interface ImportLocalDialogProps {
  userId: string
  count: number
  /** Appelée à la fermeture ; `imported` vrai si des projets ont été ajoutés (la liste est à relire). */
  onClose: (imported: boolean) => void
}

type Step = { type: 'ask' } | { type: 'working'; done: number; total: number } | { type: 'done'; result: ImportResult }

/** Propose de copier dans le compte les projets du navigateur, à la première connexion. */
export default function ImportLocalDialog({ userId, count, onClose }: ImportLocalDialogProps) {
  const [step, setStep] = useState<Step>({ type: 'ask' })
  const t = fr.auth.importLocal

  const handleImport = async () => {
    setStep({ type: 'working', done: 0, total: count })
    const result = await importLocalProjects(localRepository, repository, (done, total) =>
      setStep({ type: 'working', done, total }),
    )
    // Un échec laisse la proposition active pour la prochaine connexion.
    if (result.failed === 0) markImportAsked(userId)
    setStep({ type: 'done', result })
  }

  const handleDecline = () => {
    markImportAsked(userId)
    onClose(false)
  }

  if (step.type === 'working') {
    return (
      <Modal title={t.title} onClose={() => {}}>
        <p role="status" className="text-sm text-slate-600">
          {t.progress(step.done, step.total)}
        </p>
      </Modal>
    )
  }

  if (step.type === 'done') {
    const { imported, skipped, failed } = step.result
    return (
      <Modal title={t.resultTitle} onClose={() => onClose(imported > 0)}>
        <div role="status" className="space-y-1 text-sm text-slate-700">
          {imported > 0 && <p>{t.imported(imported)}</p>}
          {skipped > 0 && <p>{t.skipped(skipped)}</p>}
          {failed > 0 && <p className="text-red-700">{t.failed(failed)}</p>}
        </div>
        <div className="mt-6 flex justify-end">
          <Button variant="primary" onClick={() => onClose(imported > 0)}>
            {fr.common.close}
          </Button>
        </div>
      </Modal>
    )
  }

  return (
    <Modal title={t.title} onClose={() => onClose(false)}>
      <p className="text-sm text-slate-600">{t.message(count)}</p>
      <div className="mt-6 flex justify-end gap-2">
        <Button onClick={handleDecline}>{t.decline}</Button>
        <Button variant="primary" onClick={() => void handleImport()}>
          {t.importAction}
        </Button>
      </div>
    </Modal>
  )
}
