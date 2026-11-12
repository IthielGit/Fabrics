import { describe, expect, it } from 'vitest'
import {
  DESIGN_FORMATS,
  createDesignProject,
  createExamplePlanProject,
  createLargeHouseProject,
  createPlanProject,
  duplicateProject,
} from './createProject'
import { computeBuildingMeasurements } from '../measurements/measurements'
import { isSurfaceWarning, metresWarnings } from '../measurements/warnings'
import { toPoints } from '../geometry/polygon'
import { pointInPolygon } from '../stairs/voids'

const NOW = new Date('2026-11-10T10:00:00.000Z')

describe('createDesignProject', () => {
  it('crée un post carré 1080 × 1080 px vide', () => {
    const project = createDesignProject('post-square', 'Mon post', NOW)
    expect(project.kind).toBe('design')
    expect(project.name).toBe('Mon post')
    expect(project.document.unit).toBe('px')
    expect(project.document.page).toEqual({ width: 1080, height: 1080, background: '#ffffff' })
    expect(project.document.elements).toEqual([])
    expect(project.document.plan).toBeUndefined()
    expect(project.createdAt).toBe(NOW.toISOString())
    expect(project.updatedAt).toBe(NOW.toISOString())
  })

  it('propose les 4 formats attendus', () => {
    const sizes = Object.fromEntries(DESIGN_FORMATS.map((f) => [f.id, [f.width, f.height]]))
    expect(sizes).toEqual({
      'post-square': [1080, 1080],
      a4: [2480, 3508],
      a3: [3508, 4961],
      banner: [1500, 500],
    })
  })

  it('génère des identifiants différents', () => {
    const a = createDesignProject('a4', 'A')
    const b = createDesignProject('a4', 'B')
    expect(a.id).not.toBe(b.id)
  })
})

describe('createPlanProject', () => {
  it('crée un plan en mm de 20 × 15 m, échelle 1:50, grille de 10 cm', () => {
    const project = createPlanProject('Cuisine', NOW)
    expect(project.kind).toBe('plan')
    expect(project.document.unit).toBe('mm')
    expect(project.document.page).toEqual({ width: 20000, height: 15000, background: '#ffffff' })
    expect(project.document.plan).toEqual({
      scale: 50,
      gridSize: 100,
      snapToGrid: true,
      defaultWallThickness: 200,
      defaultWallHeight: 2500,
      northAngle: 0,
    })
  })

  it('ne partage pas les réglages entre deux plans', () => {
    const a = createPlanProject('A')
    const b = createPlanProject('B')
    a.document.plan!.scale = 100
    expect(b.document.plan!.scale).toBe(50)
  })
})

describe('duplicateProject', () => {
  it('copie le contenu avec un nouvel identifiant et un nouveau nom', () => {
    const source = createDesignProject('a4', 'Original', new Date('2026-01-01T00:00:00.000Z'))
    source.document.elements.push({
      id: 'e1', name: 'Rect', type: 'rect', x: 1, y: 2, width: 10, height: 10,
      fill: '#f00', stroke: '#000', strokeWidth: 1, cornerRadius: 0,
      rotation: 0, opacity: 1, locked: false, hidden: false,
    })
    const copy = duplicateProject(source, 'Original (copie)', NOW)
    expect(copy.id).not.toBe(source.id)
    expect(copy.name).toBe('Original (copie)')
    expect(copy.createdAt).toBe(NOW.toISOString())
    expect(copy.document).toEqual(source.document)
  })

  it('est indépendante de la source', () => {
    const source = createDesignProject('a4', 'Original')
    const copy = duplicateProject(source, 'Copie')
    copy.document.page.background = '#000000'
    expect(source.document.page.background).toBe('#ffffff')
  })
})

describe('createExamplePlanProject', () => {
  it('crée une maison à deux niveaux avec pièces, murs, ouvertures, escalier, meubles et toit', () => {
    const project = createExamplePlanProject(NOW)
    const { elements, levels } = project.document
    expect(project.kind).toBe('plan')
    expect(levels).toHaveLength(2)
    const count = (type: string, levelId?: string) =>
      elements.filter((e) => e.type === type && (levelId === undefined || e.levelId === levelId)).length
    expect(count('room', levels![0].id)).toBe(4)
    expect(count('room', levels![1].id)).toBe(6)
    expect(count('stair', levels![0].id)).toBe(1)
    expect(count('roof', levels![1].id)).toBe(1)
    expect(count('furniture')).toBeGreaterThan(30)
    expect(count('dimension')).toBeGreaterThan(0)
    expect(count('section')).toBe(1)
  })

  it('ne laisse que la ligne de coupe sans niveau', () => {
    const { elements } = createExamplePlanProject(NOW).document
    const withoutLevel = elements.filter((e) => e.levelId === undefined)
    expect(withoutLevel.map((e) => e.type)).toEqual(['section'])
  })

  it('pose chaque ouverture sur un mur du même niveau', () => {
    const { elements } = createExamplePlanProject(NOW).document
    const walls = new Map(elements.filter((e) => e.type === 'wall').map((e) => [e.id, e]))
    for (const e of elements) {
      if (e.type !== 'opening') continue
      expect(walls.get(e.wallId)?.levelId).toBe(e.levelId)
    }
  })
})

