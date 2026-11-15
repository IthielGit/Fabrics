import { describe, expect, it, vi } from 'vitest'
import { createPlanProject } from '../documents/createProject'
import { forgetCreated, peekCreated, rememberCreated } from './justCreated'

describe('justCreated', () => {
  it('rend le projet créé pour son identifiant seulement', () => {
    const project = createPlanProject('Plan')
    rememberCreated(project)
    expect(peekCreated(project.id)).toBe(project)
    expect(peekCreated('autre')).toBeNull()
  })

  it("l'oublie au tour suivant, pas tout de suite (mode strict de React)", () => {
    vi.useFakeTimers()
    const project = createPlanProject('Plan')
    rememberCreated(project)
    forgetCreated(project.id)
    expect(peekCreated(project.id)).toBe(project)
    vi.runAllTimers()
    expect(peekCreated(project.id)).toBeNull()
    vi.useRealTimers()
  })
})
