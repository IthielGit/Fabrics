import { Camera, Crosshair, X } from 'lucide-react'
import { lazy, Suspense, useCallback, useMemo, useRef, useState, type PointerEvent } from 'react'
import { exportFileName } from '../../features/export/fileName'
import { fr } from '../../i18n/fr'
import { dataUrlToBlob } from '../../lib/dataUrl'
import { downloadBlob } from '../../lib/download'
import { useEditorStore } from '../../stores/editorStore'
import { useViewer3DStore } from '../../stores/viewer3dStore'
import Viewer3DErrorBoundary from './Viewer3DErrorBoundary'
import { useBuildingModel } from './useBuildingModel'

// Three.js n'est chargé qu'à la première ouverture du panneau : l'éditeur démarre aussi vite.
const Viewer3DScene = lazy(() => import('./Viewer3DScene'))

const HEADER_BUTTON =
  'rounded-md p-1.5 text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40'

function Message({ children }: { children: string }) {
  return <p className="p-4 text-sm text-slate-500">{children}</p>
}

/** Panneau 3D à droite du plan : ouvrable, fermable, redimensionnable. */
function PanelBody() {
  const width = useViewer3DStore((state) => state.width)
  const openFloor = useViewer3DStore((state) => state.openFloor)
  const setWidth = useViewer3DStore((state) => state.setWidth)
  const setOpen = useViewer3DStore((state) => state.setOpen)
  const setOpenFloor = useViewer3DStore((state) => state.setOpenFloor)
  const activeLevelId = useEditorStore((state) => state.activeLevelId)

  const northAngle = useEditorStore((state) => state.project?.document.plan?.northAngle ?? 0)
  const projectName = useEditorStore((state) => state.project?.name ?? '')
  const selectedList = useEditorStore((state) => state.selectedIds)
  const selectedIds = useMemo(() => new Set(selectedList), [selectedList])

  const model = useBuildingModel(openFloor && activeLevelId ? activeLevelId : undefined)
  const [fitToken, setFitToken] = useState(0)
  const panelRef = useRef<HTMLElement>(null)
  const captureRef = useRef<(() => string | null) | null>(null)

  // Un clic sur un mur en 3D le sélectionne sur le plan, en passant d'abord à son niveau.
  const selectWall = useCallback((wallId: string, levelId: string) => {
    const { setActiveLevel, setSelection } = useEditorStore.getState()
    setActiveLevel(levelId)
    setSelection([wallId])
  }, [])

  const capture = () => {
    const store = useEditorStore.getState()
    try {
      const dataUrl = captureRef.current?.()
      if (!dataUrl) throw new Error('no capture')
      const name = exportFileName(`${projectName} ${fr.viewer3d.captureSuffix}`, 'png', fr.viewer3d.captureSuffix)
      downloadBlob(dataUrlToBlob(dataUrl), name)
    } catch {
      store.setNotice(fr.viewer3d.captureFailed)
    }
  }

  const resize = (event: PointerEvent<HTMLDivElement>) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId) || !panelRef.current) return
    const right = panelRef.current.getBoundingClientRect().right
    setWidth(right - event.clientX, window.innerWidth)
  }

  return (
    <section
      ref={panelRef}
      style={{ width }}
      className="relative flex shrink-0 flex-col border-l border-slate-200 bg-white"
      aria-label={fr.viewer3d.title}
    >
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label={fr.viewer3d.resize}
        onPointerDown={(event) => event.currentTarget.setPointerCapture(event.pointerId)}
        onPointerMove={resize}
        className="absolute inset-y-0 -left-1 z-10 w-2 cursor-col-resize hover:bg-indigo-200/60 active:bg-indigo-300/60"
      />

      <div className="flex h-10 shrink-0 items-center gap-2 border-b border-slate-200 px-3">
        <h2 className="text-sm font-semibold text-slate-900">{fr.viewer3d.title}</h2>
        <label
          title={fr.viewer3d.openFloorHint}
          className="ml-auto flex items-center gap-1.5 text-xs text-slate-600"
        >
          <input
            type="checkbox"
            checked={openFloor}
            onChange={(event) => setOpenFloor(event.target.checked)}
          />
          {fr.viewer3d.openFloor}
        </label>
        <button
          type="button"
          onClick={capture}
          disabled={model.bounds === null}
          title={fr.viewer3d.capture}
          aria-label={fr.viewer3d.capture}
          className={HEADER_BUTTON}
        >
          <Camera size={16} />
        </button>
        <button
          type="button"
          onClick={() => setFitToken((n) => n + 1)}
          title={fr.viewer3d.fit}
          aria-label={fr.viewer3d.fit}
          className={HEADER_BUTTON}
        >
          <Crosshair size={16} />
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          title={fr.viewer3d.close}
          aria-label={fr.viewer3d.close}
          className={HEADER_BUTTON}
        >
          <X size={16} />
        </button>
      </div>

      <div className="relative min-h-0 flex-1">
        <Viewer3DErrorBoundary fallback={<Message>{fr.viewer3d.error}</Message>}>
          <Suspense fallback={<Message>{fr.viewer3d.loading}</Message>}>
            <Viewer3DScene
              model={model}
              fitToken={fitToken}
              northAngle={northAngle}
              selectedIds={selectedIds}
              onSelectWall={selectWall}
              captureRef={captureRef}
            />
          </Suspense>
        </Viewer3DErrorBoundary>
        {model.bounds === null && (
          <p className="pointer-events-none absolute inset-x-0 top-4 px-4 text-center text-sm text-slate-500">
            {fr.viewer3d.empty}
          </p>
        )}
      </div>
    </section>
  )
}

export default function Viewer3DPanel() {
  const open = useViewer3DStore((state) => state.open)
  const isPlan = useEditorStore((state) => state.project?.kind === 'plan')
  if (!open || !isPlan) return null
  return <PanelBody />
}
