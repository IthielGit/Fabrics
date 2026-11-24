import { useState } from 'react'
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
  | { type: 'choose'; failed: boolean }
  | { type: 'working'; percent: number }
  | { type: 'done'; projectId: string; fileName: string; sections: ImportReportSection[]; clean: boolean }

/** Import d'un fichier IFC en nouveau projet Plan, puis son bilan (M22, 22.4, D22-6). */
export default function ImportIfcDialog({ onImport, onOpen, onClose }: ImportIfcDialogProps) {
  const [step, setStep] = useState<Step>({ type: 'choose', failed: false })
  const t = fr.importIfc

  const handleFile = async (file: File) => {
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
        onProgress: (percent) => setStep({ type: 'working', percent }),
      })
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
      setStep({ type: 'choose', failed: true })
    }
  }

  if (step.type === 'working') {
    return (
      <Modal title={t.title} onClose={() => {}}>
        <p role="status" className="text-sm text-muted-foreground">
          {t.working(step.percent)}
        </p>
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
          {t.failed}
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
            if (file) void handleFile(file)
          }}
        />
      </label>
      <div className="mt-6 flex justify-end">
        <Button onClick={onClose}>{fr.common.cancel}</Button>
      </div>
    </Modal>
  )
}
