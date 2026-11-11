import clsx from 'clsx'
import {
  OPENING_STYLES,
  presetForQuick,
  presetForStyle,
  quickSizesFor,
  supportsTiltTurn,
} from '../../features/openings/styles'
import { fr } from '../../i18n/fr'
import { useEditorStore } from '../../stores/editorStore'
import type { OpeningStyle, RoofShape } from '../../types/document'

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

/** Style, tailles rapides et oscillo-battant des outils Porte et Fenêtre (M10 bis). */
function OpeningToolOptions({ kind }: { kind: 'door' | 'window' }) {
  const preset = useEditorStore((state) => state.openingPresets[kind])
  const setPreset = useEditorStore((state) => state.setOpeningPreset)
  const labels = fr.openingStyles

  return (
    <>
      <label className="flex items-center gap-1.5 pl-2 text-sm text-slate-700">
        {labels.label}
        <select
          value={preset.style}
          onChange={(event) => {
            const next = presetForStyle(kind, event.target.value as OpeningStyle)
            setPreset(kind, { ...next, tiltTurn: preset.tiltTurn && supportsTiltTurn(next.style) })
          }}
          className="rounded-md border border-slate-300 px-2 py-1 text-sm text-slate-900"
        >
          {OPENING_STYLES[kind].map(({ style }) => (
            <option key={style} value={style}>
              {labels.styles[style]}
            </option>
          ))}
        </select>
      </label>
      <div
        role="group"
        aria-label={labels.quickLabel}
        className="ml-1 flex items-center gap-1 border-l border-slate-200 pl-2"
      >
        {quickSizesFor(kind).map((quick) => (
          <ModeButton
            key={quick.id}
            label={labels.quick[quick.id]}
            active={preset.quickId === quick.id}
            onClick={() => setPreset(kind, presetForQuick(quick))}
          />
        ))}
      </div>
      {supportsTiltTurn(preset.style) && (
        <label
          title={labels.tiltTurnTitle}
          className="ml-1 flex cursor-pointer items-center gap-1.5 border-l border-slate-200 pl-3 pr-2 text-sm text-slate-700"
        >
          <input
            type="checkbox"
            checked={preset.tiltTurn}
            onChange={(event) => setPreset(kind, { ...preset, tiltTurn: event.target.checked })}
          />
          {labels.tiltTurn}
        </label>
      )}
    </>
  )
}

const ROOF_SHAPES: readonly RoofShape[] = ['flat', 'shed', 'gable', 'hip']

/** Forme de la toiture à tracer ; un toit plat peut aussi se tracer en polygone. */
function RoofToolOptions() {
  const shape = useEditorStore((state) => state.roofShape)
  const mode = useEditorStore((state) => state.roofMode)
  const setShape = useEditorStore((state) => state.setRoofShape)
  const setMode = useEditorStore((state) => state.setRoofMode)
  return (
    <>
      {ROOF_SHAPES.map((value) => (
        <ModeButton
          key={value}
          label={fr.roof.shapes[value]}
          active={shape === value}
          onClick={() => setShape(value)}
        />
      ))}
      {shape === 'flat' && (
        <div className="ml-1 flex items-center gap-1 border-l border-slate-200 pl-2">
          <ModeButton
            label={fr.toolModes.roofRectangle}
            active={mode === 'rectangle'}
            onClick={() => setMode('rectangle')}
          />
          <ModeButton
            label={fr.toolModes.roofPolygon}
            active={mode === 'polygon'}
            onClick={() => setMode('polygon')}
          />
        </div>
      )}
    </>
  )
}

/**
 * Modes de l'outil Mur (polyligne / mur droit) et de l'outil Pièce (polygone / rectangle, avec ou
 * sans murs), options des outils Porte et Fenêtre, sans bouton de plus dans la barre d'outils.
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

  const isOpeningTool = tool === 'door' || tool === 'window'
  if (
    !isOpeningTool &&
    tool !== 'wall' &&
    tool !== 'room' &&
    tool !== 'platform' &&
    tool !== 'stair' &&
    tool !== 'roof'
  ) {
    return null
  }

  return (
    <div
      role="group"
      aria-label={fr.toolModes.label}
      className="pointer-events-auto flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1 shadow"
    >
      {isOpeningTool ? (
        <OpeningToolOptions kind={tool} />
      ) : tool === 'roof' ? (
        <RoofToolOptions />
      ) : tool === 'stair' ? (
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
