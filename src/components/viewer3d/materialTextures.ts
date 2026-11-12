import * as THREE from 'three'
import type { RoofCovering, WallMaterial } from '../../types/document'
import { roofColor3d, wallColor3d } from '../../features/building/materials'

/**
 * Textures 3D des matériaux (M10 bis lot C, demande de l'utilisateur) : des motifs dessinés pour
 * Fabrics, à la volée sur un canevas (aucune image tierce). Une texture couvre `TILE_MM` de côté et
 * se répète ; les coordonnées de texture sont calculées sur la géométrie, dans le plan de chaque
 * face (voir `applyPlanarUv`), donc un mur garde ses rangs de briques horizontaux et continus.
 */
const SIZE = 256

/** Côté (mm) du carré couvert par une texture, par matériau ou couverture. */
const TILE_MM: Record<WallMaterial | RoofCovering, number> = {
  concrete: 1200,
  masonry: 800,
  brick: 520,
  wood: 600,
  insulation: 500,
  plasterboard: 1200,
  tiles: 400,
  slates: 400,
  zinc: 600,
  steel: 400,
  flat: 500,
}

/**
 * Coordonnées de texture dans le plan de chaque sommet, en mètres : `u` suit l'horizontale de la
 * face, `v` sa pente (la verticale pour un mur, la ligne de pente pour un versant). Un dessus ou un
 * dessous (normale verticale) prend `x` et `z`. Géométrie avec normales.
 */
export function applyPlanarUv(geometry: THREE.BufferGeometry): void {
  const position = geometry.getAttribute('position')
  const normal = geometry.getAttribute('normal')
  if (!position || !normal) return
  const uv = new Float32Array(position.count * 2)
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i)
    const y = position.getY(i)
    const z = position.getZ(i)
    const nx = normal.getX(i)
    const ny = normal.getY(i)
    const nz = normal.getZ(i)
    const horizontal = Math.hypot(nx, nz)
    if (horizontal < 0.3) {
      uv[i * 2] = x / 1000
      uv[i * 2 + 1] = z / 1000
      continue
    }
    // Tangente horizontale de la face, puis ligne de plus grande pente.
    const tx = nz / horizontal
    const tz = -nx / horizontal
    const bx = -nx * ny
    const by = nx * nx + nz * nz
    const bz = -ny * nz
    const blen = Math.hypot(bx, by, bz) || 1
    uv[i * 2] = (x * tx + z * tz) / 1000
    uv[i * 2 + 1] = (x * bx + y * by + z * bz) / blen / 1000
  }
  geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2))
}

/** Hasard reproductible : la même texture à chaque ouverture du projet. */
function random(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Éclaircit (`amount` > 0) ou assombrit (< 0) une couleur `#rrggbb`. */
function shade(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16)
  const channel = (shift: number) => {
    const c = (n >> shift) & 255
    return Math.max(0, Math.min(255, Math.round(amount >= 0 ? c + (255 - c) * amount : c * (1 + amount))))
  }
  return `rgb(${channel(16)},${channel(8)},${channel(0)})`
}

type Ctx = CanvasRenderingContext2D
type Rnd = () => number

function speckle(ctx: Ctx, rnd: Rnd, count: number, light: string, dark: string, maxSize = 2) {
  for (let i = 0; i < count; i++) {
    ctx.fillStyle = rnd() > 0.5 ? light : dark
    ctx.globalAlpha = 0.08 + rnd() * 0.12
    ctx.fillRect(rnd() * SIZE, rnd() * SIZE, 1 + rnd() * maxSize, 1 + rnd() * maxSize)
  }
  ctx.globalAlpha = 1
}

/** Rangs d'éléments décalés d'un demi-élément un rang sur deux (brique, parpaing, tuile, ardoise). */
function courses(
  rows: number,
  perRow: number,
  paint: (x: number, y: number, w: number, h: number) => void,
) {
  const h = SIZE / rows
  const w = SIZE / perRow
  for (let r = 0; r < rows; r++) {
    const offset = r % 2 === 0 ? 0 : w / 2
    for (let c = -1; c <= perRow; c++) paint(c * w + offset, r * h, w, h)
  }
}

