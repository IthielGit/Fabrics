import { describe, expect, it } from 'vitest'
import { createWallElement } from '../documents/elements'
import { applyWallFix, tJunctionAdjustments, wallIssues } from './wallContacts'

const wall = (points: number[], thickness = 200) => createWallElement('', points, thickness, 2700)

describe('raccords en T', () => {
  it('un mur qui se termine sur l’axe d’un autre entre d’une demi-épaisseur dans celui-ci', () => {
    const through = wall([0, 0, 6000, 0])
    const branch = wall([3000, 4000, 3000, 0])
    const adjustments = tJunctionAdjustments([through, branch])
    expect(adjustments.get(branch.id)).toEqual({ overlapArea: 200 * 100, hiddenFaces: 200, coveredFace: 0 })
    expect(adjustments.get(through.id)?.coveredFace).toBe(200)
  })

  it('un mur qui s’arrête sur la face de l’autre n’entre pas dedans, mais recouvre sa face', () => {
    const through = wall([0, 0, 6000, 0])
    const branch = wall([3000, 4000, 3000, 100])
    const adjustments = tJunctionAdjustments([through, branch])
    expect(adjustments.get(branch.id)?.overlapArea).toBe(0)
    expect(adjustments.get(through.id)?.coveredFace).toBe(200)
  })

  it('un mur qui s’arrête avant la face n’est pas un raccord', () => {
    const adjustments = tJunctionAdjustments([wall([0, 0, 6000, 0]), wall([3000, 4000, 3000, 130])])
    expect(adjustments.size).toBe(0)
  })

  it('un angle en L ne change rien (ses erreurs s’annulent déjà)', () => {
    expect(tJunctionAdjustments([wall([0, 0, 6000, 0]), wall([6000, 0, 6000, 4000])]).size).toBe(0)
  })

  it('un mur très éloigné qui s’en va dans l’autre sens n’est pas un raccord', () => {
    expect(tJunctionAdjustments([wall([0, 0, 6000, 0]), wall([3000, 1000, 3000, 4000])]).size).toBe(0)
  })

  it('un mur en biais n’est pas corrigé', () => {
    expect(tJunctionAdjustments([wall([0, 0, 6000, 0]), wall([3000, 3000, 3500, 0])]).size).toBe(0)
  })
})

describe('écarts entre murs', () => {
  it('deux murs en L à 5 mm l’un de l’autre : un écart, qui se corrige en joignant les bouts', () => {
    const a = wall([0, 0, 6000, 0])
    const b = wall([6005, 0, 6005, 4000])
    const issues = wallIssues([a, b])
    expect(issues).toHaveLength(1)
    const issue = issues[0]
    expect(issue.kind).toBe('wallGap')
    if (issue.kind !== 'wallGap') return
    expect(issue.gap).toBe(5)
    const fixed = applyWallFix(issue.wallId === a.id ? a : b, issue.fix)
    expect(wallIssues([fixed.id === a.id ? fixed : a, fixed.id === b.id ? fixed : b])).toEqual([])
  })

  it('un mur qui s’arrête à 30 mm de la face d’un autre : un écart, corrigé jusqu’à l’axe', () => {
    const through = wall([0, 0, 6000, 0])
    const branch = wall([3000, 4000, 3000, 130])
    const issues = wallIssues([through, branch])
    expect(issues).toHaveLength(1)
    const issue = issues[0]
    if (issue.kind !== 'wallGap') throw new Error('écart attendu')
    expect(issue.wallId).toBe(branch.id)
    expect(issue.gap).toBe(30)
    expect(issue.fix.to).toEqual({ x: 3000, y: 0 })
    expect(applyWallFix(branch, issue.fix).points).toEqual([3000, 4000, 3000, 0])
  })

  it('pas d’écart quand les murs se touchent, ou quand ils sont loin', () => {
    expect(wallIssues([wall([0, 0, 6000, 0]), wall([6000, 0, 6000, 4000])])).toEqual([])
    expect(wallIssues([wall([0, 0, 6000, 0]), wall([3000, 4000, 3000, 100])])).toEqual([])
    expect(wallIssues([wall([0, 0, 6000, 0]), wall([6200, 0, 6200, 4000])])).toEqual([])
  })

  it('deux murs parallèles voisins ne sont pas un écart', () => {
    expect(wallIssues([wall([0, 0, 6000, 0]), wall([0, 330, 6000, 330])])).toEqual([])
  })
})

describe('murs superposés', () => {
  it('deux murs alignés qui se recouvrent : un chevauchement, corrigé en les mettant bout à bout', () => {
    const a = wall([0, 0, 6000, 0])
    const b = wall([5000, 0, 8000, 0])
    const issues = wallIssues([a, b])
    expect(issues).toHaveLength(1)
    const issue = issues[0]
    if (issue.kind !== 'wallOverlap') throw new Error('chevauchement attendu')
    expect(issue.length).toBeCloseTo(1000)
    expect(issue.fix).toEqual({ wallId: b.id, pointIndex: 0, to: { x: 6000, y: 0 } })
    expect(wallIssues([a, applyWallFix(b, issue.fix!)])).toEqual([])
  })

  it('un mur entièrement dans un autre : signalé, sans correction automatique', () => {
    const issues = wallIssues([wall([0, 0, 6000, 0]), wall([1000, 0, 3000, 0])])
    expect(issues).toHaveLength(1)
    expect(issues[0].kind === 'wallOverlap' && issues[0].fix).toBeNull()
  })

  it('des murs qui se touchent bout à bout ne se chevauchent pas', () => {
    expect(wallIssues([wall([0, 0, 6000, 0]), wall([6000, 0, 9000, 0])])).toEqual([])
  })
})
