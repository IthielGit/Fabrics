'use client'

import {
  type AnyNode,
  createI18n,
  formatNumber,
  type DeleteZonePayload,
  type MessageDescriptor,
  type PascalI18n,
  type StructureNodes,
  usePascalI18n,
  useScene,
} from '@pascal-app/core'
import { displayRoomName } from '@pascal-app/viewer/ui'
import { useEffect, useMemo, useRef } from 'react'
import { cn } from '../../lib/utils'
import useDeleteConfirmation, {
  type DeleteConfirmationRequest,
  type RoomConstructionChange,
} from '../../store/use-delete-confirmation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/primitives/dialog'

/** Translates a descriptor: the editor's `PascalI18n`, or English by default (tests, agents). */
type Translator = Pick<PascalI18n, '_' | 'getLocale'>

let englishI18n: PascalI18n | undefined
const english = (): Translator => (englishI18n ??= createI18n({ locale: 'en' }))

/** "2 walls", "1 door": a count with its kind, in the UI language. */
const COUNT_MESSAGES: Record<string, MessageDescriptor> = {
  wall: /* i18n */ {
    id: 'editor.deleteConfirmationDialog.countWall',
    message: '{count, plural, one {# wall} other {# walls}}',
  },
  separator: /* i18n */ {
    id: 'editor.deleteConfirmationDialog.countSeparator',
    message: '{count, plural, one {# separator} other {# separators}}',
  },
  door: /* i18n */ {
    id: 'editor.deleteConfirmationDialog.countDoor',
    message: '{count, plural, one {# door} other {# doors}}',
  },
  window: /* i18n */ {
    id: 'editor.deleteConfirmationDialog.countWindow',
    message: '{count, plural, one {# window} other {# windows}}',
  },
  light: /* i18n */ {
    id: 'editor.deleteConfirmationDialog.countLight',
    message: '{count, plural, one {# light} other {# lights}}',
  },
  item: /* i18n */ {
    id: 'editor.deleteConfirmationDialog.countItem',
    message: '{count, plural, one {# item} other {# items}}',
  },
}

function count(n: number, kind: keyof typeof COUNT_MESSAGES, i18n: Translator) {
  return i18n._({ ...COUNT_MESSAGES[kind]!, values: { count: n } })
}

function sentenceList(parts: string[], i18n: Translator) {
  if (parts.length <= 1) return parts.join('')
  return i18n._({
    id: 'editor.deleteConfirmationDialog.listAnd',
    message: '{head} and {last}',
    values: { head: parts.slice(0, -1).join(', '), last: parts.at(-1) },
  })
}

/** " (Front door, Back door)" after a count, or nothing. */
const inParentheses = (names: string) => (names ? ` (${names})` : '')

/**
 * A mezzanine takes its own plate (with its railing) and the ceiling core
 * derived over it; kept items come down to the floor below.
 */
function mezzanineDeletionDescription(
  room: DeleteZonePayload,
  nodes: StructureNodes,
  i18n: Translator,
) {
  const hasCeiling = Object.values(nodes).some(
    (node) => node.type === 'ceiling' && node.zoneId === room.zoneId,
  )
  const sentences = [
    hasCeiling
      ? i18n._({
          id: 'editor.deleteConfirmationDialog.mezzanineWithCeiling',
          message: 'Removes the mezzanine floor, its railing and the ceiling over it.',
        })
      : i18n._({
          id: 'editor.deleteConfirmationDialog.mezzanine',
          message: 'Removes the mezzanine floor and its railing.',
        }),
  ]
  const items = room.itemIds.length
  if (items)
    sentences.push(
      i18n._({
        id: 'editor.deleteConfirmationDialog.mezzanineItems',
        message:
          '{count, plural, one {# item is on it. Keep it on the floor below, or delete it too.} other {# items are on it. Keep them on the floor below, or delete them too.}}',
        values: { count: items },
      }),
    )
  return sentences.join(' ')
}

/**
 * An area Divide made goes back into the room across its dividing line: the
 * line and the area's own finish go, the walls and anything standing in it stay.
 */