function paintWall(ctx: Ctx, material: WallMaterial, rnd: Rnd) {
  const base = wallColor3d(material) ?? '#dddddd'
  switch (material) {
    case 'brick': {
      ctx.fillStyle = '#cbc4b8'
      ctx.fillRect(0, 0, SIZE, SIZE)
      courses(8, 2, (x, y, w, h) => {
        ctx.fillStyle = shade(base, (rnd() - 0.5) * 0.28)
        ctx.fillRect(x + 2, y + 2, w - 4, h - 4)
      })
      break
    }
    case 'masonry': {
      ctx.fillStyle = shade(base, -0.28)
      ctx.fillRect(0, 0, SIZE, SIZE)
      courses(4, 2, (x, y, w, h) => {
        ctx.fillStyle = shade(base, (rnd() - 0.5) * 0.12)
        ctx.fillRect(x + 1.5, y + 1.5, w - 3, h - 3)
      })
      speckle(ctx, rnd, 500, '#ffffff', '#8a7f6a')
      break
    }
    case 'wood': {
      ctx.fillStyle = shade(base, -0.45)
      ctx.fillRect(0, 0, SIZE, SIZE)
      const board = SIZE / 4
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = shade(base, (rnd() - 0.5) * 0.18)
        ctx.fillRect(0, i * board + 2, SIZE, board - 4)
        for (let g = 0; g < 14; g++) {
          ctx.strokeStyle = shade(base, -0.2 - rnd() * 0.15)
          ctx.globalAlpha = 0.35
          ctx.lineWidth = 0.8
          const y = i * board + 4 + rnd() * (board - 8)
          ctx.beginPath()
          ctx.moveTo(0, y)
          ctx.lineTo(SIZE, y + (rnd() - 0.5) * 3)
          ctx.stroke()
        }
        ctx.globalAlpha = 1
      }
      break
    }
    case 'insulation': {
      ctx.fillStyle = base
      ctx.fillRect(0, 0, SIZE, SIZE)
      for (let i = 0; i < 420; i++) {
        ctx.strokeStyle = rnd() > 0.5 ? shade(base, 0.35) : shade(base, -0.25)
        ctx.globalAlpha = 0.45
        ctx.lineWidth = 1
        const x = rnd() * SIZE
        const y = rnd() * SIZE
        ctx.beginPath()
        ctx.moveTo(x, y)
        ctx.lineTo(x + (rnd() - 0.5) * 22, y + (rnd() - 0.5) * 6)
        ctx.stroke()
      }
      ctx.globalAlpha = 1
      break
    }
    case 'plasterboard': {
      ctx.fillStyle = base
      ctx.fillRect(0, 0, SIZE, SIZE)
      speckle(ctx, rnd, 250, '#ffffff', '#c8c6c0', 1)
      ctx.fillStyle = shade(base, -0.12)
      ctx.fillRect(0, 0, SIZE, 1.5)
      ctx.fillRect(0, 0, 1.5, SIZE)
      break
    }
    case 'concrete': {
      ctx.fillStyle = base
      ctx.fillRect(0, 0, SIZE, SIZE)
      speckle(ctx, rnd, 1400, '#ffffff', '#55555a', 3)
      ctx.fillStyle = shade(base, -0.2)
      ctx.fillRect(0, SIZE / 2 - 1, SIZE, 2)
      ctx.fillRect(SIZE / 2 - 1, 0, 2, SIZE)
      for (const [x, y] of [
        [SIZE / 4, SIZE / 4],
        [SIZE * 0.75, SIZE / 4],
        [SIZE / 4, SIZE * 0.75],
        [SIZE * 0.75, SIZE * 0.75],
      ]) {
        ctx.beginPath()
        ctx.arc(x, y, 3, 0, Math.PI * 2)
        ctx.fillStyle = shade(base, -0.3)
        ctx.fill()
      }
      break
    }
  }
}

