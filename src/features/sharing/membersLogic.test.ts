import { describe, expect, it } from 'vitest'
import {
  canEdit,
  inviteUrl,
  parseAcceptResponse,
  parseRole,
  rowToInvite,
  rowToMember,
  rowsToSharedProjects,
  type SharedProjectRow,
} from './membersLogic'

describe('canEdit', () => {
  it('autorise le propriétaire et les éditeurs, pas les lecteurs', () => {
    expect(canEdit('owner')).toBe(true)
    expect(canEdit('editor')).toBe(true)
    expect(canEdit('viewer')).toBe(false)
  })
})

describe('parseRole', () => {
  it('reconnaît les trois rôles', () => {
    expect(parseRole('owner')).toBe('owner')
    expect(parseRole('editor')).toBe('editor')
    expect(parseRole('viewer')).toBe('viewer')
  })

  it('traite tout le reste comme « aucun accès »', () => {
    expect(parseRole(null)).toBeNull()
    expect(parseRole(undefined)).toBeNull()
    expect(parseRole('admin')).toBeNull()
    expect(parseRole(42)).toBeNull()
  })
})

describe('rowToInvite', () => {
  const row = {
    id: 'i1',
    project_id: 'p1',
    token: 'abc',
    role: 'editor',
    active: true,
    expires_at: null,
    created_at: '2026-11-13T10:00:00Z',
  }

  it('convertit une ligne de la base', () => {
    expect(rowToInvite(row)).toEqual({
      id: 'i1',
      projectId: 'p1',
      token: 'abc',
      role: 'editor',
      active: true,
      expiresAt: null,
      createdAt: '2026-11-13T10:00:00Z',
    })
  })

  it('rabat un rôle inconnu sur « lecteur » (le plus prudent)', () => {
    expect(rowToInvite({ ...row, role: 'owner' }).role).toBe('viewer')
  })
})

describe('inviteUrl', () => {
  it('construit l’adresse /i/<jeton>', () => {
    expect(inviteUrl('https://fabrics.example', 'abc')).toBe('https://fabrics.example/i/abc')
  })
})

describe('rowToMember', () => {
  it('garde l’adresse e-mail, vide si absente', () => {
    const base = { user_id: 'u1', role: 'viewer', created_at: '2026-11-13T10:00:00Z' }
    expect(rowToMember({ ...base, email: 'a@b.be' }).email).toBe('a@b.be')
    expect(rowToMember({ ...base, email: null }).email).toBe('')
  })
})

describe('rowsToSharedProjects', () => {
  const row: SharedProjectRow = {
    id: 'p1',
    name: 'Maison',
    kind: 'plan',
    thumbnail_path: null,
    created_at: '2026-11-01T10:00:00Z',
    updated_at: '2026-11-12T10:00:00Z',
    role: 'editor',
  }

  it('convertit les lignes en résumés avec le rôle', () => {
    expect(rowsToSharedProjects([row])).toEqual([
      {
        id: 'p1',
        name: 'Maison',
        kind: 'plan',
        createdAt: '2026-11-01T10:00:00Z',
        updatedAt: '2026-11-12T10:00:00Z',
        role: 'editor',
      },
    ])
  })

  it('garde la miniature quand il y en a une', () => {
    const [summary] = rowsToSharedProjects([{ ...row, thumbnail_path: 'data:image/png;base64,xx' }])
    expect(summary.thumbnail).toBe('data:image/png;base64,xx')
  })

  it('ignore un type de projet inconnu', () => {
    expect(rowsToSharedProjects([{ ...row, kind: 'autre' }])).toEqual([])
  })
})

describe('parseAcceptResponse', () => {
  it('lit une invitation acceptée', () => {
    expect(parseAcceptResponse({ status: 'ok', project_id: 'p1', role: 'viewer' })).toEqual({
      status: 'ok',
      projectId: 'p1',
      role: 'viewer',
    })
  })

  it('lit le cas « déjà propriétaire »', () => {
    expect(parseAcceptResponse({ status: 'owner', project_id: 'p1' })).toEqual({
      status: 'owner',
      projectId: 'p1',
    })
  })

  it('traite tout le reste comme indisponible', () => {
    expect(parseAcceptResponse({ status: 'unavailable' })).toEqual({ status: 'unavailable' })
    expect(parseAcceptResponse(null)).toEqual({ status: 'unavailable' })
    expect(parseAcceptResponse('ok')).toEqual({ status: 'unavailable' })
    expect(parseAcceptResponse({ status: 'ok', project_id: 'p1', role: 'owner' })).toEqual({
      status: 'unavailable',
    })
    expect(parseAcceptResponse({ status: 'ok', role: 'viewer' })).toEqual({ status: 'unavailable' })
  })
})
