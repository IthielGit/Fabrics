import { describe, expect, test } from 'bun:test'
import {
  CODE_WINDOW_MS,
  commandShortcutLabel,
  decideLetter,
  isCodePrefix,
  REVIT_CODE_COMMANDS,
  SINGLE_DELAY_MS,
  SINGLE_KEY_COMMANDS,
} from './fabrics-shortcuts'

describe('Fabrics shortcuts (D82)', () => {
  test('the former Fabrics letters arm their tools', () => {
    expect(SINGLE_KEY_COMMANDS.v).toBe('select')
    expect(SINGLE_KEY_COMMANDS.w).toBe('wall')
    expect(SINGLE_KEY_COMMANDS.p).toBe('room')
    expect(SINGLE_KEY_COMMANDS.b).toBe('door')
    expect(SINGLE_KEY_COMMANDS.f).toBe('window')
    expect(SINGLE_KEY_COMMANDS.d).toBe('dimension')
    expect(SINGLE_KEY_COMMANDS.a).toBe('grid')
  })

  test("Revit's codes arm the same tools", () => {
    expect(REVIT_CODE_COMMANDS.wa).toBe('wall')
    expect(REVIT_CODE_COMMANDS.rm).toBe('room')
    expect(REVIT_CODE_COMMANDS.dr).toBe('door')
    expect(REVIT_CODE_COMMANDS.wn).toBe('window')
    expect(REVIT_CODE_COMMANDS.di).toBe('dimension')
    expect(REVIT_CODE_COMMANDS.gr).toBe('grid')
  })

  test('a letter that starts no code acts at once', () => {
    const step = decideLetter(null, 'b', 0)
    expect(step.decision).toEqual({ kind: 'single', command: 'door' })
    expect(step.next).toBeNull()
  })

  test('W waits; W then A within the delay is the wall code', () => {
    const first = decideLetter(null, 'w', 1000)
    expect(first.decision.kind).toBe('defer')
    expect(first.next).toEqual({ key: 'w', at: 1000, deferred: 'wall' })
    const second = decideLetter(first.next, 'a', 1200)
    expect(second.decision).toEqual({ kind: 'code', command: 'wall' })
    expect(second.flush).toBeNull()
    expect(second.next).toBeNull()
  })

  test('D then R is the door, never the dimension first', () => {
    const first = decideLetter(null, 'd', 0)
    const second = decideLetter(first.next, 'r', 150)
    expect(second.decision).toEqual({ kind: 'code', command: 'door' })
    expect(second.flush).toBeNull()
  })

  test('a waiting letter followed by a non-matching letter runs first, then the new one', () => {
    const first = decideLetter(null, 'w', 0)
    const second = decideLetter(first.next, 'b', 100)
    expect(second.flush).toBe('wall')
    expect(second.decision).toEqual({ kind: 'single', command: 'door' })
  })

  test('too late for a code: the second letter is read alone', () => {
    const first = decideLetter(null, 'd', 0)
    const late = decideLetter(first.next, 'a', SINGLE_DELAY_MS + 1)
    expect(late.decision).toEqual({ kind: 'single', command: 'grid' })
    // The timer already ran the dimension: nothing to flush.
    expect(late.flush).toBeNull()
  })

  test('R, C and S act in Pascal at once and keep the code window open', () => {
    const r = decideLetter(null, 'r', 0)
    expect(r.decision.kind).toBe('pass')
    expect(r.next).toEqual({ key: 'r', at: 0, deferred: null })
    expect(decideLetter(r.next, 'm', CODE_WINDOW_MS).decision).toEqual({
      kind: 'code',
      command: 'room',
    })
    expect(decideLetter(r.next, 'm', CODE_WINDOW_MS + 1).decision).toEqual({
      kind: 'single',
      command: 'measure',
    })
    const s = decideLetter(null, 's', 0)
    expect(decideLetter(s.next, 't', 100).decision).toEqual({ kind: 'code', command: 'stair' })
  })

  test('letters that are neither ours nor a prefix pass to Pascal (E, T)', () => {
    expect(decideLetter(null, 'e', 0)).toEqual({
      decision: { kind: 'pass' },
      flush: null,
      next: null,
    })
    expect(decideLetter(null, 't', 0).decision.kind).toBe('pass')
  })

  test('every code starts with a known prefix, and no code is a single letter', () => {
    for (const code of Object.keys(REVIT_CODE_COMMANDS)) {
      expect(code).toHaveLength(2)
      expect(isCodePrefix(code[0]!)).toBe(true)
    }
  })

  test('labels print the letter and the code', () => {
    expect(commandShortcutLabel('wall')).toBe('W · WA')
    expect(commandShortcutLabel('room')).toBe('P · RM')
    expect(commandShortcutLabel('fit')).toBe('ZF')
  })
})
