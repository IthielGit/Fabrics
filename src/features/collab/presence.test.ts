import { describe, expect, it } from 'vitest'
import {
  colorForUser,
  initialsOf,
  listPeers,
  MAX_SELECTION,
  parsePresence,
  safeAvatarUrl,
  uniqueUsers,
  userFromAccount,
} from './presence'

const valid = {
  user: { id: 'u1', name: 'Marie', color: '#4f46e5' },
  cursor: { x: 10, y: 20 },
  levelId: 'n1',
  selection: ['a', 'b'],
}

describe('userFromAccount', () => {
  it('préfère le nom du compte (Google…) et sa photo', () => {
    const user = userFromAccount(
      {
        id: 'u1',
        email: 'marie@exemple.be',
        user_metadata: { full_name: 'Marie Dupont', avatar_url: 'https://lh3.googleusercontent.com/a/x' },
      },
      'Invité',
    )
    expect(user.name).toBe('Marie Dupont')
    expect(user.avatarUrl).toBe('https://lh3.googleusercontent.com/a/x')
  })

  it('accepte aussi `name` et `picture`', () => {
    const user = userFromAccount(
      { id: 'u1', user_metadata: { name: 'Paul', picture: 'https://exemple.be/p.png' } },
      'Invité',
    )
    expect(user.name).toBe('Paul')
    expect(user.avatarUrl).toBe('https://exemple.be/p.png')
  })

  it('sans nom : la partie de l’e-mail avant le @, jamais l’adresse complète', () => {
    const user = userFromAccount({ id: 'u1', email: 'marie@exemple.be' }, 'Invité')
    expect(user.name).toBe('marie')
    expect(JSON.stringify(user)).not.toContain('exemple.be')
  })

  it('sans rien : le nom de secours', () => {
    expect(userFromAccount({ id: 'u1' }, 'Invité').name).toBe('Invité')
  })

  it('refuse une photo qui n’est pas en https', () => {
    const user = userFromAccount({ id: 'u1', user_metadata: { avatar_url: 'http://exemple.be/p.png' } }, 'x')
    expect(user.avatarUrl).toBeUndefined()
  })
})

describe('safeAvatarUrl', () => {
  it('refuse les schémas dangereux et les valeurs étranges', () => {
    expect(safeAvatarUrl('javascript:alert(1)')).toBeUndefined()
    expect(safeAvatarUrl('data:image/png;base64,AAAA')).toBeUndefined()
    expect(safeAvatarUrl(42)).toBeUndefined()
    expect(safeAvatarUrl('pas une adresse')).toBeUndefined()
  })
})

describe('colorForUser', () => {
  it('est stable et au format #rrggbb', () => {
    expect(colorForUser('abc')).toBe(colorForUser('abc'))
    expect(colorForUser('abc')).toMatch(/^#[0-9a-f]{6}$/i)
  })
})

describe('initialsOf', () => {
  it('prend deux initiales', () => {
    expect(initialsOf('Marie Dupont')).toBe('MD')
    expect(initialsOf('marie')).toBe('MA')
    expect(initialsOf('jean.paul')).toBe('JP')
    expect(initialsOf('  ')).toBe('?')
  })
})

describe('parsePresence', () => {
  it('lit un état valide', () => {
    expect(parsePresence(valid)).toEqual({
      user: { id: 'u1', name: 'Marie', color: '#4f46e5', avatarUrl: undefined },
      cursor: { x: 10, y: 20 },
      levelId: 'n1',
      selection: ['a', 'b'],
    })
  })

  it('refuse ce qui n’est pas un état', () => {
    expect(parsePresence(null)).toBeNull()
    expect(parsePresence('x')).toBeNull()
    expect(parsePresence({})).toBeNull()
    expect(parsePresence({ user: { id: '', name: 'A' } })).toBeNull()
    expect(parsePresence({ user: { id: 'u', name: '  ' } })).toBeNull()
  })

  it('remplace une couleur invalide par celle du compte', () => {
    const state = parsePresence({ ...valid, user: { id: 'u1', name: 'M', color: 'red;background:url(x)' } })
    expect(state?.user.color).toBe(colorForUser('u1'))
  })

  it('ignore un curseur invalide ou hors bornes', () => {
    expect(parsePresence({ ...valid, cursor: { x: NaN, y: 1 } })?.cursor).toBeNull()
    expect(parsePresence({ ...valid, cursor: { x: 1e12, y: 1 } })?.cursor).toBeNull()
    expect(parsePresence({ ...valid, cursor: null })?.cursor).toBeNull()
  })

  it('borne la sélection et ne garde que des textes', () => {
    const many = Array.from({ length: MAX_SELECTION + 50 }, (_, i) => `e${i}`)
    expect(parsePresence({ ...valid, selection: many })?.selection).toHaveLength(MAX_SELECTION)
    expect(parsePresence({ ...valid, selection: ['a', 3, null, ''] })?.selection).toEqual(['a'])
    expect(parsePresence({ ...valid, selection: 'a' })?.selection).toEqual([])
  })

  it('coupe un nom trop long', () => {
    const state = parsePresence({ ...valid, user: { id: 'u1', name: 'x'.repeat(500) } })
    expect(state?.user.name).toHaveLength(60)
  })
})

describe('listPeers / uniqueUsers', () => {
  const other = { ...valid, user: { id: 'u2', name: 'Paul', color: '#db2777' } }

  it('écarte moi-même et les états invalides, dans un ordre stable', () => {
    const states = new Map<number, unknown>([
      [7, other],
      [1, valid],
      [3, { nope: true }],
    ])
    expect(listPeers(states, 1).map((peer) => peer.clientId)).toEqual([7])
  })

  it('ne compte qu’une fois un compte ouvert dans deux onglets, et pas moi', () => {
    const states = new Map<number, unknown>([
      [1, valid],
      [2, valid], // mon autre onglet
      [3, other],
      [4, other], // son autre onglet
    ])
    const peers = listPeers(states, 1)
    expect(uniqueUsers(peers, 'u1').map((user) => user.id)).toEqual(['u2'])
  })
})
