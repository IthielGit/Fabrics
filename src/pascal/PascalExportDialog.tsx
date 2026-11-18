import EditorStage from '../components/editor/EditorStage'
import ExportDialog from '../components/editor/ExportDialog'

/**
 * Fenêtre Exporter de l'éditeur de Pascal (lot Performance). Les exports PNG, JPG et PDF (cotes Client
 * / Exécution comprises) se dessinent sur le plan de Fabrics : il n'est monté, hors de l'écran et en
 * lecture seule, que pendant que cette fenêtre est ouverte, et ce fichier n'est chargé qu'à ce moment.
 */
export default function PascalExportDialog({ onClose }: { onClose: () => void }) {
  return (
    <>
      <div aria-hidden="true" inert className="pointer-events-none fixed top-0 h-[900px] w-[1400px]" style={{ left: -20000 }}>
        <EditorStage readOnly />
      </div>
      <div className="fabrics-on-dark">
        <ExportDialog onClose={onClose} />
      </div>
    </>
  )
}
