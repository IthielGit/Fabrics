import { afterEach, describe, expect, it } from 'vitest'
import { createPlanProject } from '../documents/createProject'
import { peekPendingRestore, setPendingRestore, takePendingRestore } from './pendingRestore'

afterEach(() => setPendingRestore(null))

describe('restauration en attente', () => {
  const restore = { projectId: 'p1', versionId: 'v1', document: createPlanProject('Essai').document, label: 'Essai' }

  it('ne sert que pour son projet', () => {
    setPendingRestore(restore)
    expect(peekPendingRestore('p2')).toBeNull()
    expect(takePendingRestore('p2')).toBeNull()
    expect(peekPendingRestore('p1')).toBe(restore)
  })

  it('ne s’applique qu’une fois', () => {
    setPendingRestore(restore)
    expect(takePendingRestore('p1')).toBe(restore)
    expect(takePendingRestore('p1')).toBeNull()
  })
})
