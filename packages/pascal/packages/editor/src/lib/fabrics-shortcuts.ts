/**
 * Fabrics keyboard shortcuts (FABRICS_CHANGES.md, decision D82): one letter for
 * the common tools (the former Fabrics keys) and Revit's two-letter codes on top,
 * so a beginner presses `W` and a Revit user types `W` `A`; both arm the wall.
 *
 * Letters are read from `KeyboardEvent.key`, lowercased: what the key prints on
 * the user's layout (AZERTY included), as Revit and the former Fabrics did.
 *
 * Sequences: a letter that starts a code waits a moment before its own action
 * (`SINGLE_DELAY_MS`), so `D` `R` arms the door without arming the dimension
 * first. `R`, `C` and `S` keep their immediate Pascal behaviour (rotate, cycle
 * the drawing mode, nothing) and only open the code window.
 */

export type ShortcutCommand =
  | 'select'
  | 'wall'
  | 'room'
  | 'door'
  | 'window'
  | 'dimension'
  | 'grid'
  | 'item'
  | 'stair'
  | 'roof'
  | 'slab'
  | 'paint'
  | 'measure'
  | 'terrain'
  | 'delete-mode'
  | 'copy'
  | 'rotate'
  | 'delete-selection'
  | 'fit'

/** One key, one tool. */
export const SINGLE_KEY_COMMANDS: Readonly<Record<string, ShortcutCommand>> = {
  v: 'select',
  w: 'wall',
  p: 'room',
  z: 'room',
  b: 'door',
  f: 'window',
  d: 'dimension',
  a: 'grid',
  o: 'item',
  m: 'measure',
  g: 'terrain',
  x: 'delete-mode',
}

/** Revit's codes (ST, RF and SB added for the tools Revit leaves without one). */
export const REVIT_CODE_COMMANDS: Readonly<Record<string, ShortcutCommand>> = {
  wa: 'wall',
  rm: 'room',
  dr: 'door',
  wn: 'window',
  di: 'dimension',
  gr: 'grid',
  cm: 'item',
  st: 'stair',
  rf: 'roof',
  sb: 'slab',
  pt: 'paint',
  co: 'copy',
  ro: 'rotate',
  de: 'delete-selection',
  zf: 'fit',
}

/** Time a code-starting letter waits for its second letter before acting alone. */
export const SINGLE_DELAY_MS = 400
/** Time a second letter has after `R`, `C` or `S`, which act at once. */
export const CODE_WINDOW_MS = 800

const PREFIXES = new Set(Object.keys(REVIT_CODE_COMMANDS).map((code) => code[0]!))

/** Whether `key` starts a Revit code. */
export function isCodePrefix(key: string): boolean {
  return PREFIXES.has(key)
}

/** A letter waiting for its second letter. */
export type PendingPrefix = {
  key: string
  at: number
  /** Its own command, run when no second letter comes (null: the key acted already). */
  deferred: ShortcutCommand | null
}

export type KeyDecision =
  /** A full Revit code. */
  | { kind: 'code'; command: ShortcutCommand }
  /** The letter waits; run `deferred` after `SINGLE_DELAY_MS` unless another key comes. */
  | { kind: 'defer' }
  /** The letter's own tool, at once. */
  | { kind: 'single'; command: ShortcutCommand }
  /** Not ours: Pascal's handler takes the key. */
  | { kind: 'pass' }

export type KeyStep = {
  decision: KeyDecision
  /** The earlier letter's command, to run first (it waited and no code came). */
  flush: ShortcutCommand | null
  next: PendingPrefix | null
}

/**
 * The next step for a bare letter `key` (lowercase, no modifier) at `now` (ms),
 * given the letter still waiting. Pure: the caller runs the commands and the timer.
 */
export function decideLetter(pending: PendingPrefix | null, key: string, now: number): KeyStep {
  const live =
    pending &&
    now - pending.at <= (pending.deferred ? SINGLE_DELAY_MS : CODE_WINDOW_MS) &&
    pending.at <= now
      ? pending
      : null
  const code = live ? REVIT_CODE_COMMANDS[live.key + key] : undefined
  if (code) return { decision: { kind: 'code', command: code }, flush: null, next: null }

  // The waiting letter gets no code: its own tool runs now, before this key.
  const flush = live?.deferred ?? null
  const single = SINGLE_KEY_COMMANDS[key]

  if (isCodePrefix(key)) {
    if (single) {
      return { decision: { kind: 'defer' }, flush, next: { key, at: now, deferred: single } }
    }
    return { decision: { kind: 'pass' }, flush, next: { key, at: now, deferred: null } }
  }
  if (single) return { decision: { kind: 'single', command: single }, flush, next: null }
  return { decision: { kind: 'pass' }, flush, next: null }
}

/** The keys a tool's tooltip prints, `W · WA`, or null when the command has none. */
export function commandShortcutLabel(command: ShortcutCommand): string | null {
  const singles = Object.entries(SINGLE_KEY_COMMANDS)
    .filter(([, value]) => value === command)
    .map(([key]) => key.toUpperCase())
  const codes = Object.entries(REVIT_CODE_COMMANDS)
    .filter(([, value]) => value === command)
    .map(([key]) => key.toUpperCase())
  const keys = [...singles.slice(0, 1), ...codes]
  return keys.length > 0 ? keys.join(' · ') : null
}
