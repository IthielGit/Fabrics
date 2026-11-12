import { BrickWall, Pentagon } from 'lucide-react'
import { fr } from '../../i18n/fr'
import { useEditorStore } from '../../stores/editorStore'

/** Invitation au centre d'un plan vide : elle disparaît dès le premier élément tracé. */
export default function EmptyPlanCard() {
  const isEmptyPlan = useEditorStore(
    (state) => state.project?.kind === 'plan' && state.project.document.elements.length === 0,
  )
  const setTool = useEditorStore((state) => state.setTool)
  const setRoomMode = useEditorStore((state) => state.setRoomMode)
  const setWallMode = useEditorStore((state) => state.setWallMode)
  if (!isEmptyPlan) return null

  const button =
    'flex items-center gap-2 rounded-md border border-indigo-200 bg-white px-3 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-50'
  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
      <section className="pointer-events-auto max-w-sm rounded-xl border border-slate-200 bg-white/95 p-5 text-center shadow-lg">
        <h2 className="text-base font-semibold text-slate-800">{fr.emptyPlan.title}</h2>
        <p className="mt-1 text-sm text-slate-600">{fr.emptyPlan.text}</p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <button type="button" className={button} onClick={() => {
              setRoomMode('rectangle') // le plus simple pour un premier tracé : deux coins opposés
              setTool('room')
            }}>
            <Pentagon size={16} aria-hidden="true" />
            {fr.emptyPlan.drawRoom}
          </button>
          <button type="button" className={button} onClick={() => {
              setWallMode('polyline')
              setTool('wall')
            }}>
            <BrickWall size={16} aria-hidden="true" />
            {fr.emptyPlan.drawWalls}
          </button>
        </div>
        <p className="mt-3 text-xs text-slate-500">{fr.emptyPlan.units}</p>
      </section>
    </div>
  )
}
