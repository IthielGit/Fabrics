import { describe, expect, it } from 'vitest'
import {
  dateInputToExpiry,
  expiryToDateInput,
  parseSharedResponse,
  rowToShare,
  shareStatus,
  shareUrl,
} from './shareLogic'

const NOW = new Date('2026-06-15T12:00:00.000Z')

describe('shareStatus', () => {
  it('actif sans limite, ou avant la limite', () => {
    expect(shareStatus({ active: true, expiresAt: null }, NOW)).toBe('active')
    expect(shareStatus({ active: true, expiresAt: '2026-07-01T00:00:00.000Z' }, NOW)).toBe('active')
  })
  it('expiré à partir de la date limite', () => {
    expect(shareStatus({ active: true, expiresAt: '2026-06-15T12:00:00.000Z' }, NOW)).toBe('expired')
    expect(shareStatus({ active: true, expiresAt: '2026-01-01T00:00:00.000Z' }, NOW)).toBe('expired')
  })
  it('désactivé même s’il n’est pas expiré, et prioritaire sur « expiré »', () => {
    expect(shareStatus({ active: false, expiresAt: null }, NOW)).toBe('disabled')
    expect(shareStatus({ active: false, expiresAt: '2026-01-01T00:00:00.000Z' }, NOW)).toBe('disabled')
  })
})

describe('adresse et lignes', () => {
  it('construit l’adresse du lien', () => {
    expect(shareUrl('https://exemple.pages.dev', 'abc')).toBe('https://exemple.pages.dev/s/abc')
  })
  it('convertit une ligne de la base', () => {
    expect(
      rowToShare({
        id: 'i',
        project_id: 'p',
        token: 't',
        active: true,
        has_password: true,
        expires_at: null,
        created_at: 'c',
      }),
    ).toEqual({ id: 'i', projectId: 'p', token: 't', active: true, hasPassword: true, expiresAt: null, createdAt: 'c' })
  })
})

describe('dates limites', () => {
  it('une date saisie court jusqu’à la fin de cette journée locale', () => {
    const iso = dateInputToExpiry('2026-12-31')
    expect(iso).not.toBeNull()
    const end = new Date(iso as string)
    expect([end.getFullYear(), end.getMonth(), end.getDate(), end.getHours(), end.getMinutes()]).toEqual([
      2026, 11, 31, 23, 59,
    ])
  })
  it('un champ vide ou invalide veut dire « sans limite »', () => {
    expect(dateInputToExpiry('')).toBeNull()
    expect(dateInputToExpiry('31/12/2026')).toBeNull()
  })
  it('revient au champ date', () => {
    expect(expiryToDateInput(dateInputToExpiry('2026-12-31'))).toBe('2026-12-31')
    expect(expiryToDateInput(null)).toBe('')
  })
})

describe('parseSharedResponse', () => {
  const document = { version: 4, unit: 'mm', page: {}, elements: [] }

  it('lit un projet partagé', () => {
    const result = parseSharedResponse({
      status: 'ok',
      project: { name: 'Maison', kind: 'plan', document, updated_at: '2026-06-01T00:00:00.000Z' },
    })
    expect(result.status).toBe('ok')
    if (result.status === 'ok') {
      expect(result.project.name).toBe('Maison')
      expect(result.project.kind).toBe('plan')
    }
  })
  it('transmet les demandes de mot de passe', () => {
    expect(parseSharedResponse({ status: 'password_required' })).toEqual({ status: 'password_required' })
    expect(parseSharedResponse({ status: 'wrong_password' })).toEqual({ status: 'wrong_password' })
  })
  it('traite tout le reste comme indisponible', () => {
    expect(parseSharedResponse(null)).toEqual({ status: 'unavailable' })
    expect(parseSharedResponse({ status: 'unavailable' })).toEqual({ status: 'unavailable' })
    expect(parseSharedResponse({ status: 'ok' })).toEqual({ status: 'unavailable' })
    expect(parseSharedResponse({ status: 'ok', project: { name: 'x', kind: 'autre', document } })).toEqual({
      status: 'unavailable',
    })
  })
  it('signale un document d’une version plus récente', () => {
    const result = parseSharedResponse({
      status: 'ok',
      project: { name: 'x', kind: 'plan', document: { ...document, version: 999 } },
    })
    expect(result).toEqual({ status: 'unsupported' })
  })
})
