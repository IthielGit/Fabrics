import clsx from 'clsx'
import {
  BrickWall,
  Circle,
  Crosshair,
  DoorOpen,
  Grid2x2,
  ImagePlus,
  MousePointer2,
  Pentagon,
  Ruler,
  Slash,
  Square,
  Type,
  type LucideIcon,
} from 'lucide-react'
import { useRef } from 'react'
import { ACCEPTED_IMAGE_TYPES } from '../../features/documents/images'
import { fr } from '../../i18n/fr'
import { useEditorStore, type EditorTool } from '../../stores/editorStore'
import { importImageFiles } from './importImages'

interface ToolDefinition {
  tool: EditorTool
  icon: LucideIcon
  label: string
  /** Touche de raccourci, si l'outil en a une. */
  shortcut?: string
}

const COMMON_TOOLS: ToolDefinition[] = [
  { tool: 'select', icon: MousePointer2, label: fr.tools.select, shortcut: 'V' },
  { tool: 'rect', icon: Square, label: fr.tools.rect, shortcut: 'R' },
  { tool: 'ellipse', icon: Circle, label: fr.tools.ellipse, shortcut: 'O' },
  { tool: 'line', icon: Slash, label: fr.tools.line, shortcut: 'L' },
  { tool: 'text', icon: Type, label: fr.tools.text, shortcut: 'T' },
]

// Réservés aux projets de type Plan.
const PLAN_TOOLS: ToolDefinition[] = [
  { tool: 'wall', icon: BrickWall, label: fr.tools.wall, shortcut: 'W' },
  { tool: 'room', icon: Pentagon, label: fr.tools.room, shortcut: 'P' },
  { tool: 'dimension', icon: Ruler, label: fr.tools.dimension, shortcut: 'D' },
  { tool: 'door', icon: DoorOpen, label: fr.tools.door, shortcut: 'B' },
  { tool: 'window', icon: Grid2x2, label: fr.tools.window, shortcut: 'F' },
  { tool: 'calibrate', icon: Crosshair, label: fr.tools.calibrate },
]

export default function Toolbar() {
  const activeTool = useEditorStore((state) => state.activeTool)
  const setTool = useEditorStore((state) => state.setTool)
  const isPlan = useEditorStore((state) => state.project?.kind === 'plan')
  const fileInput = useRef<HTMLInputElement>(null)

  const renderTool = ({ tool, icon: Icon, label, shortcut }: ToolDefinition) => (
    <button
      key={tool}
      type="button"
      title={shortcut ? `${label} (${shortcut})` : label}
      aria-label={label}
      aria-pressed={activeTool === tool}
      onClick={() => setTool(tool)}
      className={clsx(
        'rounded-md p-2',
        activeTool === tool ? 'bg-indigo-600 text-white' : 'text-slate-700 hover:bg-slate-100',
      )}
    >
      <Icon size={20} />
    </button>
  )

  return (
    <nav
      aria-label={fr.tools.label}
      className="absolute left-3 top-3 z-10 flex flex-col gap-1 rounded-lg border border-slate-200 bg-white p-1 shadow"
    >
      {COMMON_TOOLS.map(renderTool)}
      <button
        type="button"
        title={fr.tools.image}
        aria-label={fr.tools.image}
        onClick={() => fileInput.current?.click()}
        className="rounded-md p-2 text-slate-700 hover:bg-slate-100"
      >
        <ImagePlus size={20} />
      </button>
      {isPlan && (
        <>
          <hr className="my-0.5 border-slate-200" />
          {PLAN_TOOLS.map(renderTool)}
        </>
      )}
      <input
        ref={fileInput}
        type="file"
        multiple
        hidden
        accept={ACCEPTED_IMAGE_TYPES.join(',')}
        onChange={(event) => {
          void importImageFiles(Array.from(event.target.files ?? []))
          event.target.value = '' // permet de choisir deux fois le même fichier
        }}
      />
    </nav>
  )
}
