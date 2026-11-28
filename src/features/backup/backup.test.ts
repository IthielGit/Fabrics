/**
 * M24, 24.3 — sauvegarde puis restauration : mêmes métrés et même DQE au dixième d'Ariary ; un
 * non-admin ne trouve aucun prix dans sa sauvegarde ; un fichier abîmé ou étranger est refusé.
 */
import { strToU8, unzipSync, zipSync } from 'fflate'
import { describe, expect, it } from 'vitest'
import type { Project } from '../../types/document'
import { computeBuildingMeasurements } from '../measurements/measurements'
import { freezeEstimate, type EstimateVersion } from '../pricing/estimateVersions'
import type { WorkItem } from '../pricing/model'
import { projectEstimate } from '../pricing/projectEstimate'
import { EMPTY_FILTER, type PricingRule } from '../pricing/rules'
import { house01 } from '../scene/migrate/fixtureDocuments'
import { fabricsToScene } from '../scene/migrate/fromFabrics'
import { settleScene } from '../scene/settle'
import { sceneToFabricsView } from '../scene/view/toFabricsView'
import { backupEstimate, backupFileName, buildBackup, readBackup, restoredProject, type BackupEstimate } from './backup'

const NOW = new Date('2026-11-28T10:00:00Z')

function planProject(): Project {
  const scene = settleScene(fabricsToScene(house01()).scene)
  return { id: 'p1', name: 'HOUSE-01', kind: 'plan', document: sceneToFabricsView(scene), scene, createdAt: NOW.toISOString(), updatedAt: NOW.toISOString() }
}

const work: WorkItem = { id: 'MAC', libraryId: 'lib', code: 'MAC', category: 'Gros œuvre', designation: 'Maçonnerie', unit: 'm²', priceHt: 450000n, referencePrice: null, sourceCoefficient: '', output: '', components: [], sourceRow: '', sourceKey: '', updatedByEmail: '', updatedAt: '' }
const rule: PricingRule = { id: 'r', libraryId: 'lib', name: 'murs', quantityCode: 'wall.netArea', filter: EMPTY_FILTER, workItemId: 'MAC', wasteBp: 0, enabled: true, position: 0, updatedByEmail: '', updatedAt: '' }
const SETTINGS = { a1Bp: 500, a2Bp: 500, a3Bp: 0, vatRateBp: 2000 }

const estimateOf = (project: Project) =>
  projectEstimate({ document: project.document, scene: project.scene ?? null, rules: [rule], workItems: [work], settings: SETTINGS }).estimate

function estimatePart(project: Project, withPrices: boolean): BackupEstimate {
  const version: EstimateVersion = { id: 'v1', number: 1, status: 'draft', libraryVersion: 1, fingerprint: 'f', snapshot: freezeEstimate(estimateOf(project)), createdByEmail: 'a@test', createdAt: NOW.toISOString(), note: '' }
  return backupEstimate({ libraryId: 'lib', workspaceName: 'Entreprise', withPrices, record: null, versions: [version] })
}

describe('sauvegarde .fabrics (D24-3)', () => {
  it('sauvegarde puis restauration : mêmes métrés et même DQE au dixième d’Ariary', async () => {
    const project = planProject()
    const bytes = await buildBackup({ project, estimate: estimatePart(project, true), assets: { img1: new Uint8Array([1, 2, 3]) } }, NOW)
    const read = await readBackup(bytes)
    if (!read.ok) throw new Error(read.reason)
    expect(computeBuildingMeasurements(read.project.document).total.totals).toEqual(computeBuildingMeasurements(project.document).total.totals)
    const before = estimateOf(project)
    const after = estimateOf(read.project)
    expect([after.totalHt, after.vat, after.totalTtc]).toEqual([before.totalHt, before.vat, before.totalTtc])
    expect(before.totalHt).toBeGreaterThan(0n)
    expect(read.estimate?.versions[0].snapshot.totalHt).toBe(before.totalHt.toString())
    expect(read.assets).toEqual({ img1: new Uint8Array([1, 2, 3]) })
  })

  it('un non-admin ne trouve aucun prix ni montant dans sa sauvegarde ; quantités et postes gardés', async () => {
    const project = planProject()
    const bytes = await buildBackup({ project, estimate: estimatePart(project, false), assets: {} }, NOW)
    const text = new TextDecoder().decode(unzipSync(bytes)['estimate.json'])
    const snapshot = JSON.parse(text).versions[0].snapshot
    expect(snapshot.lines.length).toBeGreaterThan(0)
    for (const line of snapshot.lines) {
      expect([line.unitPriceHt, line.salePriceHt, line.amountHt]).toEqual([null, null, null])
      expect(line.quantity).not.toBe('')
    }
    expect([snapshot.totalHt, snapshot.vat, snapshot.totalTtc, snapshot.debours]).toEqual(['', '', '', ''])
    expect(text).not.toContain('450000')
  })

  it('restaurer crée toujours une copie : nouvel identifiant, nom daté', () => {
    const project = planProject()
    const copy = restoredProject(project, new Date(2026, 10, 28, 12))
    expect(copy.id).not.toBe(project.id)
    expect(copy.name).toBe('HOUSE-01 (restauré le 28/11/2026)')
    expect(copy.scene).toBe(project.scene)
    expect(backupFileName('Maison: R+1', NOW)).toBe('Maison R+1 - sauvegarde 2026-11-28.fabrics')
  })

  it('un fichier abîmé, étranger, modifié ou d’une version future est refusé', async () => {
    const project = planProject()
    const good = await buildBackup({ project, estimate: null, assets: {} }, NOW)
    expect((await readBackup(new Uint8Array([0x89, 0x50, 0x4e, 0x47]))).ok).toBe(false)
    expect(await readBackup(zipSync({ 'a.txt': strToU8('x') }))).toEqual({ ok: false, reason: 'notBackup' })
    // Projet modifié à la main après la sauvegarde : l'empreinte ne correspond plus.
    const files = unzipSync(good)
    files['project.json'] = strToU8(new TextDecoder().decode(files['project.json']).replace('HOUSE-01', 'Pirate'))
    expect(await readBackup(zipSync(files))).toEqual({ ok: false, reason: 'damaged' })
    const future = unzipSync(good)
    const manifest = JSON.parse(new TextDecoder().decode(future['manifest.json']))
    future['manifest.json'] = strToU8(JSON.stringify({ ...manifest, version: 99 }))
    expect(await readBackup(zipSync(future))).toEqual({ ok: false, reason: 'newerVersion' })
    expect(await readBackup(good.subarray(0, good.length - 40))).toEqual({ ok: false, reason: 'damaged' })
  })
})
