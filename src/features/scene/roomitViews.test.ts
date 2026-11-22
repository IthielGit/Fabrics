/**
 * M20 20.1c — coupes et façades branchées sur la scène Pascal. La toiture native de Pascal (4 pans à
 * 1 %, D20-13) est dessinée par les façades et coupes de Fabrics (toitures dérivées, hors métrés) ;
 * une seule cote « Faîtage » pour des pans voisins ; critère du gate G3 : un étage de 2500 mm mesure
 * 50 mm sur une façade imprimée à 1:50 (PDF relu).
 */
import { describe, expect, it } from 'vitest'
import rdc from '../../../fixtures/ROOMIT-RDC/spec.json'
import r1 from '../../../fixtures/ROOMIT-R1/spec.json'
import { buildBuildingModel } from '../building/model'
import { drawingFromView, PAPER_TEXT_MM } from '../building/views/drawing'
import { buildElevation } from '../building/views/elevation'
import { buildSection } from '../building/views/section'
import { printedDrawing, TOLERANCE_MM } from '../export/printedPdf'
import { computeBuildingMeasurements } from '../measurements/measurements'
import { fixtureBuildingScene, type FixtureSpec } from './fixturePlan'
import { sceneToFabricsView } from './view/toFabricsView'

const scene = fixtureBuildingScene([rdc, r1] as unknown as FixtureSpec[])
const view = sceneToFabricsView(scene)
const model = buildBuildingModel(view)

describe('ROOMIT : façades et coupes avec la toiture de Pascal', () => {
  it('les 4 pans de Pascal deviennent des toitures dérivées du modèle, hors métrés et hors scène', () => {
    expect(view.nativeRoofs).toHaveLength(4)
    expect(view.nativeRoofs!.every((r) => r.levelId === 'R1' && r.shape === 'shed' && r.overhang === 300)).toBe(true)
    expect(view.elements.some((el) => el.type === 'roof')).toBe(false)
    expect(model.roofs.length).toBeGreaterThan(0)
    // Métrés de toiture : seulement ceux de Pascal (4 pans), pas de doublon par les toitures dérivées.
    const r1Metres = computeBuildingMeasurements(view).levels.find((l) => l.level.id === 'R1')!.measurements
    expect(r1Metres.roofs).toHaveLength(4)
  })

  it('façade sud : la toiture est dessinée au-dessus du R+1 (dessus des murs à 6000 mm, pente 1 %)', () => {
    const elevation = buildElevation(model, view.levels!, 'S', 0)
    expect(elevation.bounds!.maxV).toBeGreaterThan(6000)
    expect(elevation.bounds!.maxV).toBeLessThan(6400)
  })

  it('coupe A–A à travers le bâtiment : la toiture est coupée, une seule cote « Faîtage »', () => {
    const section = buildSection(model, view.levels!, { points: [7000, -1500, 7000, 14500], lookLeft: true, label: 'A', ridgeLabel: 'Faîtage' })!
    const ridges = section.levels.filter((m) => m.name === 'Faîtage')
    expect(ridges).toHaveLength(1)
    expect(ridges[0].elevation).toBeGreaterThan(6000)
  })
})

describe('critère G3 : étage de 2500 mm = 50 mm sur une façade à 1:50', () => {
  it('façade imprimée (PDF relu) : les traits des niveaux 0 et 2500 mm sont à 50,0 mm l’un de l’autre', async () => {
    const level = (id: string, elevation: number) => ({ id, name: id, elevation, height: 2500, slabThickness: 200 })
    const wall = (ref: string, axis: number[]) => ({ ref, thickness: 200, height: 2500, axis })
    const box = (lv: string) => [wall(`${lv}a`, [0, 0, 6000, 0]), wall(`${lv}b`, [6000, 0, 6000, 4000]), wall(`${lv}c`, [6000, 4000, 0, 4000]), wall(`${lv}d`, [0, 4000, 0, 0])]
    const specs = [
      { level: level('L0', 0), walls: box('L0'), openings: [], rooms: [{ name: 'Pièce', polygon: [100, 100, 5900, 100, 5900, 3900, 100, 3900] }] },
      { level: level('L1', 2500), walls: box('L1'), openings: [], rooms: [{ name: 'Pièce', polygon: [100, 100, 5900, 100, 5900, 3900, 100, 3900] }] },
    ] as unknown as FixtureSpec[]
    const v = sceneToFabricsView(fixtureBuildingScene(specs))
    const drawing = drawingFromView(buildElevation(buildBuildingModel(v), v.levels!, 'S', 0), PAPER_TEXT_MM * 50)!
    const marks = drawing.lines.filter((l) => l.dashed && l.weight === 'hair' && l.muted)
    expect(marks).toHaveLength(2)
    const { onPaper } = await printedDrawing(drawing, 'a3', 'landscape', 50)
    const [a, b] = marks.map((l) => onPaper(l))
    expect(a && b).toBeTruthy()
    expect(Math.abs(Math.abs(a![1] - b![1]) - 50)).toBeLessThanOrEqual(TOLERANCE_MM)
  })
})
