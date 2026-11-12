import { describe, expect, it } from 'vitest'
import { createLargeHouseProject } from '../documents/createProject'
import { fr } from '../../i18n/fr'
import type { FabricsDocument, Level, OpeningElement, RoomElement, WallElement } from '../../types/document'
import { buildIfc, ifcGuid, ifcNumber, ifcString } from './ifc'

const NOW = new Date('2026-11-12T10:00:00Z')
const OPTIONS = { projectName: "Maison d'été", fileName: 'maison.ifc', labels: fr.export.ifc, now: NOW }

const level: Level = { id: 'l0', name: 'Rez-de-chaussée', elevation: 0, height: 2700, slabThickness: 200 }

function base() {
  return { opacity: 1, locked: false, hidden: false, rotation: 0, x: 0, y: 0, levelId: 'l0' }
}

const wall: WallElement = {
  ...base(), id: 'w1', name: 'Mur nord', type: 'wall', points: [0, 0, 4000, 0, 4000, 3000],
  thickness: 200, height: 2700, fill: '#ccc',
}
const door: OpeningElement = {
  ...base(), id: 'o1', name: '', type: 'opening', kind: 'door', wallId: 'w1', segmentIndex: 0,
  offset: 1000, width: 900, height: 2100, sillHeight: 0, hinge: 'start', side: 'left',
}
const room: RoomElement = {
  ...base(), id: 'r1', name: 'Séjour', type: 'room', points: [100, 100, 3900, 100, 3900, 2900, 100, 2900],
  fill: '#fff', showLabel: true,
}
const doc = (elements: FabricsDocument['elements']) => ({ elements, levels: [level], plan: undefined })

describe('ifcNumber', () => {
  it('écrit toujours un point décimal, sans notation scientifique', () => {
    expect(ifcNumber(2500)).toBe('2500.')
    expect(ifcNumber(0.5)).toBe('0.5')
    expect(ifcNumber(-0.0000001)).toBe('0.')
    expect(ifcNumber(1e-9)).toBe('0.')
    expect(ifcNumber(-12.25)).toBe('-12.25')
  })
})

describe('ifcString', () => {
  it('double les apostrophes et les barres inverses', () => {
    expect(ifcString(String.raw`l'été \ ok`)).toBe(String.raw`'l''\X2\00E9\X0\t\X2\00E9\X0\ \\ ok'`)
  })
  it('regroupe les caractères accentués consécutifs', () => {
    expect(ifcString('éè')).toBe(String.raw`'\X2\00E900E8\X0\'`)
  })
})

describe('ifcGuid', () => {
  it('fait 22 caractères valides, toujours les mêmes pour un même texte', () => {
    const a = ifcGuid('wall:abc:0')
    expect(a).toMatch(/^[0-9A-Za-z_$]{22}$/)
    expect(ifcGuid('wall:abc:0')).toBe(a)
    expect(ifcGuid('wall:abc:1')).not.toBe(a)
    expect('0123'.includes(a[0])).toBe(true) // le premier caractère ne porte que 2 bits
  })
})

describe('buildIfc', () => {
  it('renvoie null quand il n’y a rien à exporter', () => {
    expect(buildIfc(doc([]), OPTIONS)).toBeNull()
    expect(buildIfc({ elements: [wall], levels: [], plan: undefined }, OPTIONS)).toBeNull()
  })

  it('écrit l’en-tête, le schéma IFC2x3 et les unités en millimètres', () => {
    const text = buildIfc(doc([wall, door, room]), OPTIONS)!
    expect(text.startsWith('ISO-10303-21;')).toBe(true)
    expect(text).toContain("FILE_SCHEMA(('IFC2X3'));")
    expect(text).toContain('IFCSIUNIT(*,.LENGTHUNIT.,.MILLI.,.METRE.)')
    expect(text).toContain("FILE_NAME('maison.ifc','2026-11-12T10:00:00'")
    expect(text.trimEnd().endsWith('END-ISO-10303-21;')).toBe(true)
    expect(text).toContain(String.raw`'Maison d''\X2\00E9\X0\t\X2\00E9\X0\'`)
  })

  it('crée un étage, un mur par côté, une réserve et une porte, un espace et un sol', () => {
    const text = buildIfc(doc([wall, door, room]), OPTIONS)!
    const count = (name: string) => (text.match(new RegExp(`=${name}\\(`, 'g')) ?? []).length
    expect(count('IFCBUILDINGSTOREY')).toBe(1)
    expect(count('IFCWALL')).toBe(2)
    expect(count('IFCOPENINGELEMENT')).toBe(1)
    expect(count('IFCRELVOIDSELEMENT')).toBe(1)
    expect(count('IFCDOOR')).toBe(1)
    expect(count('IFCWINDOW')).toBe(0)
    expect(count('IFCRELFILLSELEMENT')).toBe(1)
    expect(count('IFCSPACE')).toBe(1)
    expect(count('IFCSLAB')).toBe(1)
  })

  it('retourne l’axe y (le plan a y vers le bas) et prolonge le mur au raccord', () => {
    const text = buildIfc(doc([wall]), OPTIONS)!
    // 2e côté : du point (4000, 3000) du plan, donc Y = −3000 en IFC ; point de départ en (4000, 0).
    expect(text).toContain('IFCCARTESIANPOINT((4000.,0.,0.))')
    // Premier côté : 4000 mm + demi-épaisseur 100 mm de raccord ; second : 3000 mm, sans prolongement.
    expect(text).toContain('IFCRECTANGLEPROFILEDEF(.AREA.,$,#')
    expect(text).toMatch(/,4100\.,200\.\)/)
    expect(text).toMatch(/,3000\.,200\.\)/)
  })

  it('range un élément sans niveau dans le niveau le plus bas', () => {
    const common = { ...wall, levelId: undefined }
    const text = buildIfc(doc([common]), OPTIONS)!
    expect(text).toContain('IFCRELCONTAINEDINSPATIALSTRUCTURE')
    expect((text.match(/=IFCWALL\(/g) ?? []).length).toBe(2)
  })

  it('produit les mêmes identifiants à chaque export', () => {
    const a = buildIfc(doc([wall, door, room]), OPTIONS)
    const b = buildIfc(doc([wall, door, room]), OPTIONS)
    expect(a).toBe(b)
  })

  it('ne référence que des entités qui existent, sur la grande maison R+3', () => {
    const project = createLargeHouseProject(NOW)
    const text = buildIfc(project.document, OPTIONS)!
    expect(text).not.toBeNull()
    const defined = new Set([...text.matchAll(/^(#\d+)=/gm)].map((m) => m[1]))
    const used = [...text.matchAll(/#\d+/g)].map((m) => m[0])
    expect(used.every((id) => defined.has(id))).toBe(true)
    expect((text.match(/=IFCBUILDINGSTOREY\(/g) ?? []).length).toBe(project.document.levels!.length)
    // Aucune notation scientifique ni nombre sans point dans les coordonnées.
    expect(text).not.toMatch(/IFCCARTESIANPOINT\(\([^)]*e[-+]?\d/)
  })
})
