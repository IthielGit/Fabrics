import { describe, expect, it } from 'vitest'
import type { OpeningElement, OpeningStyle, WallElement } from '../../types/document'
import { createOpeningElement, createWallElement } from '../documents/elements'
import { createLevel } from '../documents/levels'
import { buildBuildingModel } from './model'
import { buildOpeningDetails } from './openingFills'
import { buildElevation } from './views/elevation'

const ground = createLevel('Rez-de-chaussée', 0, 2500, 200)

const wall: WallElement = { ...createWallElement('Mur', [0, 0, 4000, 0], 200, 2500), levelId: ground.id }

function opening(
  kind: OpeningElement['kind'],
  style: OpeningStyle | undefined,
  partial: Partial<OpeningElement> = {},
): OpeningElement {
  const base = createOpeningElement(kind, 'Ouverture', {
    wallId: wall.id,
    segmentIndex: 0,
    offset: 2000,
    side: 'left',
  })
  return { ...base, levelId: ground.id, ...(style ? { style } : {}), ...partial }
}

const details = (o: OpeningElement) => buildOpeningDetails(wall, [o], ground)
const ofKind = (o: OpeningElement, kind: 'frame' | 'glass' | 'door' | 'garage') =>
  details(o).fills.filter((f) => f.kind === kind)

describe('menuiseries des portes selon le style', () => {
  it('battant : un vantail et un triangle d\'ouverture', () => {
    const d = details(opening('door', 'swing'))
    expect(d.fills.filter((f) => f.kind === 'door')).toHaveLength(1)
    expect(d.marks).toHaveLength(1)
  })

  it('double battant : deux vantaux séparés par un jour, chacun avec son triangle', () => {
    const o = opening('door', 'double', { width: 1400 })
    const leaves = ofKind(o, 'door').sort((a, b) => a.center.x - b.center.x)
    expect(leaves).toHaveLength(2)
    expect(leaves[1].center.x - leaves[0].center.x).toBeGreaterThan(leaves[0].size.x)
    expect(details(o).marks).toHaveLength(2)
  })

  it('va-et-vient : un vantail avec un petit vitrage dans le tiers haut', () => {
    const o = opening('door', 'swingBoth')
    expect(ofKind(o, 'door')).toHaveLength(1)
    const glass = ofKind(o, 'glass')
    expect(glass).toHaveLength(1)
    const leaf = ofKind(o, 'door')[0]
    expect(glass[0].center.y).toBeGreaterThan(leaf.center.y)
  })

  it('pliante : quatre panneaux', () => {
    expect(ofKind(opening('door', 'folding'), 'door')).toHaveLength(4)
  })

  it('garage sectionnelle : des panneaux superposés de même largeur', () => {
    const o = opening('door', 'garageSectional', { width: 2400, height: 2000 })
    const panels = ofKind(o, 'garage')
    expect(panels.length).toBeGreaterThanOrEqual(3)
    expect(new Set(panels.map((p) => Math.round(p.size.x))).size).toBe(1)
    expect(new Set(panels.map((p) => Math.round(p.center.y))).size).toBe(panels.length)
    expect(details(o).marks).toHaveLength(0)
  })

  it('garage basculante : un seul panneau', () => {
    expect(ofKind(opening('door', 'garageTilt', { width: 2400, height: 2000 }), 'garage')).toHaveLength(1)
  })

  it('coulissante en applique : le vantail est posé contre la face du mur, du côté de l\'ouverture', () => {
    const left = ofKind(opening('door', 'slidingSurface', { side: 'left' }), 'door')[0]
    const right = ofKind(opening('door', 'slidingSurface', { side: 'right' }), 'door')[0]
    // mur horizontal à y = 0 : la « gauche » du mur est vers les y croissants (z de la 3D)
    expect(left.center.z).toBeGreaterThan(100)
    expect(right.center.z).toBeLessThan(-100)
    expect(details(opening('door', 'slidingSurface')).marks.length).toBeGreaterThan(0)
  })

  it('galandage : vantail dans le mur, avec une flèche', () => {
    const d = details(opening('door', 'slidingPocket'))
    expect(d.fills.filter((f) => f.kind === 'door')).toHaveLength(1)
    expect(d.fills.find((f) => f.kind === 'door')?.center.z).toBeCloseTo(0)
    expect(d.marks.length).toBeGreaterThan(0)
  })
})