function mergeDescription(room: DeleteZonePayload, nodes: StructureNodes, i18n: Translator) {
  const into = nodes[room.mergedIntoZoneId ?? '']?.name?.trim()
  const lines = room.separatorIds.length === 1 ? 1 : 2
  const sentences = [
    into
      ? i18n._({
          id: 'editor.deleteConfirmationDialog.mergeInto',
          message:
            'Merges it back into {room}: removes the {lines, plural, one {dividing line} other {dividing lines}} and its floor finish. The walls stay.',
          values: { room: displayRoomName(into, i18n), lines },
        })
      : i18n._({
          id: 'editor.deleteConfirmationDialog.mergeIntoNext',
          message:
            'Merges it back into the room next to it: removes the {lines, plural, one {dividing line} other {dividing lines}} and its floor finish. The walls stay.',
          values: { lines },
        }),
  ]
  const items = room.itemIds.length
  if (items)
    sentences.push(
      i18n._({
        id: 'editor.deleteConfirmationDialog.mergeItems',
        message:
          '{count, plural, one {# item inside stays where it is.} other {# items inside stay where they are.}}',
        values: { count: items },
      }),
    )
  return sentences.join(' ')
}

function roomDeletionDescription(room: DeleteZonePayload, nodes: StructureNodes, i18n: Translator) {
  if (isMezzanine(room, nodes)) return mezzanineDeletionDescription(room, nodes, i18n)
  if (room.mode === 'merge') return mergeDescription(room, nodes, i18n)
  const sentences: string[] = []
  const typeCount = (type: string) =>
    room.openingIds.filter((id) => nodes[id]?.type === type).length
  const removed = [
    room.wallIds.length ? count(room.wallIds.length, 'wall', i18n) : '',
    room.separatorIds.length ? count(room.separatorIds.length, 'separator', i18n) : '',
    typeCount('door') ? count(typeCount('door'), 'door', i18n) : '',
    typeCount('window') ? count(typeCount('window'), 'window', i18n) : '',
  ].filter(Boolean)
  sentences.push(
    removed.length
      ? i18n._({
          id: 'editor.deleteConfirmationDialog.removesWithFinish',
          message: 'Removes {list}, with the floor finish and ceiling.',
          values: { list: sentenceList(removed, i18n) },
        })
      : i18n._({
          id: 'editor.deleteConfirmationDialog.removesFinish',
          message: 'Removes the floor finish and ceiling.',
        }),
  )
  if (room.keptSharedWallIds.length + room.keptSharedSeparatorIds.length > 0)
    sentences.push(
      i18n._({
        id: 'editor.deleteConfirmationDialog.sharedWallsStay',
        message: 'Walls shared with other rooms stay.',
      }),
    )
  if (room.opensZoneIds.length) {
    const names = room.opensZoneIds.map((id) => {
      const name = nodes[id]?.name?.trim()
      return name
        ? displayRoomName(name, i18n)
        : i18n._({ id: 'editor.deleteConfirmationDialog.theNextRoom', message: 'the next room' })
    })
    sentences.push(
      i18n._({
        id: 'editor.deleteConfirmationDialog.opensInto',
        message: 'Opens into {list}.',
        values: { list: sentenceList(names, i18n) },
      }),
    )
  }
  const items = room.itemIds.length
  if (items)
    sentences.push(
      i18n._({
        id: 'editor.deleteConfirmationDialog.roomItems',
        message:
          '{count, plural, one {# item is inside. Keep it where it is, or delete it too.} other {# items are inside. Keep them where they are, or delete them too.}}',
        values: { count: items },
      }),
    )
  return sentences.join(' ')
}

/** A hosted node's kind from its type and structure — never from its name. */
function hostedKind(node: AnyNode | undefined) {
  if (node?.type === 'door' || node?.type === 'window') return node.type
  if (node?.type === 'item' && node.asset.interactive?.effects.some((e) => e.kind === 'light'))
    return 'light'
  return 'item'
}

function hostedName(node: AnyNode | undefined, i18n: Translator) {
  const name = (node?.name || (node?.type === 'item' ? node.asset.name : '') || '').trim()
  return name ? displayRoomName(name, i18n) : ''
}

function shownNames(names: string[]) {
  const named = [...new Set(names.filter(Boolean))]
  return named.slice(0, 3).join(', ') + (named.length > 3 ? ', …' : '')
}

