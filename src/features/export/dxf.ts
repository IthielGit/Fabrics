/**
 * Écriture d'un fichier DXF (format texte, version R12 « AC1009 ») sans bibliothèque (M11).
 *
 * Unités : millimètres (`$INSUNITS = 4`). Le plan de Fabrics a l'axe y vers le bas (écran) ; le DXF
 * a l'axe Y vers le haut : chaque point est retourné (`Y = −y`), les longueurs ne changent pas.
 * Les textes sont écrits en ASCII : un caractère accentué devient `\U+00E9`, lu par AutoCAD et
 * LibreCAD.
 */

export interface DxfLayer {
  name: string
  /** Couleur AutoCAD (ACI) : 1 rouge, 2 jaune, 3 vert, 4 cyan, 5 bleu, 6 magenta, 7 blanc/noir, 8 gris. */
  color: number
}

/** Coordonnées dans le repère du plan (mm, y vers le bas). */
export type DxfEntity =
  | { kind: 'line'; layer: string; x1: number; y1: number; x2: number; y2: number; dashed?: boolean }
  | { kind: 'polyline'; layer: string; points: readonly number[]; closed: boolean; dashed?: boolean }
  | { kind: 'circle'; layer: string; cx: number; cy: number; r: number }
  | {
      kind: 'text'
      layer: string
      x: number
      /** Ligne de base du texte. */
      y: number
      /** Hauteur des majuscules, mm. */
      height: number
      text: string
      /** Rotation en degrés, sens horaire à l'écran (comme Konva et le SVG). */
      angle?: number
      /** Point d'accroche : début (gauche) ou milieu de la ligne de base. */
      anchor?: 'start' | 'middle'
    }

/** Nombre court et exact : 4 décimales au plus, sans zéro inutile ni « -0 ». */
export function dxfNumber(value: number): string {
  const rounded = Math.round(value * 10000) / 10000
  if (Object.is(rounded, -0) || rounded === 0) return '0'
  return String(rounded)
}

/** Texte en ASCII : les caractères hors ASCII deviennent `\U+XXXX` ; les retours à la ligne, des espaces. */
export function dxfText(text: string): string {
  let out = ''
  for (const char of text.replace(/[\r\n\t]+/g, ' ')) {
    const code = char.codePointAt(0) ?? 32
    if (code >= 32 && code < 127) out += char
    else if (code <= 0xffff) out += `\\U+${code.toString(16).toUpperCase().padStart(4, '0')}`
    else out += '?'
  }
  return out
}

const DASHED = 'DASHED'
const CONTINUOUS = 'CONTINUOUS'

/** Paires « code / valeur » d'un fichier DXF, une par ligne. */
class DxfOut {
  private readonly lines: string[] = []

  pair(code: number, value: string | number): void {
    this.lines.push(String(code), typeof value === 'number' ? dxfNumber(value) : value)
  }

  /** Point retourné vers le repère DXF (y vers le haut). */
  point(x: number, y: number, base = 10): void {
    this.pair(base, x)
    this.pair(base + 10, -y)
    this.pair(base + 20, 0)
  }

  toString(): string {
    return `${this.lines.join('\r\n')}\r\n`
  }
}

function writeEntity(out: DxfOut, entity: DxfEntity): void {
  switch (entity.kind) {
    case 'line':
      out.pair(0, 'LINE')
      out.pair(8, entity.layer)
      if (entity.dashed) out.pair(6, DASHED)
      out.point(entity.x1, entity.y1)
      out.point(entity.x2, entity.y2, 11)
      return
    case 'polyline': {
      const { points } = entity
      if (points.length < 4) return
      out.pair(0, 'POLYLINE')
      out.pair(8, entity.layer)
      if (entity.dashed) out.pair(6, DASHED)
      out.pair(66, 1)
      out.point(0, 0)
      out.pair(70, entity.closed ? 1 : 0)
      for (let i = 0; i + 1 < points.length; i += 2) {
        out.pair(0, 'VERTEX')
        out.pair(8, entity.layer)
        out.point(points[i], points[i + 1])
      }
      out.pair(0, 'SEQEND')
      out.pair(8, entity.layer)
      return
    }
    case 'circle':
      out.pair(0, 'CIRCLE')
      out.pair(8, entity.layer)
      out.point(entity.cx, entity.cy)
      out.pair(40, entity.r)
      return
    case 'text': {
      const text = dxfText(entity.text)
      if (!text.trim()) return
      out.pair(0, 'TEXT')
      out.pair(8, entity.layer)
      out.point(entity.x, entity.y)
      out.pair(40, entity.height)
      out.pair(1, text)
      // Sens horaire à l'écran = sens inverse dans le repère DXF (y retourné).
      const angle = entity.angle ? -entity.angle : 0
      if (angle !== 0) out.pair(50, ((angle % 360) + 360) % 360)
      if (entity.anchor === 'middle') {
        out.pair(72, 1)
        out.point(entity.x, entity.y, 11)
      }
      return
    }
  }
}

