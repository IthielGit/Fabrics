import clsx from 'clsx'
import { Box, Eye, PanelsTopLeft, PencilRuler } from 'lucide-react'
import { Link } from 'react-router'
import { fr } from '../../i18n/fr'
import { useEditorStore } from '../../stores/editorStore'
import { useViewer3DStore } from '../../stores/viewer3dStore'
import { useViewsStore } from '../../stores/viewsStore'
import ViewsScreen from '../views/ViewsScreen'
import Viewer3DPanel from '../viewer3d/Viewer3DPanel'
import EditorStage from './EditorStage'
import LevelSelector from './LevelSelector'
import Notice from './Notice'
import ZoomControls from './ZoomControls'

const ICON_BUTTON =
  'rounded-md p-2 text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40'

/**
 * Plan, 3D et planche d'un projet déjà chargé dans l'éditeur, sans aucun outil de modification.
 * Utilisé par la page de partage public (`/s/…`) et par un compte invité en lecture (`/p/…`).
 */
export default function ReadOnlyViewer() {
  const projectName = useEditorStore((state) => state.project?.name ?? '')
  const viewer3DOpen = useViewer3DStore((state) => state.open)
  const toggleViewer3D = useViewer3DStore((state) => state.toggleOpen)
  const openViews = useViewsStore((state) => state.openViews)

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden">
      <header className="flex h-12 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-3">
        <Link to="/" className="flex items-center gap-2" title={fr.sharedView.madeWith}>
          <span className="flex size-7 items-center justify-center rounded-lg bg-indigo-950 text-indigo-200">
            <PencilRuler size={14} aria-hidden="true" />
          </span>
          <span className="font-bold text-indigo-950">{fr.app.name}</span>
        </Link>
        <h1 className="min-w-0 truncate font-medium text-slate-900">{projectName}</h1>
        <span className="flex shrink-0 items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
          <Eye size={12} aria-hidden="true" />
          {fr.sharedView.badge}
        </span>
        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={toggleViewer3D}
            aria-pressed={viewer3DOpen}
            title={viewer3DOpen ? fr.viewer3d.close : fr.viewer3d.open}
            aria-label={viewer3DOpen ? fr.viewer3d.close : fr.viewer3d.open}
            className={clsx(ICON_BUTTON, viewer3DOpen && 'bg-indigo-50 text-indigo-700')}
          >
            <Box size={18} />
          </button>
          <button
            type="button"
            onClick={openViews}
            title={fr.views.open}
            aria-label={fr.views.open}
            className="flex items-center gap-1.5 rounded-md px-2 py-2 text-sm text-slate-700 hover:bg-slate-100"
          >
            <PanelsTopLeft size={18} aria-hidden="true" />
            {fr.views.openLabel}
          </button>
        </div>
      </header>
      <div className="flex min-h-0 flex-1">
        <div className="relative min-w-0 flex-1">
          <EditorStage readOnly />
          <div className="pointer-events-none absolute left-3 right-3 top-3 z-10 flex items-start gap-2">
            <LevelSelector />
          </div>
          <ZoomControls />
          <Notice />
        </div>
        <Viewer3DPanel />
      </div>
      <ViewsScreen />
    </div>
  )
}