/** "1 door (Front door), 2 windows and 1 light": counts per kind, a few names, no ids. */
export function hostedSummary(
  ids: readonly string[],
  nodes: StructureNodes,
  i18n: Translator = english(),
) {
  const groups = new Map<ReturnType<typeof hostedKind>, string[]>()
  for (const id of ids) {
    const kind = hostedKind(nodes[id])
    groups.set(kind, [...(groups.get(kind) ?? []), hostedName(nodes[id], i18n)])
  }
  return sentenceList(
    [...groups].map(
      ([kind, names]) => `${count(names.length, kind, i18n)}${inParentheses(shownNames(names))}`,
    ),
    i18n,
  )
}

function ceilingContent(
  change: RoomConstructionChange,
  nodes: StructureNodes,
  room: string,
  canKeep: boolean,
  i18n: Translator,
): DeleteConfirmationContent {
  const ids = change.hostedIds
  const manual = change.manualCeilings ?? []
  const sentences: string[] = []
  if (manual.length) {
    sentences.push(
      i18n._({
        id: 'editor.deleteConfirmationDialog.manualCeilings',
        message:
          '{count, plural, one {Removes the hand-drawn ceiling{names}.} other {Removes # hand-drawn ceilings{names}.}}',
        values: { count: manual.length, names: inParentheses(shownNames(manual)) },
      }),
    )
    if (change.alsoCovers?.length)
      sentences.push(
        i18n._({
          id: 'editor.deleteConfirmationDialog.alsoCovers',
          message: '{count, plural, one {It also covers {list}.} other {They also cover {list}.}}',
          values: {
            count: manual.length,
            list: sentenceList(
              change.alsoCovers.map((name) => displayRoomName(name, i18n)),
              i18n,
            ),
          },
        }),
      )
  }
  // Lights are known from their light effect; anything else reads as an item.
  const lights = ids.length > 0 && ids.every((id) => hostedKind(nodes[id]) === 'light')
  if (ids.length) {
    const names = shownNames(ids.map((id) => hostedName(nodes[id], i18n)))
    sentences.push(
      lights
        ? i18n._({
            id: 'editor.deleteConfirmationDialog.lightsHang',
            message:
              '{count, plural, one {{summary} hangs from it.} other {{summary} hang from it.}}',
            values: { count: ids.length, summary: hostedSummary(ids, nodes, i18n) },
          })
        : i18n._({
            id: 'editor.deleteConfirmationDialog.itemsOnCeiling',
            message:
              '{count, plural, one {# item is on the ceiling{names}.} other {# items are on the ceiling{names}.}}',
            values: { count: ids.length, names: inParentheses(names) },
          }),
      i18n._({
        id: 'editor.deleteConfirmationDialog.keepInPlace',
        message:
          '{count, plural, one {Keep it in place, or delete it too.} other {Keep them in place, or delete them too.}}',
        values: { count: ids.length },
      }),
    )
  }
  return {
    title: i18n._({
      id: 'editor.deleteConfirmationDialog.removeCeilingTitle',
      message: 'Remove the ceiling from {room}?',
      values: { room },
    }),
    description: sentences.length
      ? sentences.join(' ')
      : i18n._({
          id: 'editor.deleteConfirmationDialog.removesCeiling',
          message: 'Removes the ceiling.',
        }),
    keepLabel:
      ids.length && canKeep
        ? lights
          ? i18n._({ id: 'editor.deleteConfirmationDialog.keepLights', message: 'Keep lights' })
          : i18n._({ id: 'editor.deleteConfirmationDialog.keepItems', message: 'Keep items' })
        : null,
    confirmLabel: ids.length
      ? i18n._({ id: 'editor.deleteConfirmationDialog.removeAll', message: 'Remove all' })
      : i18n._({ id: 'editor.deleteConfirmationDialog.remove', message: 'Remove' }),
    destructive: true,
  }
}

