export type ShortcutAction =
  | 'tool-select'
  | 'tool-rect'
  | 'tool-ellipse'
  | 'tool-line'
  | 'tool-text'
  | 'tool-wall'
  | 'tool-room'
  | 'tool-dimension'
  | 'tool-axis'
  | 'tool-stretch'
  | 'tool-door'
  | 'tool-window'
  | 'escape'
  | 'rotate'
  | 'fit-view'
  | 'undo'
  | 'redo'
  | 'delete'
  | 'duplicate'
  | 'copy'
  | 'paste'
  | 'select-all'
  | 'nudge-left'
  | 'nudge-right'
  | 'nudge-up'
  | 'nudge-down'

export interface KeyInput {
  key: string
  ctrlKey: boolean
  metaKey: boolean
  shiftKey: boolean
  altKey: boolean
}

/** Traduit une frappe en action de l'éditeur (voir « Raccourcis clavier » de docs/02-ARCHITECTURE.md). */
export function resolveShortcut(input: KeyInput): ShortcutAction | null {
  const key = input.key.toLowerCase()
  const withModifier = input.ctrlKey || input.metaKey

  if (withModifier) {
    if (input.altKey) return null
    if (key === 'z') return input.shiftKey ? 'redo' : 'undo'
    if (key === 'd' && !input.shiftKey) return 'duplicate'
    if (key === 'c' && !input.shiftKey) return 'copy'
    if (key === 'v' && !input.shiftKey) return 'paste'
    if (key === 'a' && !input.shiftKey) return 'select-all'
    if (key === '0' && !input.shiftKey) return 'fit-view'
    return null
  }
  if (input.altKey) return null

  switch (key) {
    case 'v':
      return 'tool-select'
    case 'r':
      return input.shiftKey ? 'rotate' : 'tool-rect'
    case 'o':
      return 'tool-ellipse'
    case 'l':
      return 'tool-line'
    case 't':
      return 'tool-text'
    case 'w':
      return 'tool-wall'
    case 'p':
      return 'tool-room'
    case 'd':
      return 'tool-dimension'
    case 'a':
      return 'tool-axis'
    case 's':
      return 'tool-stretch'
    case 'b':
      return 'tool-door'
    case 'f':
      return 'tool-window'
    case 'escape':
      return 'escape'
    case 'delete':
    case 'backspace':
      return 'delete'
    case 'arrowleft':
      return 'nudge-left'
    case 'arrowright':
      return 'nudge-right'
    case 'arrowup':
      return 'nudge-up'
    case 'arrowdown':
      return 'nudge-down'
    default:
      return null
  }
}