function paintRoof(ctx: Ctx, covering: RoofCovering, rnd: Rnd) {
  const base = roofColor3d(covering) ?? '#888888'
  switch (covering) {
    case 'tiles': {
      ctx.fillStyle = shade(base, -0.55)
      ctx.fillRect(0, 0, SIZE, SIZE)
      courses(4, 2, (x, y, w, h) => {
        const tone = (rnd() - 0.5) * 0.22
        const g = ctx.createLinearGradient(0, y, 0, y + h)
        g.addColorStop(0, shade(base, tone + 0.12))
        g.addColorStop(1, shade(base, tone - 0.18))
        ctx.fillStyle = g
        ctx.fillRect(x + 1.5, y, w - 3, h - 1)
      })
      break
    }
    case 'slates': {
      ctx.fillStyle = shade(base, -0.5)
      ctx.fillRect(0, 0, SIZE, SIZE)
      courses(4, 2, (x, y, w, h) => {
        ctx.fillStyle = shade(base, (rnd() - 0.5) * 0.2)
        ctx.fillRect(x + 1, y, w - 2, h - 2)
        ctx.fillStyle = shade(base, 0.25)
        ctx.fillRect(x + 1, y + h - 3, w - 2, 1)
      })
      break
    }
    case 'zinc': {
      const g = ctx.createLinearGradient(0, 0, SIZE, 0)
      g.addColorStop(0, shade(base, 0.1))
      g.addColorStop(1, shade(base, -0.08))
      ctx.fillStyle = g
      ctx.fillRect(0, 0, SIZE, SIZE)
      for (let x = 0; x < SIZE; x += SIZE / 2) {
        ctx.fillStyle = shade(base, -0.4)
        ctx.fillRect(x, 0, 3, SIZE)
        ctx.fillStyle = shade(base, 0.35)
        ctx.fillRect(x + 3, 0, 1.5, SIZE)
      }
      speckle(ctx, rnd, 300, '#ffffff', '#444455', 1)
      break
    }
    case 'steel': {
      for (let x = 0; x < SIZE; x += SIZE / 4) {
        const g = ctx.createLinearGradient(x, 0, x + SIZE / 4, 0)
        g.addColorStop(0, shade(base, 0.3))
        g.addColorStop(0.35, shade(base, 0.05))
        g.addColorStop(0.5, shade(base, -0.3))
        g.addColorStop(1, shade(base, -0.05))
        ctx.fillStyle = g
        ctx.fillRect(x, 0, SIZE / 4, SIZE)
      }
      break
    }
    case 'flat': {
      ctx.fillStyle = base
      ctx.fillRect(0, 0, SIZE, SIZE)
      speckle(ctx, rnd, 1800, '#c9c7c2', '#2a2a2c', 3)
      break
    }
  }
}

const textures = new Map<string, THREE.CanvasTexture | null>()
const materials = new Map<string, THREE.MeshStandardMaterial>()

function textureFor(kind: 'wall' | 'roof', key: WallMaterial | RoofCovering): THREE.CanvasTexture | null {
  const id = `${kind}:${key}`
  if (textures.has(id)) return textures.get(id) ?? null
  let texture: THREE.CanvasTexture | null = null
  if (typeof document !== 'undefined') {
    const canvas = document.createElement('canvas')
    canvas.width = SIZE
    canvas.height = SIZE
    const ctx = canvas.getContext('2d')
    if (ctx) {
      const rnd = random(key.length * 7919 + key.charCodeAt(0))
      if (kind === 'wall') paintWall(ctx, key as WallMaterial, rnd)
      else paintRoof(ctx, key as RoofCovering, rnd)
      texture = new THREE.CanvasTexture(canvas)
      texture.wrapS = THREE.RepeatWrapping
      texture.wrapT = THREE.RepeatWrapping
      texture.colorSpace = THREE.SRGBColorSpace
      texture.anisotropy = 8
      const repeat = 1000 / TILE_MM[key]
      texture.repeat.set(repeat, repeat)
    }
  }
  textures.set(id, texture)
  return texture
}

function surface(kind: 'wall' | 'roof', key: WallMaterial | RoofCovering, color: string, doubleSided: boolean) {
  const id = `${kind}:${key}:${doubleSided}`
  let material = materials.get(id)
  if (!material) {
    const map = textureFor(kind, key)
    const metal = kind === 'roof' && (key === 'zinc' || key === 'steel')
    material = new THREE.MeshStandardMaterial({
      // Avec une texture, la couleur reste blanche : la texture porte déjà la teinte.
      color: map ? '#ffffff' : color,
      map,
      roughness: metal ? 0.45 : 0.9,
      metalness: metal ? 0.35 : 0,
      ...(doubleSided ? { side: THREE.DoubleSide } : {}),
    })
    materials.set(id, material)
  }
  return material
}

/** Matière d'un mur : motif du matériau (brique, bois…), ou `null` sans matériau (rendu neutre). */
export function wallSurface(material: WallMaterial | undefined, doubleSided = false) {
  const color = wallColor3d(material)
  return material && color ? surface('wall', material, color, doubleSided) : null
}

/** Matière d'une couverture (tuiles, zinc…), ou `null` sans couverture (rendu neutre). */
export function roofSurface(covering: RoofCovering | undefined, doubleSided = true) {
  const color = roofColor3d(covering)
  return covering && color ? surface('roof', covering, color, doubleSided) : null
}
