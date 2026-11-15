import { describe, expect, it } from 'vitest'
import { isSaveLeader, saveLeaderId } from './saveLeader'

describe('saveLeaderId', () => {
  it('désigne le plus petit numéro de connexion', () => {
    expect(saveLeaderId([42, 7, 1000])).toBe(7)
  })

  it('ne désigne personne quand la salle est vide', () => {
    expect(saveLeaderId([])).toBeNull()
  })
})

describe('isSaveLeader', () => {
  it('est vrai pour celui qui a le plus petit numéro', () => {
    expect(isSaveLeader(7, [42, 7, 1000])).toBe(true)
    expect(isSaveLeader(42, [42, 7, 1000])).toBe(false)
  })

  it('est vrai quand on est seul, même sans être listé', () => {
    expect(isSaveLeader(5, [5])).toBe(true)
    expect(isSaveLeader(5, [])).toBe(true)
  })

  it("change de main quand l'enregistreur quitte la salle", () => {
    expect(isSaveLeader(42, [42, 1000])).toBe(true)
  })
})
