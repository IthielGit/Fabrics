import clsx from 'clsx'
import { Circle, MousePointer2, Slash, Square, Type, type LucideIcon } from 'lucide-react'
import { fr } from '../../i18n/fr'
import { useEditorStore, type EditorTool } from '../../stores/editorStore'

interface ToolDefinition {
  tool: EditorTool
  icon: LucideIcon
  label: string
  shortcut: string
}

const TOOLS: ToolDefinition[] = [
  { tool: 'select', icon: MousePointer2, label: fr.tools.select, shortcut: 'V' },
  { tool: 'rect', icon: Square, label: fr.tools.rect, shortcut: 'R' },
  { tool: 'ellipse', icon: Circle, label: fr.tools.ellipse, shortcut: 'O' },
  { tool: 'line', icon: Slash, label: fr.tools.line, shortcut: 'L' },
  { tool: 'text', icon: Type, label: fr.tools.text, shortcut: 'T' },
]

export default function Toolbar() {
  const activeTool = useEditorStore((state) => state.activeTool)
  const setTool = useEditorStore((state) => state.setTool)

  return (
    <nav
      aria-label={fr.tools.label}
      className="absolute left-3 top-3 z-10 flex flex-col gap-1 rounded-lg border border-slate-200 bg-white p-1 shadow"
    >
      {TOOLS.map(({ tool, icon: Icon, label, shortcut }) => (
        <button
          key={tool}
          type="button"
          title={`${label} (${shortcut})`}
          aria-label={label}
          aria-pressed={activeTool === tool}
          onClick={() => setTool(tool)}
          className={clsx(
            'rounded-md p-2',
            activeTool === tool
              ? 'bg-indigo-600 text-white'
              : 'text-slate-700 hover:bg-slate-100',
          )}
        >
          <Icon size={20} />
        </button>
      ))}
    </nav>
  )
}
