import { describe, expect, it } from 'vitest'
import {
  DESIGN_FORMATS,
  createDesignProject,
  createExamplePlanProject,
  createPlanProject,
  duplicateProject,
} from './createProject'
import { computeBuildingMeasurements } from '../measurements/measurements'
import { isSurfaceWarning, metresWarnings } from '../measurements/warnings'

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
  it('crée un plan avec deux pièces, deux murs et quatre ouvertures sur le rez-de-chaussée', () => {
    const project = createExamplePlanProject(NOW)
    const { elements, levels } = project.document
    expect(project.kind).toBe('plan')
    expect(elements.filter((e) => e.type === 'room')).toHaveLength(2)
    expect(elements.filter((e) => e.type === 'wall')).toHaveLength(2)
    expect(elements.filter((e) => e.type === 'opening')).toHaveLength(4)
    expect(elements.every((e) => e.levelId === levels![0].id)).toBe(true)
  })

  it('pose chaque ouverture sur un mur qui existe', () => {
    const { elements } = createExamplePlanProject(NOW).document
    const wallIds = new Set(elements.filter((e) => e.type === 'wall').map((e) => e.id))
    for (const e of elements) if (e.type === 'opening') expect(wallIds.has(e.wallId)).toBe(true)
  })
})

describe('plan d’exemple : contrôle des surfaces', () => {
  it('ne déclenche aucune alerte', () => {
    const document = createExamplePlanProject(NOW).document
    const warnings = metresWarnings(document, computeBuildingMeasurements(document)).filter(isSurfaceWarning)
    expect(warnings).toEqual([])
  })
})
