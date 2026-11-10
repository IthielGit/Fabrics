export type ShortcutAction =
  | 'tool-select'
  | 'tool-rect'
  | 'tool-ellipse'
  | 'tool-line'
  | 'escape'
  | 'fit-view'
  | 'undo'
  | 'redo'
  | 'delete'
  | 'duplicate'

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
    if (key === '0' && !input.shiftKey) return 'fit-view'
    return null
  }
  if (input.altKey) return null

  switch (key) {
    case 'v':
      return 'tool-select'
    case 'r':
      return 'tool-rect'
    case 'o':
      return 'tool-ellipse'
    case 'l':
      return 'tool-line'
    case 'escape':
      return 'escape'
    case 'delete':
    case 'backspace':
      return 'delete'
    default:
      return null
  }
}