describe('menuiseries des fenêtres et baies selon le style', () => {
  it('deux vantaux : montant central, deux vitres, un triangle par vantail', () => {
    const o = opening('window', 'casement2')
    expect(ofKind(o, 'frame')).toHaveLength(5)
    expect(ofKind(o, 'glass')).toHaveLength(2)
    expect(details(o).marks).toHaveLength(2)
  })

  it('le style par défaut d\'une fenêtre sans style est « deux vantaux »', () => {
    expect(details(opening('window', undefined))).toEqual(details(opening('window', 'casement2')))
  })

  it('un vantail : une vitre, la pointe du triangle du côté des gonds', () => {
    const start = details(opening('window', 'casement1', { hinge: 'start' }))
    const end = details(opening('window', 'casement1', { hinge: 'end' }))
    expect(start.fills.filter((f) => f.kind === 'glass')).toHaveLength(1)
    // pointe = deuxième point de la ligne brisée ; sur un mur horizontal, x = u
    expect(start.marks[0].points[1].x).toBeLessThan(2000)
    expect(end.marks[0].points[1].x).toBeGreaterThan(2000)
    // et les deux extrémités sont du côté opposé
    expect(start.marks[0].points[0].x).toBeGreaterThan(2000)
  })

  it('fixe : une vitre, aucune marque', () => {
    const o = opening('window', 'fixed')
    expect(ofKind(o, 'glass')).toHaveLength(1)
    expect(details(o).marks).toHaveLength(0)
  })

  it('soufflet : la pointe du triangle est en bas', () => {
    const d = details(opening('window', 'tilt', { width: 600, height: 400, sillHeight: 1600 }))
    const [a, apex, b] = d.marks[0].points
    expect(apex.y).toBeLessThan(a.y)
    expect(apex.y).toBeLessThan(b.y)
  })

  it('coulissante : deux vitres décalées dans l\'épaisseur qui se recouvrent, et une flèche', () => {
    const d = details(opening('window', 'sliding', { width: 1500, height: 1200 }))
    const glass = d.fills.filter((f) => f.kind === 'glass').sort((a, b) => a.center.x - b.center.x)
    expect(glass).toHaveLength(2)
    expect(glass[0].center.z).not.toBe(glass[1].center.z)
    const leftEnd = glass[0].center.x + glass[0].size.x / 2
    const rightStart = glass[1].center.x - glass[1].size.x / 2
    expect(leftEnd).toBeGreaterThan(rightStart) // recouvrement
    expect(d.marks.length).toBeGreaterThan(0)
  })

  it('l\'oscillo-battant ajoute un triangle par vantail', () => {
    expect(details(opening('window', 'casement1', { tiltTurn: true })).marks).toHaveLength(2)
    expect(details(opening('window', 'casement2', { tiltTurn: true })).marks).toHaveLength(4)
    // sans effet sur un autre style
    expect(details(opening('window', 'fixed', { tiltTurn: true })).marks).toHaveLength(0)
  })

  it('baie fixe : cadre et une vitre ; baie coulissante : deux vitres', () => {
    expect(ofKind(opening('bay', 'bay-fixed'), 'glass')).toHaveLength(1)
    expect(ofKind(opening('bay', 'bay-sliding'), 'glass')).toHaveLength(2)
  })

  it('ouverture libre : ni cadre ni remplissage', () => {
    const d = details(opening('bay', 'free', { width: 1000, height: 2100 }))
    expect(d.fills).toEqual([])
    expect(d.marks).toEqual([])
  })
})

describe('façades', () => {
  const build = (o: OpeningElement) => buildBuildingModel({ elements: [wall, o], levels: [ground] })

  it('le modèle porte les marques des ouvertures', () => {
    expect(build(opening('window', 'casement2')).marks).toHaveLength(2)
    expect(build(opening('window', 'fixed')).marks).toHaveLength(0)
  })

  it('une façade montre les deux vantaux et les triangles en pointillé', () => {
    const view = buildElevation(build(opening('window', 'casement2')), [ground], 'N', 0)
    expect(view.faces.filter((f) => f.kind === 'glass')).toHaveLength(2)
    const marks = view.faces.filter((f) => f.kind === 'mark')
    expect(marks).toHaveLength(2)
    expect(marks.every((f) => f.dashed)).toBe(true)
  })

  it('un trait d\'ouverture se peint devant la vitre qui le porte', () => {
    const view = buildElevation(build(opening('window', 'casement1')), [ground], 'N', 0)
    const glass = view.faces.find((f) => f.kind === 'glass')!
    const mark = view.faces.find((f) => f.kind === 'mark')!
    expect(mark.depth).toBeLessThan(glass.depth) // plus petit = plus proche, donc peint après
    const order = view.faces.indexOf(mark) > view.faces.indexOf(glass)
    expect(order).toBe(true)
  })

  it('la même façade vue de l\'autre côté montre les traits en miroir', () => {
    const north = buildElevation(build(opening('window', 'casement1', { hinge: 'start' })), [ground], 'N', 0)
    const south = buildElevation(build(opening('window', 'casement1', { hinge: 'start' })), [ground], 'S', 0)
    const apex = (faces: typeof north.faces) => faces.find((f) => f.kind === 'mark')!.polygon[1][0]
    // la pointe est du côté de x plus petit : à gauche vue du sud, à droite vue du nord
    expect(apex(south.faces)).toBeLessThan(2000)
    expect(apex(north.faces)).toBeGreaterThan(-2000)
  })

  it('un mur vu par la tranche (façade Est) ne montre pas ses traits', () => {
    const view = buildElevation(build(opening('window', 'casement2')), [ground], 'E', 0)
    expect(view.faces.filter((f) => f.kind === 'mark')).toHaveLength(0)
  })

  it('les traits de façade ne sont pas des surfaces dessinées : pas de remplissage', async () => {
    const { drawingFromView } = await import('./views/drawing')
    const view = buildElevation(build(opening('window', 'casement1')), [ground], 'N', 0)
    const drawing = drawingFromView(view)!
    const lines = drawing.polygons.filter((p) => p.open)
    expect(lines).toHaveLength(1)
    expect(lines[0].fill).toBe('none')
    expect(lines[0].dashed).toBe(true)
  })
})
