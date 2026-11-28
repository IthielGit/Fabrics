import { useRef, useState } from 'react'
import { guardIfcFile, megabytes, readFileEnds, type IfcGuardResult } from '../../features/imports/fileGuard'
import { importReportSections, importReportText, type ImportReportSection } from '../../features/ifc/importReport'
import { downloadBlob } from '../../lib/download'
import { fr } from '../../i18n/fr'
import type { Project } from '../../types/document'
import Button from '../ui/Button'
import Modal from '../ui/Modal'

interface ImportIfcDialogProps {
  /** Enregistre le nouveau projet et rend son identifiant. */
  onImport: (project: Project) => Promise<string>
  onOpen: (projectId: string) => void
  onClose: () => void
}

type Step =
  | { type: 'choose'; failed: boolean; message?: string }
  | { type: 'slow'; file: File }
  | { type: 'working'; percent: number }
  | { type: 'done'; projectId: string; fileName: string; sections: ImportReportSection[]; clean: boolean }

/** Import d'un fichier IFC en nouveau projet Plan, puis son bilan (M22, 22.4, D22-6). */
export default function ImportIfcDialog({ onImport, onOpen, onClose }: ImportIfcDialogProps) {
  const [step, setStep] = useState<Step>({ type: 'choose', failed: false })
  const t = fr.importIfc
  // Numéro de l'import en cours : un import annulé (ou remplacé) ne crée jamais de projet.
  const run = useRef(0)

  const refusal = (result: Exclude<IfcGuardResult, { ok: true }>): string => {
    switch (result.reason) {
      case 'empty':
        return t.refused.empty
      case 'tooLarge':
        return t.refused.tooLarge(megabytes(result.sizeBytes), megabytes(result.maxBytes))
      case 'otherFormat':
        return t.refused.otherFormat(t.kinds[result.kind])
      case 'notIfc':
        return t.refused.notIfc
      case 'truncated':
        return t.refused.truncated
    }
  }

  // Contrôle avant lecture : taille, début et fin du fichier seulement (D24-7).
  const handleChosen = async (file: File) => {
    const guard = guardIfcFile(await readFileEnds(file))
    if (!guard.ok) return setStep({ type: 'choose', failed: true, message: refusal(guard) })
    if (guard.slow) return setStep({ type: 'slow', file })
    void handleFile(file)
  }

  const cancel = () => {
    run.current++
    setStep({ type: 'choose', failed: false, message: t.cancelled })
  }

  const handleFile = async (file: File) => {
    const id = ++run.current
    setStep({ type: 'working', percent: 0 })
    try {
      const bytes = new Uint8Array(await file.arrayBuffer())
      const [{ importIfc, importedPlanProject }, { locateWebIfcWasm }, { importReportHasIssues }] = await Promise.all([
        import('../../features/ifc/importIfc'),
        import('../../pascal/webIfcWasm'),
        import('../../features/ifc/importReport'),
      ])
      const result = await importIfc(bytes, {
        locateWasmFile: locateWebIfcWasm,
        onProgress: (percent) => {
          if (run.current === id) setStep({ type: 'working', percent })
        },
      })
      if (run.current !== id) return
      const name = file.name.replace(/\.ifc$/i, '').trim() || file.name
      const projectId = await onImport(importedPlanProject(name, result.scene))
      setStep({
        type: 'done',
        projectId,
        fileName: file.name,
        sections: importReportSections(result.report, t),
        clean: !importReportHasIssues(result.report),
      })
    } catch (error) {
      // Gardé dans la console : sans lui, la vraie cause d'un échec est invisible.
      console.error('Import IFC échoué', error)
      if (run.current === id) setStep({ type: 'choose', failed: true })
    }
  }

  if (step.type === 'working') {
    return (
      <Modal title={t.title} onClose={cancel}>
        <p role="status" className="text-sm text-muted-foreground">
          {t.working(step.percent)}
        </p>
        <div className="mt-6 flex justify-end">
          <Button onClick={cancel}>{t.cancelImport}</Button>
        </div>
      </Modal>
    )
  }

  if (step.type === 'slow') {
    return (
      <Modal title={t.slowTitle} onClose={onClose}>
        <p className="text-sm text-muted-foreground">{t.slow(megabytes(step.file.size))}</p>
        <div className="mt-6 flex justify-end gap-2">
          <Button onClick={onClose}>{fr.common.cancel}</Button>
          <Button variant="primary" onClick={() => void handleFile(step.file)}>
            {t.continue}
          </Button>
        </div>
      </Modal>
    )
  }

  if (step.type === 'done') {
    const download = () =>
      downloadBlob(
        new Blob([importReportText(t.reportTitle, step.fileName, step.sections)], { type: 'text/plain;charset=utf-8' }),
        `${step.fileName.replace(/\.ifc$/i, '')} - bilan import.txt`,
      )
    return (
      <Modal title={t.reportTitle} onClose={onClose}>
        <div role="status" className="max-h-[60vh] space-y-2 overflow-y-auto text-sm">
          {step.clean && <p className="font-medium">{t.allGood}</p>}
          {step.sections.map((section) => (
            <div key={section.text} className={section.tone === 'warning' ? 'text-amber-800' : 'text-foreground'}>
              <p>{section.text}</p>
              {section.items.length > 0 && (
                <ul className="list-disc pl-5 text-muted-foreground">
                  {section.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button onClick={download}>{t.download}</Button>
          <Button variant="primary" onClick={() => onOpen(step.projectId)}>
            {t.open}
          </Button>
        </div>
      </Modal>
    )
  }

  return (
    <Modal title={t.title} onClose={onClose}>
      <p className="text-sm text-muted-foreground">{t.intro}</p>
      {step.failed && (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {step.message ?? t.failed}
        </p>
      )}
      {!step.failed && step.message && (
        <p role="status" className="mt-2 text-sm text-muted-foreground">
          {step.message}
        </p>
      )}
      <label className="mt-4 inline-flex cursor-pointer items-center rounded-md border px-3 py-2 text-sm hover:bg-accent">
        {t.choose}
        <input
          type="file"
          accept=".ifc"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) void handleChosen(file)
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