function constructionContent(
  change: RoomConstructionChange,
  nodes: StructureNodes,
  canKeep: boolean,
  i18n: Translator,
): DeleteConfirmationContent {
  const name = change.roomName.trim()
  const room = name
    ? displayRoomName(name, i18n)
    : i18n._({ id: 'editor.deleteConfirmationDialog.thisRoom', message: 'this room' })
  const hosted = hostedSummary(change.hostedIds, nodes, i18n)
  if (change.part === 'walls' && change.action === 'add') {
    return {
      title: i18n._({
        id: 'editor.deleteConfirmationDialog.addWallsTitle',
        message: 'Add walls to {room}?',
        values: { room },
      }),
      description: i18n._({
        id: 'editor.deleteConfirmationDialog.addWallsDescription',
        message:
          'Adds {count, plural, one {# wall} other {# walls}} · the room loses {area} m² of floor.',
        values: { count: change.wallCount ?? 0, area: formatNumber(change.areaLoss ?? 0, { min: 2, max: 2, locale: i18n.getLocale() }) },
      }),
      keepLabel: null,
      confirmLabel: i18n._({
        id: 'editor.deleteConfirmationDialog.addWalls',
        message: 'Add walls',
      }),
      destructive: false,
    }
  }
  if (change.part === 'walls') {
    const walls = count(change.wallCount ?? 0, 'wall', i18n)
    return {
      title: i18n._({
        id: 'editor.deleteConfirmationDialog.removeWallsTitle',
        message: 'Remove walls from {room}?',
        values: { room },
      }),
      description: [
        hosted
          ? i18n._({
              id: 'editor.deleteConfirmationDialog.turnsIntoSeparatorsAndRemoves',
              message: 'Turns {walls} into separators and removes {hosted}.',
              values: { walls, hosted },
            })
          : i18n._({
              id: 'editor.deleteConfirmationDialog.turnsIntoSeparators',
              message: 'Turns {walls} into separators.',
              values: { walls },
            }),
        change.sharedWalls
          ? i18n._({
              id: 'editor.deleteConfirmationDialog.sharedWallsRemain',
              message: 'Shared walls remain.',
            })
          : '',
      ]
        .filter(Boolean)
        .join(' '),
      keepLabel: null,
      confirmLabel: i18n._({
        id: 'editor.deleteConfirmationDialog.removeWalls',
        message: 'Remove walls',
      }),
      destructive: true,
    }
  }
  if (change.part === 'floor') {
    return {
      title: i18n._({
        id: 'editor.deleteConfirmationDialog.removeFloorTitle',
        message: 'Remove the floor from {room}?',
        values: { room },
      }),
      description: hosted
        ? i18n._({
            id: 'editor.deleteConfirmationDialog.itemsStandOnFloor',
            message:
              '{count, plural, one {{hosted} stands on it. Keep it at its height, or delete it too.} other {{hosted} stand on it. Keep them at their height, or delete them too.}}',
            values: { count: change.hostedIds.length, hosted },
          })
        : i18n._({
            id: 'editor.deleteConfirmationDialog.removesFloor',
            message: 'Removes the floor.',
          }),
      keepLabel:
        hosted && canKeep
          ? i18n._({ id: 'editor.deleteConfirmationDialog.keepItems', message: 'Keep items' })
          : null,
      confirmLabel: hosted
        ? i18n._({ id: 'editor.deleteConfirmationDialog.deleteItems', message: 'Delete items' })
        : i18n._({ id: 'editor.deleteConfirmationDialog.remove', message: 'Remove' }),
      destructive: true,
    }
  }
  return ceilingContent(change, nodes, room, canKeep, i18n)
}

export type DeleteConfirmationContent = {
  title: string
  description: string
  /** Delete the room but leave its items in place — offered only when it has items. */
  keepLabel: string | null
  confirmLabel: string
  /** Red confirm for removals; adding walls confirms in the neutral style. */
  destructive: boolean
}

/** The words and choices the confirmation offers, from the request alone. */
function isMezzanine(room: DeleteZonePayload, nodes: StructureNodes) {
  const zone = nodes[room.zoneId]
  return zone?.type === 'zone' && zone.floor?.support === 'open'
}

