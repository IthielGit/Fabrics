import { DESIGN_FORMATS, type DesignFormatId } from '../../features/documents/createProject'
import { fr } from '../../i18n/fr'
import Modal from '../ui/Modal'

interface NewDesignDialogProps {
  onSelect: (formatId: DesignFormatId) => void
  onClose: () => void
}

const PREVIEW_BOX = 56 // px : plus grand côté de l'aperçu

export default function NewDesignDialog({ onSelect, onClose }: NewDesignDialogProps) {
  return (
    <Modal title={fr.formats.title} onClose={onClose}>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {DESIGN_FORMATS.map((format) => {
          const ratio = PREVIEW_BOX / Math.max(format.width, format.height)
          return (
            <li key={format.id}>
              <button
                type="button"
                onClick={() => onSelect(format.id)}
                className="flex h-full w-full flex-col items-center gap-2 rounded-lg border border-slate-200 p-3 text-center hover:border-indigo-500 hover:bg-indigo-50"
              >
                <span className="flex h-16 items-center justify-center">
                  <span
                    className="block rounded-sm border-2 border-indigo-400 bg-indigo-100"
                    style={{ width: format.width * ratio, height: format.height * ratio }}
                  />
                </span>
                <span className="text-sm font-medium text-slate-900">{fr.formats[format.id]}</span>
                <span className="text-xs text-slate-500">
                  {fr.formats.size(format.width, format.height)}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </Modal>
  )
}
