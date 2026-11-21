/**
 * Baseline Fabrics (M17, mécanisme anti-régression du roadmap) : métrés, dessins et exports des
 * plans d'exemple, figés dans `baseline/fabrics/`. Tout écart fait échouer le test.
 *
 * Un écart voulu se documente dans `docs/PROGRESS.md`, puis la référence est mise à jour dans un
 * commit séparé avec `npx vitest run src/baseline -u`.
 */
import { unzipSync, strFromU8 } from 'fflate'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import ViewDrawing from '../components/views/ViewDrawing'
import { metresTables, prepareMetres } from '../components/editor/exportMetres'
import { buildBuildingModel } from '../features/building/model'
import { buildSheet } from '../features/building/views/sheet'
import { planOverlay } from '../features/dimensioning/planOverlay'
import type { DimensioningMode } from '../features/dimensioning/types'
import { createExamplePlanProject, createLargeHouseProject } from '../features/documents/createProject'
import { buildIfc } from '../features/export/ifc'
import { buildMetresXlsx } from '../features/export/metresXlsx'
import { clientMetaLabels } from '../features/measurements/clientView'
import { measurementsToCsv, measurementsToFlatCsv, type CsvLabels } from '../features/measurements/csv'
import type { MetresVersion } from '../features/measurements/tables'
import { EXECUTION_LABELS } from '../i18n/dimensioningLabels'
import { fr } from '../i18n/fr'
import { fabricsToScene } from '../features/scene/migrate/fromFabrics'
import { settleScene } from '../features/scene/settle'
import { pascalLevelSymbols } from '../features/scene/view/levelPlanSymbols'
import { sceneToFabricsView } from '../features/scene/view/toFabricsView'
import type { Project, SectionLineElement } from '../types/document'

/** Date fixe : les fichiers ne doivent pas changer d'un jour à l'autre. */
const NOW = new Date('2026-11-17T00:00:00Z')
const DATE_TEXT = '17/11/2026'
const DIR = '../../baseline/fabrics'

let counter = 0
/** Identifiants reproductibles : les repères, GUID IFC et ordres de tri en dépendent. */
function resetIds() {
  counter = 0
}

beforeAll(() => {
  vi.spyOn(globalThis.crypto, 'randomUUID').mockImplementation(
    () => `00000000-0000-4000-8000-${String(++counter).padStart(12, '0')}` as `${string}-${string}-${string}-${string}-${string}`,
  )
})
afterAll(() => {
  vi.restoreAllMocks()
})

/** M18 (gate G1) : le même plan passé par la scène Pascal (plan → scène → chargement par Pascal, qui
 * reprend les pièces à l'axe des murs → vue calculée) doit produire exactement les mêmes fichiers. */
function viaPascalScene(create: (now: Date) => Project) {
  return (now: Date): Project => {
    const project = create(now)
    return { ...project, document: sceneToFabricsView(settleScene(fabricsToScene(project.document).scene)) }
  }
}

const FIXTURES: { key: string; route: string; create: (now: Date) => Project }[] = [
  { key: 'example', route: 'Fabrics', create: createExamplePlanProject },
  { key: 'large-house', route: 'Fabrics', create: createLargeHouseProject },
  { key: 'example', route: 'scène Pascal', create: viaPascalScene(createExamplePlanProject) },
  { key: 'large-house', route: 'scène Pascal', create: viaPascalScene(createLargeHouseProject) },
]

function json(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`
}

function csvLabels(version: MetresVersion): CsvLabels {
  const base = fr.measurements.csv
  return version === 'client' && base.meta
    ? { ...base, meta: clientMetaLabels(base.meta, fr.measurements.client) }
    : base
}

/** Contenu XML d'un classeur, fichier par fichier (le zip lui-même n'est pas comparé octet par octet). */
function xlsxText(bytes: Uint8Array): string {
  const files = unzipSync(bytes)
  return Object.keys(files)
    .sort()
    .map((name) => `=== ${name}\n${strFromU8(files[name])}\n`)
    .join('')
}

function sheetSvg(project: Project, mode: DimensioningMode): string {
  const doc = project.document
  const levels = doc.levels ?? []
  const sections = doc.elements.filter((el): el is SectionLineElement => el.type === 'section')
  // Comme l'écran Vues (ADR 0007) : escaliers et mobilier dessinés avec la géométrie de plan de Pascal.
  const scene = settleScene(fabricsToScene(doc).scene)
  const sheet = buildSheet({
    model: buildBuildingModel(doc),
    levels,
    sections: sections.map((s) => ({ points: s.points, lookLeft: s.lookLeft, label: s.label })),
    northAngle: doc.plan?.northAngle ?? 0,
    labels: { elevation: fr.views.elevation, section: fr.views.section, ridge: fr.views.ridge },
    levelOverlay: (level, font) =>
      planOverlay({ elements: doc.elements, levels }, level.id, mode, EXECUTION_LABELS, font),
    levelSymbols: (level) => pascalLevelSymbols(scene.nodes, level.id),
  })
  return `${renderToStaticMarkup(<ViewDrawing drawing={sheet.drawing} />)}\n`
}

describe.each(FIXTURES)('baseline $key ($route)', ({ key, create }) => {
  let project: Project
  const file = (name: string) => `${DIR}/${key}/${name}`

  beforeAll(() => {
    resetIds()
    project = create(NOW)
  })

  it('métrés du bâtiment (JSON)', async () => {
    const { building } = prepareMetres(project, { scope: 'building', includeFurniture: true, activeLevelId: null })
    await expect(json(building)).toMatchFileSnapshot(file('measurements.json'))
  })

  it.each<MetresVersion>(['client', 'execution'])('tableaux, CSV et XLSX %s', async (version) => {
    const { building, furniture } = prepareMetres(project, {
      scope: 'building',
      includeFurniture: version === 'execution',
      activeLevelId: null,
    })
    const tables = metresTables(building, furniture, version)
    await expect(json(tables)).toMatchFileSnapshot(file(`tables-${version}.json`))

    const labels = csvLabels(version)
    const csv = measurementsToCsv(building, labels, furniture, { projectName: project.name, date: DATE_TEXT }, tables)
    await expect(csv).toMatchFileSnapshot(file(`metres-${version}.csv`))
    if (version === 'execution') {
      await expect(measurementsToFlatCsv(building, labels, furniture)).toMatchFileSnapshot(file('metres-flat.csv'))
    }

    const m = labels.meta
    const bytes = buildMetresXlsx(
      tables,
      m && {
        title: m.title,
        rows: [
          [m.project, project.name],
          [m.date, DATE_TEXT],
          [m.app, m.appName],
          [m.units, m.unitsValue],
          [m.note, m.noteValue],
        ],
      },
      NOW.toISOString().replace(/\.\d+Z$/, 'Z'),
    )
    await expect(xlsxText(bytes)).toMatchFileSnapshot(file(`metres-${version}.xlsx.txt`))
  })

  it('export IFC', async () => {
    const ifc = buildIfc(project.document, {
      projectName: project.name,
      fileName: `${key}.ifc`,
      labels: fr.export.ifc,
      now: NOW,
    })
    expect(ifc).not.toBeNull()
    await expect(`${ifc}\n`).toMatchFileSnapshot(file('export.ifc'))
  })

  it.each<DimensioningMode>(['none', 'client', 'execution'])('planche SVG, cotation %s', async (mode) => {
    await expect(sheetSvg(project, mode)).toMatchFileSnapshot(file(`sheet-${mode}.svg`))
  })
})