/** Boîte englobante (repère du plan) des entités, ou `null` si aucune. */
function extents(entities: readonly DxfEntity[]): { minX: number; minY: number; maxX: number; maxY: number } | null {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  const add = (x: number, y: number) => {
    minX = Math.min(minX, x)
    maxX = Math.max(maxX, x)
    minY = Math.min(minY, y)
    maxY = Math.max(maxY, y)
  }
  for (const e of entities) {
    if (e.kind === 'line') {
      add(e.x1, e.y1)
      add(e.x2, e.y2)
    } else if (e.kind === 'polyline') {
      for (let i = 0; i + 1 < e.points.length; i += 2) add(e.points[i], e.points[i + 1])
    } else if (e.kind === 'circle') {
      add(e.cx - e.r, e.cy - e.r)
      add(e.cx + e.r, e.cy + e.r)
    } else {
      add(e.x, e.y)
    }
  }
  return Number.isFinite(minX) ? { minX, minY, maxX, maxY } : null
}

/**
 * Fichier DXF complet : en-tête (unités mm), tables (types de trait, calques, style de texte) et
 * entités. Les calques sont déclarés dans l'ordre donné, même vides.
 */
export function writeDxf(layers: readonly DxfLayer[], entities: readonly DxfEntity[]): string {
  const out = new DxfOut()
  const box = extents(entities) ?? { minX: 0, minY: 0, maxX: 0, maxY: 0 }

  out.pair(0, 'SECTION')
  out.pair(2, 'HEADER')
  out.pair(9, '$ACADVER')
  out.pair(1, 'AC1009')
  out.pair(9, '$INSUNITS')
  out.pair(70, 4) // millimètres
  out.pair(9, '$MEASUREMENT')
  out.pair(70, 1) // métrique
  out.pair(9, '$LUNITS')
  out.pair(70, 2) // décimal
  out.pair(9, '$LUPREC')
  out.pair(70, 0)
  out.pair(9, '$EXTMIN')
  out.point(box.minX, box.maxY) // y retourné : le bas du plan devient le minimum
  out.pair(9, '$EXTMAX')
  out.point(box.maxX, box.minY)
  out.pair(0, 'ENDSEC')

  out.pair(0, 'SECTION')
  out.pair(2, 'TABLES')

  out.pair(0, 'TABLE')
  out.pair(2, 'LTYPE')
  out.pair(70, 2)
  out.pair(0, 'LTYPE')
  out.pair(2, CONTINUOUS)
  out.pair(70, 0)
  out.pair(3, 'Solid line')
  out.pair(72, 65)
  out.pair(73, 0)
  out.pair(40, 0)
  out.pair(0, 'LTYPE')
  out.pair(2, DASHED)
  out.pair(70, 0)
  out.pair(3, 'Dashed __ __ __')
  out.pair(72, 65)
  out.pair(73, 2)
  out.pair(40, 150)
  out.pair(49, 100)
  out.pair(49, -50)
  out.pair(0, 'ENDTAB')

  out.pair(0, 'TABLE')
  out.pair(2, 'LAYER')
  out.pair(70, layers.length + 1)
  for (const layer of [{ name: '0', color: 7 }, ...layers]) {
    out.pair(0, 'LAYER')
    out.pair(2, layer.name)
    out.pair(70, 0)
    out.pair(62, layer.color)
    out.pair(6, CONTINUOUS)
  }
  out.pair(0, 'ENDTAB')

  out.pair(0, 'TABLE')
  out.pair(2, 'STYLE')
  out.pair(70, 1)
  out.pair(0, 'STYLE')
  out.pair(2, 'STANDARD')
  out.pair(70, 0)
  out.pair(40, 0)
  out.pair(41, 1)
  out.pair(50, 0)
  out.pair(71, 0)
  out.pair(42, 100)
  out.pair(3, 'txt')
  out.pair(4, '')
  out.pair(0, 'ENDTAB')

  out.pair(0, 'ENDSEC')

  out.pair(0, 'SECTION')
  out.pair(2, 'BLOCKS')
  out.pair(0, 'ENDSEC')

  out.pair(0, 'SECTION')
  out.pair(2, 'ENTITIES')
  for (const entity of entities) writeEntity(out, entity)
  out.pair(0, 'ENDSEC')
  out.pair(0, 'EOF')
  return out.toString()
}