describe('createLargeHouseProject', () => {
  it('crée une maison R+3 : quatre niveaux, 21 pièces, trois escaliers, un toit en pente', () => {
    const { elements, levels, page } = createLargeHouseProject(NOW).document
    expect(page).toMatchObject({ width: 40000, height: 30000 })
    expect(levels!.map((l) => l.elevation)).toEqual([0, 2700, 5400, 8100])
    const count = (type: string) => elements.filter((e) => e.type === type).length
    expect(count('room')).toBe(21)
    expect(count('stair')).toBe(3)
    const roofs = elements.filter((e) => e.type === 'roof')
    expect(roofs).toHaveLength(1)
    expect(roofs[0].levelId).toBe(levels![3].id)
    expect(roofs[0].type === 'roof' && roofs[0].shape).toBe('gable')
    expect(count('furniture')).toBeGreaterThan(60)
  })

  it('a un garage deux voitures, une véranda vitrée, des terrasses et une piscine', () => {
    const { elements, levels } = createLargeHouseProject(NOW).document
    const names = (type: string) => elements.filter((e) => e.type === type).map((e) => e.name)
    expect(names('room')).toEqual(expect.arrayContaining(['Garage', 'Véranda']))
    expect(names('platform')).toEqual(['Terrasse', 'Plage de la piscine', 'Terrasse de l’étage'])
    const symbols = elements.flatMap((e) => (e.type === 'furniture' ? [e.symbol] : []))
    expect(symbols.filter((s) => s === 'car' || s === 'car-suv')).toHaveLength(2)
    expect(symbols).toContain('swimming-pool')
    const openings = elements.flatMap((e) => (e.type === 'opening' ? [e] : []))
    expect(openings.filter((o) => o.style === 'garageSectional' && o.width === 5000)).toHaveLength(1)
    // Trois baies pour la véranda, une pour la terrasse de l'étage, plus la baie du séjour.
    expect(openings.filter((o) => o.kind === 'bay')).toHaveLength(5)
    const roofTerrace = elements.find((e) => e.name === 'Terrasse de l’étage')
    expect(roofTerrace?.levelId).toBe(levels![1].id)
  })

  it('a une emprise de 120 m² au sol (12000 × 10000 mm hors tout)', () => {
    const { elements } = createLargeHouseProject(NOW).document
    const roof = elements.find((e) => e.type === 'roof')!
    const pts = roof.type === 'roof' ? roof.points : []
    const xs = pts.filter((_, i) => i % 2 === 0)
    const ys = pts.filter((_, i) => i % 2 === 1)
    expect((Math.max(...xs) - Math.min(...xs)) * (Math.max(...ys) - Math.min(...ys))).toBe(120_000_000)
  })

  it('pose chaque ouverture sur un mur du même niveau', () => {
    const { elements } = createLargeHouseProject(NOW).document
    const walls = new Map(elements.filter((e) => e.type === 'wall').map((e) => [e.id, e]))
    for (const e of elements) {
      if (e.type === 'opening') expect(walls.get(e.wallId)?.levelId).toBe(e.levelId)
    }
  })

  it('ne déclenche aucune alerte de métrés', () => {
    const document = createLargeHouseProject(NOW).document
    expect(metresWarnings(document, computeBuildingMeasurements(document))).toEqual([])
  })
})

describe('exemples : chaque meuble tient dans une pièce ou sur une terrasse de son niveau', () => {
  // Coins d'un objet posé par son coin haut-gauche et tourné autour de ce coin, rapprochés de 2 mm
  // de son centre : un meuble contre un mur (coin sur le bord de la pièce) compte comme dedans.
  const corners = (el: { x: number; y: number; width: number; depth: number; rotation: number }) => {
    const a = (el.rotation * Math.PI) / 180
    const c = Math.cos(a)
    const s = Math.sin(a)
    return [
      [2, 2],
      [el.width - 2, 2],
      [el.width - 2, el.depth - 2],
      [2, el.depth - 2],
    ].map(([u, v]) => ({ x: el.x + u * c - v * s, y: el.y + u * s + v * c }))
  }

  for (const [label, create] of [
    ['maison à étage', createExamplePlanProject],
    ['grande maison R+3', createLargeHouseProject],
  ] as const) {
    it(label, () => {
      const { elements } = create(NOW).document
      const areas = elements.flatMap((e) =>
        e.type === 'room' || e.type === 'platform' ? [{ levelId: e.levelId, polygon: toPoints(e.points) }] : [],
      )
      // La piscine est posée au niveau du jardin, au creux de la plage en U : hors pièce et hors terrasse.
      const misplaced = elements
        .flatMap((e) => (e.type === 'furniture' && e.symbol !== 'swimming-pool' ? [e] : []))
        .filter((item) => {
          const pts = corners(item)
          return !areas.some(
            (area) => area.levelId === item.levelId && pts.every((p) => pointInPolygon(p, area.polygon)),
          )
        })
        .map((e) => e.name)
      expect(misplaced).toEqual([])
    })
  }
})

describe('plan d’exemple : contrôle des métrés', () => {
  it('ne déclenche aucune alerte (surfaces, ouvertures, murs, trémie)', () => {
    const document = createExamplePlanProject(NOW).document
    const warnings = metresWarnings(document, computeBuildingMeasurements(document))
    expect(warnings).toEqual([])
    expect(warnings.filter(isSurfaceWarning)).toEqual([])
  })
})
