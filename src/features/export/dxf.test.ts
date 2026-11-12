import DxfParser from 'dxf-parser'
import { describe, expect, it } from 'vitest'
import { dxfNumber, dxfText, writeDxf } from './dxf'

const LAYERS = [
  { name: 'MURS', color: 7 },
  { name: 'COTES', color: 1 },
]

describe('dxfNumber', () => {
  it('écrit des nombres courts et exacts', () => {
    expect(dxfNumber(5000)).toBe('5000')
    expect(dxfNumber(12.34567)).toBe('12.3457')
    expect(dxfNumber(-0)).toBe('0')
    expect(dxfNumber(-0.00001)).toBe('0')
  })
})

describe('dxfText', () => {
  it('garde l’ASCII et code les accents', () => {
    expect(dxfText('Séjour')).toBe('S\\U+00E9jour')
    expect(dxfText('12,40 m²')).toBe('12,40 m\\U+00B2')
    expect(dxfText('a\nb')).toBe('a b')
  })
})

describe('writeDxf', () => {
  it('déclare des millimètres et les calques demandés', () => {
    const text = writeDxf(LAYERS, [])
    expect(text).toContain('$INSUNITS\r\n70\r\n4')
    const parsed = new DxfParser().parseSync(text)
    expect(parsed?.header.$INSUNITS).toBe(4)
    expect(Object.keys(parsed?.tables.layer.layers ?? {})).toEqual(expect.arrayContaining(['MURS', 'COTES']))
  })

  it('une ligne de 5000 mm mesure 5000 mm une fois relue (y retourné)', () => {
    const text = writeDxf(LAYERS, [{ kind: 'line', layer: 'MURS', x1: 1000, y1: 2000, x2: 6000, y2: 2000 }])
    const parsed = new DxfParser().parseSync(text)
    const line = parsed?.entities[0] as unknown as { type: string; layer: string; vertices: { x: number; y: number }[] }
    expect(line.type).toBe('LINE')
    expect(line.layer).toBe('MURS')
    expect(line.vertices[0]).toMatchObject({ x: 1000, y: -2000 })
    expect(Math.hypot(line.vertices[1].x - line.vertices[0].x, line.vertices[1].y - line.vertices[0].y)).toBe(5000)
  })

  it('écrit polylignes fermées, cercles et textes', () => {
    const text = writeDxf(LAYERS, [
      { kind: 'polyline', layer: 'MURS', points: [0, 0, 4000, 0, 4000, 3000, 0, 3000], closed: true },
      { kind: 'circle', layer: 'COTES', cx: 0, cy: 0, r: 250 },
      { kind: 'text', layer: 'COTES', x: 10, y: 20, height: 125, text: 'Cuisine', angle: -90, anchor: 'middle' },
    ])
    const parsed = new DxfParser().parseSync(text)
    const [polyline, circle, label] = (parsed?.entities ?? []) as unknown as Record<string, unknown>[]
    expect(polyline.type).toBe('POLYLINE')
    expect(polyline.shape).toBe(true)
    expect((polyline.vertices as unknown[]).length).toBe(4)
    expect(circle).toMatchObject({ type: 'CIRCLE', radius: 250 })
    expect(label).toMatchObject({ type: 'TEXT', text: 'Cuisine', textHeight: 125, rotation: 90 })
  })
})
