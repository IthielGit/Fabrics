import { describe, expect, it } from 'vitest'
import { lookupRole, parseRole, parseRoomPath, readTokenFromProtocols, SUBPROTOCOL } from './auth'

const ID = '3f2b8c1e-4d5a-4b6c-8d7e-9f0a1b2c3d4e'
const TOKEN = 'aaa.bbb-_.ccc'
const CONFIG = { url: 'https://exemple.supabase.co/', anonKey: 'anon' }

describe('parseRoomPath', () => {
  it('lit l’identifiant du projet', () => {
    expect(parseRoomPath(`/room/${ID}`)).toBe(ID)
    expect(parseRoomPath(`/room/${ID.toUpperCase()}/`)).toBe(ID)
  })
  it('refuse tout le reste', () => {
    expect(parseRoomPath('/room/abc')).toBeNull()
    expect(parseRoomPath(`/room/${ID}/x`)).toBeNull()
    expect(parseRoomPath(`/salle/${ID}`)).toBeNull()
  })
})

describe('readTokenFromProtocols', () => {
  it('lit le jeton après le sous-protocole', () => {
    expect(readTokenFromProtocols(`${SUBPROTOCOL}, ${TOKEN}`)).toBe(TOKEN)
  })
  it('refuse un en-tête absent, mal formé ou un autre protocole', () => {
    expect(readTokenFromProtocols(null)).toBeNull()
    expect(readTokenFromProtocols(SUBPROTOCOL)).toBeNull()
    expect(readTokenFromProtocols(`autre, ${TOKEN}`)).toBeNull()
    expect(readTokenFromProtocols(`${SUBPROTOCOL}, pas un jeton`)).toBeNull()
  })
})

describe('parseRole', () => {
  it('accepte les trois rôles seulement', () => {
    expect(parseRole('owner')).toBe('owner')
    expect(parseRole('editor')).toBe('editor')
    expect(parseRole('viewer')).toBe('viewer')
    expect(parseRole(null)).toBeNull()
    expect(parseRole('admin')).toBeNull()
  })
})

function fakeFetch(status: number, body: unknown, calls: { url: string; init?: RequestInit }[] = []) {
  return (async (url: string, init?: RequestInit) => {
    calls.push({ url, init })
    return new Response(JSON.stringify(body), { status })
  }) as unknown as typeof fetch
}

describe('lookupRole', () => {
  it('interroge my_project_role avec le jeton et la clé anon', async () => {
    const calls: { url: string; init?: RequestInit }[] = []
    const result = await lookupRole(CONFIG, TOKEN, ID, fakeFetch(200, 'editor', calls))
    expect(result).toEqual({ ok: true, role: 'editor' })
    expect(calls[0].url).toBe('https://exemple.supabase.co/rest/v1/rpc/my_project_role')
    const headers = calls[0].init?.headers as Record<string, string>
    expect(headers.Authorization).toBe(`Bearer ${TOKEN}`)
    expect(headers.apikey).toBe('anon')
    expect(JSON.parse(String(calls[0].init?.body))).toEqual({ p_project_id: ID })
  })
  it('403 quand la personne n’a aucun rôle', async () => {
    expect(await lookupRole(CONFIG, TOKEN, ID, fakeFetch(200, null))).toEqual({ ok: false, status: 403 })
  })
  it('401 quand Supabase refuse le jeton', async () => {
    expect(await lookupRole(CONFIG, TOKEN, ID, fakeFetch(401, {}))).toEqual({ ok: false, status: 401 })
  })
  it('502 quand Supabase est en erreur ou injoignable', async () => {
    expect(await lookupRole(CONFIG, TOKEN, ID, fakeFetch(500, {}))).toEqual({ ok: false, status: 502 })
    const failing = (async () => {
      throw new Error('réseau')
    }) as unknown as typeof fetch
    expect(await lookupRole(CONFIG, TOKEN, ID, failing)).toEqual({ ok: false, status: 502 })
  })
})
