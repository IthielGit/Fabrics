/** Écart toléré (mm) entre deux points pour dire qu'ils se touchent. */
const TOUCH_TOLERANCE = 5

type Pt = { x: number; y: number }
/** Ce qu'il faut d'un mur pour savoir à qui il est lié (un `WallElement` convient). */
interface LinkableWall {
  id: string
  points: readonly number[]
  thickness: number
  levelId?: string | undefined
  hidden?: boolean | undefined
}

function vertices(wall: LinkableWall): Pt[] {
  const out: Pt[] = []
  for (let i = 0; i + 1 < wall.points.length; i += 2) out.push({ x: wall.points[i], y: wall.points[i + 1] })
  return out
}

function distanceToSegment(p: Pt, a: Pt, b: Pt): number {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const lengthSq = dx * dx + dy * dy
  const t = lengthSq === 0 ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lengthSq))
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy))
}

/** Un sommet de `from` touche l'axe de `to` (bout à bout ou en T, à la demi-épaisseur près). */
function touches(from: LinkableWall, to: LinkableWall): boolean {
  const target = vertices(to)
  const reach = to.thickness / 2 + TOUCH_TOLERANCE
  return vertices(from).some((p) =>
    target.length === 1
      ? Math.hypot(p.x - target[0].x, p.y - target[0].y) <= TOUCH_TOLERANCE
      : target.some((_, i) => i > 0 && distanceToSegment(p, target[i - 1], target[i]) <= reach),
  )
}

/** Deux murs sont liés si l'un touche l'autre par un sommet (angle, prolongement ou T). */
export function wallsAreLinked(a: LinkableWall, b: LinkableWall): boolean {
  return touches(a, b) || touches(b, a)
}

/**
 * Identifiants du mur et de tous les murs liés à lui, de proche en proche, sur le même niveau
 * (cloisons en T comprises). Les murs masqués sont ignorés. Le mur de départ est toujours rendu.
 */
export function connectedWallIds(walls: readonly LinkableWall[], startId: string): string[] {
  const start = walls.find((w) => w.id === startId)
  if (!start) return []
  const candidates = walls.filter((w) => w.levelId === start.levelId && !w.hidden)
  const found = new Set<string>([start.id])
  const queue: LinkableWall[] = [start]
  while (queue.length > 0) {
    const current = queue.shift() as LinkableWall
    for (const other of candidates) {
      if (found.has(other.id) || !wallsAreLinked(current, other)) continue
      found.add(other.id)
      queue.push(other)
    }
  }
  return [...found]
}
