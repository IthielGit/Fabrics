import { FileUp } from 'lucide-react'
import { useRef, useState } from 'react'
import { planImport, summarizePlan, type ImportPlan } from '../../features/pricing/importPlan'
import type { ImportedLibrary } from '../../features/pricing/importWorkbook'
import { readPriceFile, sha256Hex } from '../../features/pricing/readPriceFile'
import { StaleLibraryError } from '../../features/pricing/repository'
import { useT } from '../../i18n/useT'
import { usePricingStore } from '../../stores/pricingStore'
import Button from '../ui/Button'
import Modal from '../ui/Modal'
import ImportPreview from './ImportPreview'

type Stage =
  | { type: 'pick' }
  | { type: 'reading' }
  | { type: 'preview'; fileName: string; sha256: string; result: ImportedLibrary; plan: ImportPlan; version: number }
  | { type: 'applying' }
  | { type: 'done'; version: number }
  | { type: 'failed'; stale: boolean }

/**
 * Import d'un fichier de prix (admins, M23 23.2) : lecture, aperçu de ce qui va changer avec le
 * rapport de lecture, puis application d'un bloc après confirmation.
 */
export default function ImportDialog({ onClose }: { onClose: () => void }) {
  const t = useT()
  const library = usePricingStore((state) => state.library)
  const priceItems = usePricingStore((state) => state.priceItems)
  const workItems = usePricingStore((state) => state.workItems)
  const applyImport = usePricingStore((state) => state.applyImport)
  const [stage, setStage] = useState<Stage>({ type: 'pick' })
  const inputRef = useRef<HTMLInputElement>(null)

  if (!library) return null

  const read = async (file: File) => {
    setStage({ type: 'reading' })
    const bytes = new Uint8Array(await file.arrayBuffer())
    const result = readPriceFile(file.name, bytes, library.vatRateBp)
    const plan = planImport({ priceItems, workItems }, result)
    setStage({ type: 'preview', fileName: file.name, sha256: await sha256Hex(bytes), result, plan, version: library.version })
  }

  const apply = async (preview: Extract<Stage, { type: 'preview' }>) => {
    setStage({ type: 'applying' })
    const warnings = preview.result.issues.filter((issue) => issue.level === 'warning').reduce((n, i) => n + i.count, 0)
    try {
      const version = await applyImport({
        expectedVersion: preview.version,
        priceDate: preview.result.priceDate,
        fileName: preview.fileName,
        sha256: preview.sha256,
        summary: summarizePlan(preview.plan, warnings),
        plan: preview.plan,
      })
      setStage({ type: 'done', version })
    } catch (error) {
      console.error('Import des prix :', error)
      setStage({ type: 'failed', stale: error instanceof StaleLibraryError })
    }
  }

  const busy = stage.type === 'reading' || stage.type === 'applying'

  return (
    <Modal title={t('pricing.import.title')} onClose={busy ? () => undefined : onClose} size="wide">
      {stage.type === 'pick' && (
        <div className="space-y-3 text-sm">
          <p>{t('pricing.import.intro')}</p>
          <p className="text-xs text-muted-foreground">{t('pricing.import.csvHelp')}</p>
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="sr-only"
            aria-label={t('pricing.import.choose')}
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) void read(file)
            }}
          />
          <Button variant="primary" onClick={() => inputRef.current?.click()}>
            <FileUp size={14} aria-hidden="true" />
            {t('pricing.import.choose')}
          </Button>
        </div>
      )}

      {stage.type === 'reading' && <p className="text-sm text-muted-foreground">{t('pricing.import.reading')}</p>}
      {stage.type === 'applying' && <p className="text-sm text-muted-foreground">{t('pricing.import.applying')}</p>}

      {stage.type === 'preview' && (
        <ImportPreview
          fileName={stage.fileName}
          result={stage.result}
          plan={stage.plan}
          version={stage.version}
          onApply={() => void apply(stage)}
          onCancel={onClose}
        />
      )}

      {stage.type === 'done' && (
        <div className="space-y-4 text-sm">
          <p role="status">{t('pricing.import.done', { version: stage.version })}</p>
          <div className="flex justify-end">
            <Button variant="primary" onClick={onClose}>
              {t('common.close')}
            </Button>
          </div>
        </div>
      )}

      {stage.type === 'failed' && (
        <div className="space-y-4 text-sm">
          <p role="alert" className="text-red-600">
            {t(stage.stale ? 'pricing.import.stale' : 'pricing.import.error')}
          </p>
          <div className="flex justify-end">
            <Button onClick={onClose}>{t('common.close')}</Button>
          </div>
        </div>
      )}
    </Modal>
  )
}

