/**
 * M20 20.9 — gate G3, critère « modifier un mur met à jour plans, coupes, façades et nomenclatures ».
 * Exemple ROOMIT (RDC, R+1, toiture) : dans la scène Pascal, le mur est de la Chambre 1 (RDC) recule de
 * 500 mm vers l'est, avec les deux murs qui s'y raccordent (comme un mur tiré dans Pascal). Tout le jeu
 * de feuilles est recalculé depuis la scène ; seules les feuilles concernées changent.
 */
import { describe, expect, it } from 'vitest'
import rdc from '../../../fixtures/ROOMIT-RDC/spec.json'
import r1 from '../../../fixtures/ROOMIT-R1/spec.json'
import type { FabricsDocument, SectionLineElement } from '../../types/document'
import { computeBuildingMeasurements } from '../measurements/measurements'
import { fixtureBuildingScene, type FixtureSpec } from '../scene/fixturePlan'
import type { PlanScene } from '../scene/sceneTypes'
import { settleScene } from '../scene/settle'
import { sceneToFabricsView } from '../scene/view/toFabricsView'
import { compareSheetSets, sheetSnapshotsOf } from './sheetSet'

const SHIFT_M = 0.5

/** Le mur CH1_D passe de x = 14,373 m à 14,873 m ; CH1_H et BAS s'allongent jusqu'à lui. */
function wallMovedInPascal(scene: PlanScene): PlanScene {
  const nodes = { ...scene.nodes }
  const move = (id: string, fn: (start: number[], end: number[]) => [number[], number[]]) => {
    const wall = nodes[id]
    const [start, end] = fn(wall.start as number[], wall.end as number[])
    nodes[id] = { ...wall, start, end }
  }
  move('wall_RDC_CH1_D__0', (s, e) => [[s[0] + SHIFT_M, s[1]], [e[0] + SHIFT_M, e[1]]])
  move('wall_RDC_CH1_H__0', (s, e) => [s, [e[0] + SHIFT_M, e[1]]])
  move('wall_RDC_BAS__0', (s, e) => [s, [e[0] + SHIFT_M, e[1]]])
  return settleScene({ ...scene, nodes })
}

/** Coupe A–A d'ouest en est à travers le Séjour et la Chambre 1 (y = 9000 mm). */
const SECTION: SectionLineElement = {
  id: 'coupe-a',
  type: 'section',
  name: 'Coupe A',
  label: 'A',
  points: [-2000, 9000, 17000, 9000],
  lookLeft: true,
  x: 0,
  y: 0,
  rotation: 0,
  opacity: 1,
  locked: false,
  hidden: false,
} as SectionLineElement

const withSection = (doc: FabricsDocument): FabricsDocument => ({ ...doc, elements: [...doc.elements, SECTION] })

describe('gate G3 : un mur modifié met à jour tout le jeu de feuilles', () => {
  const before = fixtureBuildingScene([rdc, r1] as unknown as FixtureSpec[])
  const after = wallMovedInPascal(before)
  const viewBefore = withSection(sceneToFabricsView(before))
  const viewAfter = withSection(sceneToFabricsView(after))
  const changes = Object.fromEntries(
    compareSheetSets(sheetSnapshotsOf(viewBefore, before), sheetSnapshotsOf(viewAfter, after)).map((c) => [c.key, c.change]),
  )

  it('la Chambre 1 grandit de 500 mm × sa profondeur dans les métrés (vue recalculée depuis la scène)', () => {
    const area = (doc: FabricsDocument) =>
      computeBuildingMeasurements(doc).levels.find((l) => l.level.id === 'RDC')!.measurements.rooms.find((r) => r.name === 'Chambre 1')!.area
    // Profondeur entre les axes de CH1_H (y = 6,789 m) et BAS (y = 11,378 m), moins les demi-épaisseurs.
    const grown = (area(viewAfter) - area(viewBefore)) / 500
    expect(grown).toBeGreaterThan(4000)
    expect(grown).toBeLessThan(4589)
  })

  it('plan de niveau et plan de plafond du RDC, coupe A–A, façades nord et sud, nomenclatures : modifiés', () => {
    for (const key of ['level-RDC', 'ceiling-RDC', 'section-coupe-a', 'elevation-N', 'elevation-S', 'schedules', 'sheet']) {
      expect(changes[key], key).toBe('changed')
    }
  })

  it('les feuilles que le mur ne touche pas restent identiques (R+1, plafond du R+1, toiture)', () => {
    for (const key of ['level-R1', 'ceiling-R1', 'roof-R1']) expect(changes[key], key).toBe('unchanged')
  })
})
