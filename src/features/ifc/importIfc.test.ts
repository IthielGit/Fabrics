/**
 * M22, 22.4 : import IFC contrôlé. La conversion de Pascal (web-ifc) est lancée pour de vrai ; le
 * bilan dit ce que chaque objet du fichier est devenu, sans rien laisser disparaître en silence.
 */
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import type { FabricsDocument } from '../../types/document'
import { createLargeHouseProject } from '../documents/createProject'
import { house01, house02 } from '../scene/migrate/fixtureDocuments'
import { fabricsToScene } from '../scene/migrate/fromFabrics'
import { settleScene } from '../scene/settle'
import { buildFabricsIfc } from './exportIfc'
import { importedPlanProject, importIfc } from './importIfc'
import { decodeStepString, importReportHasIssues, importReportSections, stepArguments } from './importReport'
import { fr } from '../../i18n/fr'

const WASM = `${process.cwd()}/packages/pascal/node_modules/web-ifc/`.split(String.fromCharCode(92)).join('/')
const FIXTURES = 'packages/pascal/packages/ifc-converter/tests/fixtures'
const encode = (text: string) => new TextEncoder().encode(text)

describe('lecture du texte STEP', () => {
  it('décode les textes (apostrophes doublées, accents en X2)', () => {
    const b = String.fromCharCode(92)
    expect(decodeStepString(`l''entr${b}X2${b}00E9${b}X0${b}e`)).toBe("l'entrée")
  })

  it('sépare les attributs de premier niveau', () => {
    const text = "#1=IFCWALL('2O2Fr$t4X7Zf8NOew3FLOH',#2,'Mur, nord',$,(#3,#4),'it''s');"
    expect(stepArguments(text, text.indexOf('(') + 1)).toEqual(["'2O2Fr$t4X7Zf8NOew3FLOH'", '#2', "'Mur, nord'", '$', '(#3,#4)', "'it''s'"])
  })
})

const SETS: [string, () => FabricsDocument][] = [
  ['HOUSE-01', house01],
  ['HOUSE-02', house02],
  ['grande maison', () => createLargeHouseProject(new Date('2026-11-17T00:00:00Z')).document],
]

describe.each(SETS)('aller-retour Fabrics → IFC → Fabrics : %s', (_name, create) => {
  it('chaque objet exporté revient comme élément de plan, rien ne manque', async () => {
    const scene = settleScene(fabricsToScene(create()).scene)
    const { ifc, summary } = buildFabricsIfc(scene, { projectName: 'Essai', labels: { levelSlab: 'Dalle' } })
    const { report, scene: imported } = await importIfc(encode(ifc), { wasmPath: WASM })
    expect(report.missing).toEqual([])
    expect(report.shapeOnly).toEqual([])
    const exported = Object.values(summary.products).flat().map((p) => p.globalId).sort()
    expect(report.native.map((o) => o.globalId).sort()).toEqual(exported)
    expect(report.filledOpenings).toBe(Object.values(summary.products).flat().filter((p) => p.entity === 'IFCDOOR' || p.entity === 'IFCWINDOW').length)
    expect(importReportHasIssues(report)).toBe(false)
    // Le projet importé est un nouveau projet Plan dont la scène est la source.
    const project = importedPlanProject('Import', imported)
    expect(project.kind).toBe('plan')
    expect(project.scene).toBe(imported)
    expect(project.document.levels?.length).toBe(scene && Object.values(scene.nodes).filter((n) => n.type === 'level').length)
  }, 60000)
})

describe('fichiers d’autres logiciels (essais de Pascal)', () => {
  it('poutres : reprises avec leur seule forme ; l’assemblage qui les groupe est signalé', async () => {
    const { report } = await importIfc(new Uint8Array(readFileSync(`${FIXTURES}/beams.ifc`)), { wasmPath: WASM })
    expect(report.shapeOnly.map((o) => o.entity).sort()).toEqual(['IFCBEAM', 'IFCBEAMSTANDARDCASE'])
    expect(report.missing.map((o) => o.entity)).toEqual(['IFCELEMENTASSEMBLY'])
    expect(importReportHasIssues(report)).toBe(true)
  }, 60000)

  it('murs, porte, dalle repris ; percement compté avec sa porte ; objet générique en forme seule', async () => {
    const { report } = await importIfc(new Uint8Array(readFileSync(`${FIXTURES}/handedness.ifc`)), { wasmPath: WASM })
    expect(report.native.map((o) => o.entity)).toEqual(expect.arrayContaining(['IFCWALLSTANDARDCASE', 'IFCDOOR', 'IFCSLAB']))
    expect(report.filledOpenings).toBe(1)
    expect(report.shapeOnly.map((o) => o.entity)).toEqual(['IFCBUILDINGELEMENTPROXY'])
    expect(report.missing).toEqual([])
  }, 60000)

  it('un objet que la conversion ne connaît pas est listé, avec sa classe, son nom et son GlobalId', async () => {
    const scene = settleScene(fabricsToScene(house01()).scene)
    const { ifc } = buildFabricsIfc(scene, { projectName: 'Essai', labels: { levelSlab: 'Dalle' } })
    const extra = "#999999=IFCSANITARYTERMINAL('1AbCdEfGhIjKlMnOpQrStU',$,'Lavabo',$,$,$,$,$,$);\n"
    const text = ifc.replace('ENDSEC;\nEND-ISO', `${extra}ENDSEC;\nEND-ISO`)
    expect(text).toContain('Lavabo')
    const { report } = await importIfc(encode(text), { wasmPath: WASM })
    expect(report.missing).toEqual([{ globalId: '1AbCdEfGhIjKlMnOpQrStU', entity: 'IFCSANITARYTERMINAL', name: 'Lavabo' }])
    const sections = importReportSections(report, fr.importIfc)
    expect(sections.some((s) => s.tone === 'warning' && s.items.some((i) => i.includes('Lavabo') && i.includes('1AbCdEfGhIjKlMnOpQrStU')))).toBe(true)
  }, 60000)
})