export function deleteConfirmationContent(
  request: DeleteConfirmationRequest,
  nodes: StructureNodes,
  i18n: Translator = english(),
): DeleteConfirmationContent {
  if (request.construction)
    return constructionContent(request.construction, nodes, !!request.onKeepContents, i18n)
  const room = request.room
  if (!room)
    return {
      title: i18n._({
        id: 'editor.deleteConfirmationDialog.deleteElementsTitle',
        message: '{count, plural, one {Delete # element?} other {Delete # elements?}}',
        values: { count: request.count },
      }),
      description: i18n._({
        id: 'editor.deleteConfirmationDialog.deleteElementsDescription',
        message:
          'This removes every selected element. You can undo the deletion while it remains in the editor history.',
      }),
      keepLabel: null,
      confirmLabel: i18n._({ id: 'editor.deleteConfirmationDialog.delete', message: 'Delete' }),
      destructive: true,
    }
  const merge = room.mode === 'merge'
  // A merged area's items always stay, so there is nothing to choose.
  const hasItems = room.itemIds.length > 0 && !merge
  const name = room.name.trim()
  const target = name
    ? displayRoomName(name, i18n)
    : isMezzanine(room, nodes)
      ? i18n._({ id: 'editor.deleteConfirmationDialog.thisMezzanine', message: 'this mezzanine' })
      : merge
        ? i18n._({ id: 'editor.deleteConfirmationDialog.thisArea', message: 'this area' })
        : i18n._({ id: 'editor.deleteConfirmationDialog.thisRoom', message: 'this room' })
  return {
    title: i18n._({
      id: 'editor.deleteConfirmationDialog.deleteRoomTitle',
      message: 'Delete {name}?',
      values: { name: target },
    }),
    description: roomDeletionDescription(room, nodes, i18n),
    keepLabel:
      hasItems && request.onKeepContents
        ? i18n._({ id: 'editor.deleteConfirmationDialog.keepItems', message: 'Keep items' })
        : null,
    confirmLabel: hasItems
      ? i18n._({ id: 'editor.deleteConfirmationDialog.deleteAll', message: 'Delete all' })
      : i18n._({ id: 'editor.deleteConfirmationDialog.delete', message: 'Delete' }),
    destructive: true,
  }
}

export function DeleteConfirmationDialog() {
  const i18n = usePascalI18n()
  const request = useDeleteConfirmation((state) => state.request)
  const cancel = useDeleteConfirmation((state) => state.cancel)
  const confirm = useDeleteConfirmation((state) => state.confirm)
  const nodes = useScene((state) => (request ? state.nodes : null))
  const live = useMemo(
    () => (request && nodes ? deleteConfirmationContent(request, nodes, i18n) : null),
    [request, nodes, i18n],
  )
  // Hold the last words through the close animation so the dialog never empties.
  const shown = useRef(live)
  if (live) shown.current = live
  const content = shown.current
  const blocked = !!request?.conflict

  useEffect(() => cancel, [cancel])

  return (
    <Dialog onOpenChange={(open) => !open && cancel()} open={request !== null}>
      <DialogContent
        className="border-border/70 bg-background/95 shadow-2xl backdrop-blur-xl sm:max-w-md"
        data-delete-confirmation-dialog
        showCloseButton={false}
      >
        <DialogHeader>
          <DialogTitle>{content?.title}</DialogTitle>
          <DialogDescription>
            {content?.description}
            {request?.conflict && (
              <span className="mt-2 block text-destructive">{request.conflict}</span>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <button
            className="rounded-full border border-border px-4 py-2 text-sm transition-colors hover:bg-accent"
            onClick={cancel}
            type="button"
          >
            {i18n._({ id: 'editor.deleteConfirmationDialog.cancel', message: 'Cancel' })}
          </button>
          {content?.keepLabel && (
            <button
              className="rounded-full border border-border px-4 py-2 text-sm transition-colors hover:bg-accent disabled:pointer-events-none disabled:opacity-50"
              disabled={blocked}
              onClick={() => {
                const keep = request?.onKeepContents
                cancel()
                keep?.()
              }}
              type="button"
            >
              {content.keepLabel}
            </button>
          )}
          <button
            className={cn(
              'rounded-full px-4 py-2 text-sm transition-colors disabled:pointer-events-none disabled:opacity-50',
              content?.destructive === false
                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                : 'bg-red-600 text-white hover:bg-red-700',
            )}
            disabled={blocked}
            onClick={confirm}
            type="button"
          >
            {content?.confirmLabel}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
