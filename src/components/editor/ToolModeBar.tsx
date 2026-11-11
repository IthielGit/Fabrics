import clsx from 'clsx'
import { fr } from '../../i18n/fr'
import { useEditorStore } from '../../stores/editorStore'

interface ModeButtonProps {
  label: string
  active: boolean
  onClick: () => void
}

function ModeButton({ label, active, onClick }: ModeButtonProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={clsx(
        'rounded-md px-3 py-1 text-sm font-medium',
        active ? 'bg-indigo-600 text-white' : 'text-slate-700 hover:bg-slate-100',
      )}
    >
      {label}
    </button>
  )
}

/**
 * Modes de l'outil Mur (polyligne / mur droit) et de l'outil Pièce (polygone / rectangle, avec ou
 * sans murs), sans bouton de plus dans la barre d'outils.
 */
export default function ToolModeBar() {
  const tool = useEditorStore((state) => state.activeTool)
  const wallMode = useEditorStore((state) => state.wallMode)
  const roomMode = useEditorStore((state) => state.roomMode)
  const withWalls = useEditorStore((state) => state.roomWithWalls)
  const setWallMode = useEditorStore((state) => state.setWallMode)
  const setRoomMode = useEditorStore((state) => state.setRoomMode)
  const platformMode = useEditorStore((state) => state.platformMode)
  const setPlatformMode = useEditorStore((state) => state.setPlatformMode)
  const stairShape = useEditorStore((state) => state.stairShape)
  const setStairShape = useEditorStore((state) => state.setStairShape)
  const setRoomWithWalls = useEditorStore((state) => state.setRoomWithWalls)

  if (tool !== 'wall' && tool !== 'room' && tool !== 'platform' && tool !== 'stair') return null

  return (
    <div
      role="group"
      aria-label={fr.toolModes.label}
      className="pointer-events-auto flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1 shadow"
    >
      {tool === 'stair' ? (
        <>
          {(['straight', 'l', 'u'] as const).map((shape) => (
            <ModeButton
              key={shape}
              label={fr.stairs.shapes[shape]}
              active={stairShape === shape}
              onClick={() => setStairShape(shape)}
            />
          ))}
        </>
      ) : tool === 'platform' ? (
        <>
          <ModeButton
            label={fr.toolModes.platformPolygon}
            active={platformMode === 'polygon'}
            onClick={() => setPlatformMode('polygon')}
          />
          <ModeButton
            label={fr.toolModes.platformRectangle}
            active={platformMode === 'rectangle'}
            onClick={() => setPlatformMode('rectangle')}
          />
        </>
      ) : tool === 'wall' ? (
        <>
          <ModeButton
            label={fr.toolModes.wallPolyline}
            active={wallMode === 'polyline'}
            onClick={() => setWallMode('polyline')}
          />
          <ModeButton
            label={fr.toolModes.wallStraight}
            active={wallMode === 'straight'}
            onClick={() => setWallMode('straight')}
          />
        </>
      ) : (
        <>
          <ModeButton
            label={fr.toolModes.roomPolygon}
            active={roomMode === 'polygon'}
            onClick={() => setRoomMode('polygon')}
          />
          <ModeButton
            label={fr.toolModes.roomRectangle}
            active={roomMode === 'rectangle'}
            onClick={() => setRoomMode('rectangle')}
          />
          {roomMode === 'rectangle' && (
            <label
              title={fr.toolModes.withWallsTitle}
              className="ml-1 flex cursor-pointer items-center gap-1.5 border-l border-slate-200 pl-3 pr-2 text-sm text-slate-700"
            >
              <input
                type="checkbox"
                checked={withWalls}
                onChange={(event) => setRoomWithWalls(event.target.checked)}
              />
              {fr.toolModes.withWalls}
            </label>
          )}
        </>
      )}
    </div>
  )
}
