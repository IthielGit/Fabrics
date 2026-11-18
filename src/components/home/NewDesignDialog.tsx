import { DESIGN_FORMATS, type DesignFormatId } from '../../features/documents/createProject'
import { useT } from '../../i18n/useT'
import Modal from '../ui/Modal'

interface NewDesignDialogProps {
  onSelect: (formatId: DesignFormatId) => void
  onClose: () => void
}

const PREVIEW_BOX = 56 // px : plus grand côté de l'aperçu

/** Choix du format d'un nouveau Visuel (affiche, post, flyer, bannière). */
export default function NewDesignDialog({ onSelect, onClose }: NewDesignDialogProps) {
  const t = useT()
  return (
    <Modal title={t('formats.title')} onClose={onClose}>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {DESIGN_FORMATS.map((format) => {
          const ratio = PREVIEW_BOX / Math.max(format.width, format.height)
          return (
            <li key={format.id}>
              <button
                type="button"
                onClick={() => onSelect(format.id)}
                className="flex h-full w-full flex-col items-center gap-2 rounded-lg border border-border p-3 text-center transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring"
              >
                <span className="flex h-16 items-center justify-center">
                  <span
                    className="block rounded-sm border-2 border-muted-foreground bg-secondary"
                    style={{ width: format.width * ratio, height: format.height * ratio }}
                  />
                </span>
                <span className="text-sm font-medium">{t(`formats.${format.id}` as const)}</span>
                <span className="text-xs text-muted-foreground">
                  {t('formats.size', { width: format.width, height: format.height })}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </Modal>
  )
}
