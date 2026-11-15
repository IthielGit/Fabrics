import { describe, expect, it } from 'vitest'
import { collabProtocols, collabRoomBase } from './collabUrl'

describe('collabRoomBase', () => {
  it('désactive la collaboration sans adresse valable', () => {
    expect(collabRoomBase(undefined)).toBeNull()
    expect(collabRoomBase('  ')).toBeNull()
    expect(collabRoomBase('xxx')).toBeNull()
    expect(collabRoomBase('ftp://exemple.org')).toBeNull()
  })

  it('passe en WebSocket sécurisé et ajoute /room', () => {
    expect(collabRoomBase('https://collab.exemple.workers.dev')).toBe('wss://collab.exemple.workers.dev/room')
    expect(collabRoomBase('https://collab.exemple.workers.dev/')).toBe('wss://collab.exemple.workers.dev/room')
    expect(collabRoomBase('wss://collab.exemple.workers.dev')).toBe('wss://collab.exemple.workers.dev/room')
    expect(collabRoomBase('http://localhost:8787')).toBe('ws://localhost:8787/room')
  })
})

describe('collabProtocols', () => {
  it('annonce le protocole puis le jeton', () => {
    expect(collabProtocols('abc')).toEqual(['fabrics-collab', 'abc'])
  })
})
