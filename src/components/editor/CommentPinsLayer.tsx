import { useMemo, useState } from 'react'
import { Circle, Group, Label, Tag, Text } from 'react-konva'
import { colorForUser } from '../../features/collab/presence'
import {
  buildThreads,
  pinPosition,
  threadsOnLevel,
  type CommentThread,
} from '../../features/comments/commentsLogic'
import type { ProjectPerson } from '../../features/versions/versionsLogic'
import { fr } from '../../i18n/fr'
import { useCommentsStore } from '../../stores/commentsStore'
import { openThreadInPanel } from './focusThread'
import type { CanvasElement } from '../../types/document'

/** Nom de la forme Konva d'une épingle : l'outil « Commenter » ne pose pas de commentaire par-dessus. */
export const COMMENT_PIN_NAME = 'comment-pin'

interface CommentPinsLayerProps {
  /** Tous les éléments du document (un commentaire peut viser un élément d'un autre niveau). */
  elements: readonly CanvasElement[]
  activeLevelId: string | null
  /** Zoom de la vue : les épingles gardent la même taille à l'écran. */
  scale: number
  people: ReadonlyMap<string, ProjectPerson>
}

const PIN_RADIUS = 11
const TOOLTIP_MAX = 140

function shorten(text: string): string {
  const flat = text.replace(/\s+/g, ' ')
  return flat.length > TOOLTIP_MAX ? `${flat.slice(0, TOOLTIP_MAX - 1)}…` : flat
}

/**
 * Épingles numérotées des commentaires du niveau affiché (M16, lot B). À mettre dans une couche après
 * la première : les exports et la miniature masquent ces couches.
 */
export default function CommentPinsLayer({ elements, activeLevelId, scale, people }: CommentPinsLayerProps) {
  const comments = useCommentsStore((state) => state.comments)
  const selectedThreadId = useCommentsStore((state) => state.selectedThreadId)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const threads = useMemo(() => threadsOnLevel(buildThreads(comments), activeLevelId), [comments, activeLevelId])
  if (threads.length === 0) return null
  const u = 1 / scale

  return (
    <>
      {threads.map((thread) => (
        <Pin
          key={thread.root.id}
          thread={thread}
          elements={elements}
          u={u}
          people={people}
          hovered={hoveredId === thread.root.id}
          selected={selectedThreadId === thread.root.id}
          onHover={(hover) => setHoveredId(hover ? thread.root.id : null)}
        />
      ))}
    </>
  )
}

interface PinProps {
  thread: CommentThread
  elements: readonly CanvasElement[]
  u: number
  people: ReadonlyMap<string, ProjectPerson>
  hovered: boolean
  selected: boolean
  onHover: (hover: boolean) => void
}

function Pin({ thread, elements, u, people, hovered, selected, onHover }: PinProps) {
  const position = pinPosition(thread.root, elements)
  if (!position) return null
  const color = people.get(thread.root.authorId)?.color ?? colorForUser(thread.root.authorId)
  const faded = thread.resolved || position.orphaned
  const author = people.get(thread.root.authorId)?.name ?? fr.history.unknownAuthor

  return (
    <Group
      name={COMMENT_PIN_NAME}
      x={position.x}
      y={position.y}
      scaleX={u}
      scaleY={u}
      opacity={faded ? 0.5 : 1}
      onMouseEnter={(event) => {
        onHover(true)
        const container = event.target.getStage()?.container()
        if (container) container.style.cursor = 'pointer'
      }}
      onMouseLeave={(event) => {
        onHover(false)
        const container = event.target.getStage()?.container()
        if (container) container.style.cursor = ''
      }}
      onClick={() => openThreadInPanel(thread)}
      onTap={() => openThreadInPanel(thread)}
    >
      {selected && <Circle radius={PIN_RADIUS + 5} stroke={color} strokeWidth={2} listening={false} />}
      <Circle
        radius={PIN_RADIUS}
        fill={color}
        stroke="#ffffff"
        strokeWidth={2}
        dash={position.orphaned ? [4, 3] : undefined}
        shadowColor="#0f172a"
        shadowOpacity={0.3}
        shadowBlur={4}
      />
      <Text
        text={String(thread.number)}
        x={-PIN_RADIUS}
        y={-6}
        width={PIN_RADIUS * 2}
        align="center"
        fontSize={12}
        fontStyle="bold"
        fill="#ffffff"
        listening={false}
      />
      {hovered && (
        <Label x={PIN_RADIUS + 4} y={-PIN_RADIUS} listening={false}>
          <Tag fill="#1e293b" cornerRadius={4} opacity={0.95} />
          <Text
            text={fr.comments.tooltip(
              author,
              shorten(thread.root.body),
              thread.replies.length,
              thread.resolved,
              position.orphaned,
            )}
            width={220}
            padding={6}
            fontSize={12}
            lineHeight={1.3}
            fill="#f8fafc"
          />
        </Label>
      )}
    </Group>
  )
}
