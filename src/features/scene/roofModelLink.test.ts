/**
 * M20 20.1b tâche 6 — lien au modèle du plan de toiture : changer la pente ou le débord des pans dans
 * Pascal met à jour le plan de toiture (flèches, contour, cotes) et les métrés, sans autre action ; le
 * plan de toiture n'est jamais enregistré à part de la scène. Exemple ROOMIT (RDC + R+1).
 */
import { describe, expect, it } from 'vitest'
import rdc from '../../../fixtures/ROOMIT-RDC/spec.json'
import r1 from '../../../fixtures/ROOMIT-R1/spec.json'
import { roofChains } from '../dimensioning/roofChains'
import { fixtureBuildingScene, type FixtureSpec } from './fixturePlan'
import type { PlanScene, SceneNodeData } from './sceneTypes'
import { settleScene } from './settle'
import { toStoredDocument } from './storedScene'
import { pascalRoofPlan } from './view/roofPlanData'
import { sceneToFabricsView } from './view/toFabricsView'

const base = fixtureBuildingScene([rdc, r1] as unknown as FixtureSpec[])

/** Geste dans Pascal sur tous les pans : nouvelle pente (%) et nouveau débord (m), puis Pascal reprend la scène. */
function editedInPascal(scene: PlanScene, slopePercent: number, overhang: number): PlanScene {
  const nodes: Record<string, SceneNodeData> = { ...scene.nodes }
  const pitch = (Math.atan(slopePercent / 100) * 180) / Math.PI
  for (const n of Object.values(nodes)) {
    if (n.type !== 'roof-segment') continue
    nodes[n.id] = { ...n, pitch, overhang: overhang / Math.cos((pitch * Math.PI) / 180), gableOverhang: overhang } as SceneNodeData
  }
  return settleScene({ ...scene, nodes })
}

const topTotal = (scene: PlanScene) => {
  const d = roofChains(pascalRoofPlan(scene.nodes, 'R1')!.outlines).find((x) => x.id === 'roof-top-total')!
  return Math.round(d.points[2] - d.points[0])
}

describe('plan de toiture lié au modèle (ROOMIT)', () => {
  it('pente 1 % → 2 % : les flèches affichent la nouvelle pente', () => {
    expect(pascalRoofPlan(base.nodes, 'R1')!.slopes.map((s) => Math.round(s.percent * 100) / 100)).toEqual([1, 1])
    const edited = editedInPascal(base, 2, 0.3)
    expect(pascalRoofPlan(edited.nodes, 'R1')!.slopes.map((s) => Math.round(s.percent * 100) / 100)).toEqual([2, 2])
  })

  it('débord 300 → 400 mm : contour, cote d’ensemble (15072 → 15272 mm) et surface en plan suivent', () => {
    expect(topTotal(base)).toBe(15072)
    const edited = editedInPascal(base, 1, 0.4)
    expect(topTotal(edited)).toBe(15272)
    const plan = (scene: PlanScene) => sceneToFabricsView(scene).pascalQuantities!.roofs.reduce((s, r) => s + r.projectedArea, 0)
    expect(plan(edited)).toBeGreaterThan(plan(base))
  })

  it('le projet enregistré ne contient que la scène : aucun plan de toiture gardé à part', () => {
    const stored = JSON.stringify(toStoredDocument({ kind: 'plan', document: sceneToFabricsView(base), scene: base } as never))
    expect(stored).not.toContain('Pente')
    expect(stored).not.toContain('roof-top')
  })
})
