import useEditor from '../store/use-editor'
import useInteractionScope from '../store/use-interaction-scope'
import { openSidebarPanel } from './sidebar-panel'

/**
 * The single-key tools of the editor, and the keys tooltips print for them.
 *
 * The drafting tools (Door, Window, Stairs, Roof) sit on Shift with their
 * letter: R flips or rotates the selection and the armed placement, and E
 * operates the selected door, window or cabinet. Fabrics (D82): the bare letters
 * are the Fabrics tools (`lib/fabrics-shortcuts`) and the arrows pan the view;
 * the Shift chords stay as a second way in.
 */
export type ToolShortcutId =
  | 'select'
  | 'delete'
  | 'wall'
  | 'item'
  | 'zone'
  | 'measurement'
  | 'paint'
  | 'terrain'
  | 'door'
  | 'window'
  | 'stair'
  | 'roof'

type ArmedByChord = {
  /** `KeyboardEvent.code`: the physical key, as pan reads it. */
  code: string
  shift: boolean
}

/**
 * Keys as `ShortcutToken` names them. Fabrics (D82): the former Fabrics letters
 * (`lib/fabrics-shortcuts`); empty for a tool reached by its Revit code only.
 * Shift+D and Shift+W still arm the door and the window.
 */
export const TOOL_SHORTCUT_KEYS: Record<ToolShortcutId, readonly string[]> = {
  select: ['V'],
  delete: ['X'],
  wall: ['W'],
  item: ['O'],
  zone: ['P'],
  measurement: ['M'],
  paint: [],
  terrain: ['G'],
  door: ['B'],
  window: ['F'],
  stair: ['Shift', 'S'],
  roof: ['Shift', 'R'],
}

/** Fabrics (D82): the Revit code typed for each tool, letter after letter. */
export const TOOL_REVIT_CODES: Partial<Record<ToolShortcutId, string>> = {
  wall: 'WA',
  item: 'CM',
  zone: 'RM',
  paint: 'PT',
  door: 'DR',
  window: 'WN',
  stair: 'ST',
  roof: 'RF',
}

/** The tools this module arms itself; the older keys stay in `use-keyboard`. */
const CHORDS: Partial<Record<ToolShortcutId, ArmedByChord>> = {
  door: { code: 'KeyD', shift: true },
  window: { code: 'KeyW', shift: true },
  stair: { code: 'KeyS', shift: true },
  roof: { code: 'KeyR', shift: true },
}

/** A tool's shortcut as a tooltip prints it: `W · WA`, `Shift+S · ST`, `PT`. Null for a tool without one. */
export function toolShortcutLabel(tool: string): string | null {
  const keys = TOOL_SHORTCUT_KEYS[tool as ToolShortcutId]
  if (!keys) return null
  const parts = [keys.join('+'), TOOL_REVIT_CODES[tool as ToolShortcutId] ?? ''].filter(Boolean)
  return parts.length > 0 ? parts.join(' · ') : null
}

/** A tool's tooltip with its shortcut: `Door (Shift+D)`; the bare label when it has none. */
export function withToolShortcut(label: string, tool: string | undefined): string {
  const shortcut = tool ? toolShortcutLabel(tool) : null
  return shortcut ? `${label} (${shortcut})` : label
}

// Gestures a held Shift modifies (free move, free rotate, force place): a Shift
// chord there is part of the gesture, never a tool switch.
const SHIFT_GESTURE_SCOPES = new Set([
  'room-divide',
  'placing',
  'moving',
  'handle-drag',
  'mesh-editing',
  'reshaping',
  'box-select',
  'painting',
  'sculpting',
  'pointing',
])

/**
 * The tool a key press arms, or null: the physical key and Shift, with no other
 * modifier and no repeat. A Shift chord is off while a gesture holds Shift, so
 * Shift+WASD keeps panning there.
 */
export function toolShortcutForKey(
  event: Pick<KeyboardEvent, 'code' | 'shiftKey' | 'metaKey' | 'ctrlKey' | 'altKey' | 'repeat'>,
): ToolShortcutId | null {
  if (event.metaKey || event.ctrlKey || event.altKey || event.repeat) return null
  const entry = Object.entries(CHORDS).find(
    ([, chord]) => chord.code === event.code && chord.shift === event.shiftKey,
  )
  if (!entry) return null
  if (event.shiftKey && SHIFT_GESTURE_SCOPES.has(useInteractionScope.getState().scope.kind))
    return null
  return entry[0] as ToolShortcutId
}

/** Whether WASD pan must leave this key to a tool shortcut (Shift+W/S/D). */
export function claimsKeyboardPan(
  event: Pick<KeyboardEvent, 'code' | 'shiftKey' | 'metaKey' | 'ctrlKey' | 'altKey' | 'repeat'>,
): boolean {
  // A held key repeats: once claimed, the repeats stay claimed too. (Fields one by
  // one: a DOM event's are getters a spread would drop.)
  return (
    event.shiftKey &&
    toolShortcutForKey({
      code: event.code,
      shiftKey: event.shiftKey,
      metaKey: event.metaKey,
      ctrlKey: event.ctrlKey,
      altKey: event.altKey,
      repeat: false,
    }) !== null
  )
}

/** Arm the tool `id` names from the keyboard, as its Build panel tile does, with the panel showing. */
export function armToolShortcut(id: ToolShortcutId): void {
  const editor = useEditor.getState()
  editor.setPhase('building')
  openSidebarPanel(['build'])
  // A raw tool, as a tile click arms it: no preset carried over from earlier.
  editor.setToolDefaults(id, null)
  editor.armToolMode({ mode: 'build', tool: id })
}
