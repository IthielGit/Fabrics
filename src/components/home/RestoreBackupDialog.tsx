import { useState } from 'react'
import { logAuditEvent } from '../../features/audit/auditApi'
import { readBackup, restoredProject, type BackupReadResult } from '../../features/backup/backup'
import { repository } from '../../features/persistence/repository'
import { fr } from '../../i18n/fr'
import { usePricingStore } from '../../stores/pricingStore'
import type { Project } from '../../types/document'
import Button from '../ui/Button'
import Modal from '../ui/Modal'

interface RestoreBackupDialogProps {
  /** Enregistre le nouveau projet et rend son identifiant. */
  onImport: (project: Project) => Promise<string>
  onOpen: (projectId: string) => void
  onClose: () => void
}

type Step = { type: 'choose'; error?: string } | { type: 'working' } | { type: 'done'; projectId: string; name: string }

/** Remet le devis (réglages, corrections) dans l'espace ouvert si la personne en est admin. */
async function restoreEstimate(result: Extract<BackupReadResult, { ok: true }>, projectId: string): Promise<void> {
  const { repository: pricing, library, workspace } = usePricingStore.getState()
  const record = result.estimate?.record
  if (!pricing || !library || workspace?.role !== 'admin' || !record) return
  await pricing.saveProjectEstimate(library.id, projectId, { a1Bp: record.a1Bp, a2Bp: record.a2Bp, a3Bp: record.a3Bp, overrides: record.overrides })
}

/** Restaure une sauvegarde `.fabrics` en nouvelle copie (M24, 24.3, D24-3) ; l'original n'est jamais touché. */
export default function RestoreBackupDialog({ onImport, onOpen, onClose }: RestoreBackupDialogProps) {
  const [step, setStep] = useState<Step>({ type: 'choose' })
  const t = fr.backup

  const handleFile = async (file: File) => {
    setStep({ type: 'working' })
    try {
      const result = await readBackup(new Uint8Array(await file.arrayBuffer()))
      if (!result.ok) return setStep({ type: 'choose', error: t.refused[result.reason] })
      for (const [id, bytes] of Object.entries(result.assets)) await repository.putAsset(id, new Blob([bytes as Uint8Array<ArrayBuffer>]))
      const copy = restoredProject(result.project)
      const projectId = await onImport(copy)
      void logAuditEvent('restore', projectId, { from: result.project.name, savedAt: result.createdAt })
      await restoreEstimate(result, projectId).catch((error: unknown) => console.error('Devis restauré :', error))
      setStep({ type: 'done', projectId, name: copy.name })
    } catch (error) {
      console.error('Restauration échouée', error)
      setStep({ type: 'choose', error: t.refused.damaged })
    }
  }

  if (step.type === 'working') {
    return (
      <Modal title={t.restoreTitle} onClose={() => {}}>
        <p role="status" className="text-sm text-muted-foreground">
          {t.working}
        </p>
      </Modal>
    )
  }

  if (step.type === 'done') {
    return (
      <Modal title={t.restoreTitle} onClose={onClose}>
        <p role="status" className="text-sm">
          {t.done(step.name)}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">{t.estimateNote}</p>
        <div className="mt-6 flex justify-end gap-2">
          <Button onClick={onClose}>{fr.common.close}</Button>
          <Button variant="primary" onClick={() => onOpen(step.projectId)}>
            {t.open}
          </Button>
        </div>
      </Modal>
    )
  }

  return (
    <Modal title={t.restoreTitle} onClose={onClose}>
      <p className="text-sm text-muted-foreground">{t.restoreIntro}</p>
      {step.error && (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {step.error}
        </p>
      )}
      <label className="mt-4 inline-flex cursor-pointer items-center rounded-md border px-3 py-2 text-sm hover:bg-accent">
        {t.choose}
        <input
          type="file"
          accept=".fabrics"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) void handleFile(file)
            event.target.value = ''
          }}
        />
      </label>
      <div className="mt-6 flex justify-end">
        <Button onClick={onClose}>{fr.common.cancel}</Button>
      </div>
    </Modal>
  )
}
