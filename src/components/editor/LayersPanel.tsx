import clsx from 'clsx'
import {
  Armchair,
  ChevronDown,
  ChevronUp,
  Circle,
  DoorOpen,
  Eye,
  EyeOff,
  GripVertical,
  Hash,
  ImageIcon,
  Lock,
  Slash,
  Square,
  Type,
  Unlock,
  type LucideIcon,
} from 'lucide-react'
import { useState, type DragEvent, type KeyboardEvent } from 'react'
import { fr } from '../../i18n/fr'
import { selectActiveElements, useEditorStore } from '../../stores/editorStore'
import type { CanvasElement } from '../../types/document'

const TYPE_ICONS: Record<CanvasElement['type'], LucideIcon> = {
  rect: Square,
  ellipse: Circle,
  line: Slash,
  text: Type,
  image: ImageIcon,
  wall: Square,
  room: Square,
  dimension: Slash,
  opening: DoorOpen,
  axis: Hash,
  furniture: Armchair,
}

const ROW_BUTTON = 'rounded p-1 text-slate-500 hover:bg-slate-200 disabled:opacity-30 disabled:hover:bg-transparent'

export default function LayersPanel() {
  // Seuls les éléments du niveau actif sont listés.
  const elements = useEditorStore(selectActiveElements)
  const isOpen = useEditorStore((state) => state.project !== null)
  const selectedIds = useEditorStore((state) => state.selectedIds)
  const setSelection = useEditorStore((state) => state.setSelection)
  const updateElements = useEditorStore((state) => state.updateElements)
  const reorderElement = useEditorStore((state) => state.reorderElement)
  const stepElementOrder = useEditorStore((state) => state.stepElementOrder)

  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [dragId, setDragId] = useState<string | null>(null)
  const [dropSlot, setDropSlot] = useState<number | null>(null)

  if (!isOpen) return null
  // Le dessus est en haut de la liste.
  const rows = [...elements].reverse()

  const handleRowClick = (id: string, additive: boolean) => {
    if (additive) {
      setSelection(selectedIds.includes(id) ? selectedIds.filter((i) => i !== id) : [...selectedIds, id])
    } else {
      setSelection([id])
    }
  }

  const commitName = (id: string, name: string) => {
    setRenamingId(null)
    const trimmed = name.trim()
    const current = elements.find((el) => el.id === id)
    if (trimmed && current && trimmed !== current.name) {
      updateElements([id], (el) => ({ ...el, name: trimmed }))
    }
  }

  const handleRenameKey = (id: string, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') commitName(id, event.currentTarget.value)
    else if (event.key === 'Escape') setRenamingId(null)
  }

  // --- Glisser-déposer (HTML5 natif) ---

  const handleDragOver = (event: DragEvent<HTMLLIElement>, rowIndex: number) => {
    if (dragId === null) return
    event.preventDefault()
    const bounds = event.currentTarget.getBoundingClientRect()
    const inLowerHalf = event.clientY > bounds.top + bounds.height / 2
    setDropSlot(inLowerHalf ? rowIndex + 1 : rowIndex)
  }

  const endDrag = () => {
    setDragId(null)
    setDropSlot(null)
  }

  const handleDrop = (event: DragEvent<HTMLElement>) => {
    event.preventDefault()
    if (dragId !== null && dropSlot !== null) reorderElement(dragId, dropSlot)
    endDrag()
  }

  return (
    <section aria-label={fr.layers.title} className="p-4">
      <h2 className="text-sm font-semibold text-slate-900">{fr.layers.title}</h2>

      {rows.length === 0 && <p className="mt-3 text-sm text-slate-500">{fr.layers.empty}</p>}

      <ul className="mt-3 space-y-0.5" onDrop={handleDrop} onDragLeave={() => setDropSlot(null)}>
        {rows.map((element, rowIndex) => {
          const Icon = TYPE_ICONS[element.type]
          const selected = selectedIds.includes(element.id)
          const dragging = dragId === element.id
          return (
            <li
              key={element.id}
              draggable={renamingId !== element.id}
              onDragStart={(event) => {
                event.dataTransfer.effectAllowed = 'move'
                event.dataTransfer.setData('text/plain', element.id)
                setDragId(element.id)
              }}
              onDragOver={(event) => handleDragOver(event, rowIndex)}
              onDragEnd={endDrag}
              onClick={(event) => handleRowClick(element.id, event.shiftKey)}
              className={clsx(
                'relative flex items-center gap-1 rounded-md px-1 py-1 text-sm',
                selected ? 'bg-indigo-50 text-indigo-900' : 'text-slate-700 hover:bg-slate-50',
                dragging && 'opacity-40',
                element.hidden && 'text-slate-400',
              )}
              aria-selected={selected}
            >
              {dropSlot === rowIndex && dragId !== null && (
                <span className="absolute inset-x-0 -top-0.5 h-0.5 rounded bg-indigo-500" />
              )}
              {dropSlot === rowIndex + 1 && rowIndex === rows.length - 1 && dragId !== null && (
                <span className="absolute inset-x-0 -bottom-0.5 h-0.5 rounded bg-indigo-500" />
              )}

              <span title={fr.layers.drag} className="cursor-grab text-slate-400">
                <GripVertical size={14} />
              </span>
              <Icon size={14} className="shrink-0 text-slate-500" aria-hidden="true" />

              {renamingId === element.id ? (
                <input
                  autoFocus
                  defaultValue={element.name}
                  aria-label={fr.layers.nameLabel}
                  onFocus={(event) => event.target.select()}
                  onBlur={(event) => commitName(element.id, event.target.value)}
                  onKeyDown={(event) => handleRenameKey(element.id, event)}
                  onClick={(event) => event.stopPropagation()}
                  className="min-w-0 flex-1 rounded border border-indigo-500 px-1 py-0.5 text-sm text-slate-900 focus:outline-none"
                />
              ) : (
                <span
                  title={fr.layers.renameHint}
                  onDoubleClick={() => setRenamingId(element.id)}
                  className="min-w-0 flex-1 truncate"
                >
                  {element.name}
                </span>
              )}

              <button
                type="button"
                title={fr.layers.moveUp}
                aria-label={fr.layers.moveUp}
                disabled={rowIndex === 0}
                onClick={(event) => {
                  event.stopPropagation()
                  stepElementOrder(element.id, 'up')
                }}
                className={ROW_BUTTON}
              >
                <ChevronUp size={14} />
              </button>
              <button
                type="button"
                title={fr.layers.moveDown}
                aria-label={fr.layers.moveDown}
                disabled={rowIndex === rows.length - 1}
                onClick={(event) => {
                  event.stopPropagation()
                  stepElementOrder(element.id, 'down')
                }}
                className={ROW_BUTTON}
              >
                <ChevronDown size={14} />
              </button>
              <button
                type="button"
                title={element.hidden ? fr.layers.show : fr.layers.hide}
                aria-label={element.hidden ? fr.layers.show : fr.layers.hide}
                aria-pressed={element.hidden}
                onClick={(event) => {
                  event.stopPropagation()
                  updateElements([element.id], (el) => ({ ...el, hidden: !el.hidden }))
                }}
                className={ROW_BUTTON}
              >
                {element.hidden ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
              <button
                type="button"
                title={element.locked ? fr.layers.unlock : fr.layers.lock}
                aria-label={element.locked ? fr.layers.unlock : fr.layers.lock}
                aria-pressed={element.locked}
                onClick={(event) => {
                  event.stopPropagation()
                  updateElements([element.id], (el) => ({ ...el, locked: !el.locked }))
                }}
                className={ROW_BUTTON}
              >
                {element.locked ? <Lock size={14} /> : <Unlock size={14} />}
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
