/**
 * Risque du plan M18 : Pascal « répare » une scène à son chargement (`setScene` : migrations,
 * nettoyage des orphelins, valeurs par défaut) et reprend les pièces fermées par des murs (contour à
 * l'axe des murs, modèle de pièces de Pascal adopté le 2026-11-18). Le plan relu après ce chargement
 * doit rester identique : le sol intérieur calculé par Pascal redonne le contour tracé sur les faces.
 */
import { describe, expect, it } from 'vitest'
import { createExamplePlanProject, createLargeHouseProject } from '../../documents/createProject'
import type { PlanScene } from '../sceneTypes'
import { settleScene } from '../settle'
import { sceneToFabricsView } from '../view/toFabricsView'
import { fabricsToScene } from './fromFabrics'

const NOW = new Date('2026-11-18T00:00:00Z')

const loadedByPascal = (scene: PlanScene): PlanScene => settleScene(scene)

describe('scène chargée par le store de Pascal', () => {
  it.each([
    ['exemple', createExamplePlanProject],
    ['grande maison', createLargeHouseProject],
  ])('le plan « %s » ressort identique après le chargement', (_, create) => {
    const doc = create(NOW).document
    const { scene } = fabricsToScene(doc)
    const loaded = loadedByPascal(scene)
    expect(Object.keys(loaded.nodes).sort()).toEqual(Object.keys(scene.nodes).sort())
    expect(sceneToFabricsView(loaded)).toStrictEqual(doc)
  })

  it('reprend chaque pièce fermée par des murs comme pièce Pascal, à l’axe des murs', () => {
    const { scene } = fabricsToScene(createExamplePlanProject(NOW).document)
    const zones = Object.values(loadedByPascal(scene).nodes).filter((n) => n.type === 'zone')
    expect(zones.length).toBeGreaterThan(0)
    for (const zone of zones) expect(zone, zone.name).toMatchObject({ spaceRole: 'room', autoFromWalls: true })
    // Le Séjour est tracé sur les faces (4000 mm) ; son contour Pascal est sur l'axe du mur (3900 mm).
    const sejour = zones.find((z) => z.name === 'Séjour')!
    expect((sejour.polygon as [number, number][]).flat()).toContain(3.9)
  })
})
