import { useMemo } from 'react'
import { Group, Label, Line, Rect, Tag, Text } from 'react-konva'
import { elementBounds } from '../../features/export/bounds'
import type { Peer } from '../../features/collab/presence'
import { useAuthStore } from '../../stores/authStore'
import { useCollabStore } from '../../stores/collabStore'
import type { CanvasElement } from '../../types/document'

interface PresenceLayerProps {
  /** Éléments du niveau affiché (seuls ceux-là peuvent être entourés). */
  elements: readonly CanvasElement[]
  activeLevelId: string | null
  /** Zoom de la vue : les traits et textes gardent la même taille à l'écran. */
  scale: number
}

/**
 * Curseurs et sélections des autres personnes (M14, lot E). À mettre dans une couche non
 * cliquable, après la première : les exports et la miniature masquent ces couches.
 */
export default function PresenceLayer({ elements, activeLevelId, scale }: PresenceLayerProps) {
  const peers = useCollabStore((state) => state.peers)
  const selfId = useAuthStore((state) => state.user?.id ?? null)
  const byId = useMemo(() => new Map(elements.map((element) => [element.id, element])), [elements])

  const visible = peers.filter((peer) => peer.user.id !== selfId && (peer.levelId ?? null) === activeLevelId)
  if (visible.length === 0) return null
  return (
    <>
      {visible.map((peer) => (
        <PeerMarks key={peer.clientId} peer={peer} byId={byId} scale={scale} />
      ))}
    </>
  )
}

function PeerMarks({ peer, byId, scale }: { peer: Peer; byId: Map<string, CanvasElement>; scale: number }) {
  const color = peer.user.color
  const boxes = peer.selection.flatMap((id) => {
    const element = byId.get(id)
    const box = element ? elementBounds(element) : null
    return box ? [box] : []
  })
  const u = 1 / scale
  return (
    <>
      {boxes.map((box, index) => (
        <Rect
          key={index}
          x={box.x - 3 * u}
          y={box.y - 3 * u}
          width={box.width + 6 * u}
          height={box.height + 6 * u}
          stroke={color}
          strokeWidth={2 * u}
          dash={[6 * u, 3 * u]}
        />
      ))}
      {peer.cursor && (
        <Group x={peer.cursor.x} y={peer.cursor.y} scaleX={u} scaleY={u}>
          <Line points={[0, 0, 0, 16, 4, 12, 7, 19, 10, 18, 7, 11, 12, 11]} closed fill={color} stroke="#ffffff" strokeWidth={1} lineJoin="round" />
          <Label x={12} y={18}>
            <Tag fill={color} cornerRadius={4} />
            <Text text={peer.user.name} fontSize={12} padding={4} fill="#ffffff" />
          </Label>
        </Group>
      )}
    </>
  )
}
