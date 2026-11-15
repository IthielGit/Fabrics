import { describe, expect, it } from 'vitest'
import {
  groupVersions,
  localDayKey,
  normalizeVersionName,
  previousVersionOf,
  relativeDay,
  rowToPerson,
  rowToVersion,
  versionPath,
  type ProjectVersion,
} from './versionsLogic'

/** Date ISO à partir d'une heure locale (les tests ne dépendent pas du fuseau de la machine). */
function at(day: number, hour: number, minute = 0): string {
  return new Date(2026, 10, day, hour, minute).toISOString()
}

function version(id: string, sessionId: string, start: string, end: string, extra: Partial<ProjectVersion> = {}) {
  return { id, sessionId, name: null, authors: [], startedAt: start, savedAt: end, ...extra }
}

describe('rowToVersion', () => {
  it('convertit une ligne de la table', () => {
    expect(
      rowToVersion({
        id: 'v1',
        session_id: 's1',
        name: null,
        authors: null,
        started_at: '2026-11-15T10:00:00Z',
        saved_at: '2026-11-15T10:02:00Z',
      }),
    ).toEqual({
      id: 'v1',
      sessionId: 's1',
      name: null,
      authors: [],
      startedAt: '2026-11-15T10:00:00Z',
      savedAt: '2026-11-15T10:02:00Z',
    })
  })

  it('un nom vide compte comme une version automatique', () => {
    const row = { id: 'v', session_id: 's', name: '  ', authors: [], started_at: '', saved_at: '' }
    expect(rowToVersion(row).name).toBeNull()
  })
})

describe('groupVersions', () => {
  const versions = [
    version('a1', 'A', at(14, 9, 0), at(14, 9, 2), { authors: ['alice'] }),
    version('a2', 'A', at(14, 9, 2), at(14, 9, 4), { authors: ['bruno', 'alice'] }),
    version('b1', 'B', at(15, 10, 0), at(15, 10, 2), { authors: ['bruno'] }),
    version('c1', 'C', at(15, 16, 0), at(15, 16, 1), { name: 'Envoyé au client', authors: ['alice'] }),
  ]

  it('range par jour puis par session, le plus récent d’abord', () => {
    const days = groupVersions(versions)
    expect(days.map((day) => day.key)).toEqual(['2026-11-15', '2026-11-14'])
    expect(days[0].sessions.map((session) => session.id)).toEqual(['C', 'B'])
    expect(days[1].sessions[0].versions.map((v) => v.id)).toEqual(['a2', 'a1'])
  })

  it('une session montre sa dernière étape, son début, sa fin et tous ses auteurs', () => {
    const session = groupVersions(versions)[1].sessions[0]
    expect(session.latest.id).toBe('a2')
    expect(session.startedAt).toBe(at(14, 9, 0))
    expect(session.savedAt).toBe(at(14, 9, 4))
    expect(session.authors).toEqual(['alice', 'bruno'])
  })

  it('peut ne garder que les versions nommées', () => {
    const days = groupVersions(versions, { namedOnly: true })
    expect(days).toHaveLength(1)
    expect(days[0].sessions.map((session) => session.latest.id)).toEqual(['c1'])
  })

  it('ne renvoie rien sans version', () => {
    expect(groupVersions([])).toEqual([])
  })

  it('une session à cheval sur minuit va au jour de sa dernière étape', () => {
    const days = groupVersions([
      version('n1', 'N', at(14, 23, 55), at(14, 23, 57)),
      version('n2', 'N', at(14, 23, 58), at(15, 0, 3)),
    ])
    expect(days.map((day) => day.key)).toEqual(['2026-11-15'])
    expect(days[0].sessions[0].versions).toHaveLength(2)
  })
})

describe('jours', () => {
  it('donne le jour local', () => {
    expect(localDayKey(at(5, 8))).toBe('2026-11-05')
  })

  it('reconnaît aujourd’hui et hier', () => {
    const now = new Date(2026, 10, 15, 12, 0)
    expect(relativeDay('2026-11-15', now)).toBe('today')
    expect(relativeDay('2026-11-14', now)).toBe('yesterday')
    expect(relativeDay('2026-11-13', now)).toBeNull()
  })
})

describe('normalizeVersionName', () => {
  it('retire les espaces et refuse un nom vide', () => {
    expect(normalizeVersionName('  Plan validé  ')).toBe('Plan validé')
    expect(normalizeVersionName('   ')).toBeNull()
  })

  it('coupe à 100 caractères', () => {
    expect(normalizeVersionName('x'.repeat(150))).toHaveLength(100)
  })
})

describe('rowToPerson', () => {
  it('garde le nom, une couleur stable et une photo https', () => {
    const person = rowToPerson(
      { user_id: 'u1', display_name: 'Alice', avatar_url: 'https://exemple.test/a.png' },
      'Participant',
    )
    expect(person).toMatchObject({ id: 'u1', name: 'Alice', avatarUrl: 'https://exemple.test/a.png' })
    expect(person.color).toMatch(/^#[0-9a-f]{6}$/i)
  })

  it('refuse une photo qui n’est pas en https et remplace un nom vide', () => {
    const person = rowToPerson({ user_id: 'u2', display_name: ' ', avatar_url: 'javascript:alert(1)' }, 'Participant')
    expect(person.name).toBe('Participant')
    expect(person.avatarUrl).toBeUndefined()
  })
})

describe('previousVersionOf', () => {
  const list = [
    version('v3', 'B', at(15, 10, 0), at(15, 10, 2)),
    version('v1', 'A', at(14, 9, 0), at(14, 9, 2)),
    version('v2', 'A', at(14, 9, 2), at(14, 9, 4)),
  ]

  it('donne la version juste avant dans le temps, quel que soit l’ordre de la liste', () => {
    expect(previousVersionOf(list, 'v3')?.id).toBe('v2')
    expect(previousVersionOf(list, 'v2')?.id).toBe('v1')
  })

  it('rien avant la première, ni pour une version inconnue', () => {
    expect(previousVersionOf(list, 'v1')).toBeNull()
    expect(previousVersionOf(list, 'inconnue')).toBeNull()
  })
})

describe('versionPath', () => {
  it('construit l’adresse de l’aperçu', () => {
    expect(versionPath('p1', 'v1')).toBe('/p/p1/versions/v1')
  })
})
