// Essai de bout en bout en local, sans compte Cloudflare ni Supabase :
//  1. un faux Supabase répond à `my_project_role` selon le jeton ;
//  2. `wrangler dev` lance le vrai Worker et le vrai Durable Object ;
//  3. des clients Yjs se connectent (éditeurs, lecteur, inconnu) et on vérifie les règles ;
//  4. on redémarre le serveur et on vérifie que le document est toujours là.
// Lancer depuis collab-server/ : `npm run smoke`.

import { spawn } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { createServer } from 'node:http'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import * as decoding from 'lib0/decoding'
import * as encoding from 'lib0/encoding'
import * as syncProtocol from 'y-protocols/sync'
import * as Y from 'yjs'

const SUPABASE_PORT = 54399
const WORKER_PORT = 8799
const PROJECT = '3f2b8c1e-4d5a-4b6c-8d7e-9f0a1b2c3d4e'
const TOKENS = { editor: 'edit.edit.edit', viewer: 'read.read.read', stranger: 'none.none.none' }
const persistDir = mkdtempSync(join(tmpdir(), 'fabrics-collab-'))

let failures = 0
function check(label, condition) {
  console.log(`${condition ? '✓' : '✗'} ${label}`)
  if (!condition) failures++
}
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// --- Faux Supabase -----------------------------------------------------------
const supabase = createServer((req, res) => {
  let body = ''
  req.on('data', (c) => (body += c))
  req.on('end', () => {
    const token = (req.headers.authorization ?? '').replace('Bearer ', '')
    const role = token === TOKENS.editor ? 'editor' : token === TOKENS.viewer ? 'viewer' : null
    const known = Object.values(TOKENS).includes(token)
    const okProject = JSON.parse(body || '{}').p_project_id === PROJECT
    res.writeHead(known ? 200 : 401, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(okProject ? role : null))
  })
})
await new Promise((resolve) => supabase.listen(SUPABASE_PORT, '127.0.0.1', resolve))

// --- Worker local ------------------------------------------------------------
function startWorker() {
  const command = [
    'npx wrangler dev', `--port ${WORKER_PORT}`, '--ip 127.0.0.1', `--persist-to "${persistDir}"`,
    `--var SUPABASE_URL:http://127.0.0.1:${SUPABASE_PORT}`, '--var SUPABASE_ANON_KEY:test',
  ].join(' ')
  const child = spawn(command, { shell: true, stdio: ['ignore', 'pipe', 'pipe'] })
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('wrangler dev ne démarre pas')), 90_000)
    const onData = (chunk) => {
      if (/Ready on/i.test(String(chunk))) {
        clearTimeout(timer)
        resolve(child)
      }
    }
    child.stdout.on('data', onData)
    child.stderr.on('data', onData)
  })
}
function stopWorker(child) {
  return new Promise((resolve) => {
    child.on('exit', resolve)
    if (process.platform === 'win32') spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'])
    else child.kill('SIGTERM')
  })
}

// --- Client Yjs minimal (même protocole que y-websocket) ---------------------
function connect(token) {
  const doc = new Y.Doc()
  const ws = new WebSocket(`ws://127.0.0.1:${WORKER_PORT}/room/${PROJECT}`, ['fabrics-collab', token])
  ws.binaryType = 'arraybuffer'
  const client = { doc, ws, synced: false, awareness: [], opened: false, failed: false }
  const send = (build) => {
    const encoder = encoding.createEncoder()
    build(encoder)
    if (ws.readyState === WebSocket.OPEN) ws.send(encoding.toUint8Array(encoder))
  }
  doc.on('update', (update, origin) => {
    if (origin !== 'remote') send((e) => { encoding.writeVarUint(e, 0); syncProtocol.writeUpdate(e, update) })
  })
  ws.addEventListener('open', () => {
    client.opened = true
    send((e) => { encoding.writeVarUint(e, 0); syncProtocol.writeSyncStep1(e, doc) })
  })
  ws.addEventListener('error', () => (client.failed = true))
  ws.addEventListener('message', (event) => {
    const decoder = decoding.createDecoder(new Uint8Array(event.data))
    const type = decoding.readVarUint(decoder)
    if (type === 0) {
      const encoder = encoding.createEncoder()
      encoding.writeVarUint(encoder, 0)
      const sub = syncProtocol.readSyncMessage(decoder, encoder, doc, 'remote')
      if (sub === syncProtocol.messageYjsSyncStep2) client.synced = true
      if (encoding.length(encoder) > 1) ws.send(encoding.toUint8Array(encoder))
    } else if (type === 1) {
      client.awareness.push(decoding.readVarUint8Array(decoder))
    }
  })
  client.sendAwareness = (clientId, clock, state) =>
    send((e) => {
      encoding.writeVarUint(e, 1)
      const inner = encoding.createEncoder()
      encoding.writeVarUint(inner, 1)
      encoding.writeVarUint(inner, clientId)
      encoding.writeVarUint(inner, clock)
      encoding.writeVarString(inner, JSON.stringify(state))
      encoding.writeVarUint8Array(e, encoding.toUint8Array(inner))
    })
  return client
}
const text = (client) => client.doc.getText('plan').toString()

let worker
try {
  worker = await startWorker()

  const alice = connect(TOKENS.editor)
  await wait(1500)
  check('un éditeur se connecte et se synchronise', alice.opened && alice.synced)
  alice.doc.getText('plan').insert(0, 'Mur 3500 mm')
  await wait(500)

  const reader = connect(TOKENS.viewer)
  await wait(1500)
  check('un lecteur se connecte et reçoit le document', reader.synced && text(reader) === 'Mur 3500 mm')

  reader.doc.getText('plan').insert(0, 'PIRATE ')
  alice.sendAwareness(1234, 1, { user: { name: 'Alice' } })
  await wait(800)
  check('la modification du lecteur n’atteint pas l’éditeur', text(alice) === 'Mur 3500 mm')
  check('la présence de l’éditeur atteint le lecteur', reader.awareness.length > 0)

  const bob = connect(TOKENS.editor)
  await wait(1500)
  check('un second éditeur reçoit la présence existante', bob.awareness.length > 0)
  check('le second éditeur reçoit le document sans la modification du lecteur', text(bob) === 'Mur 3500 mm')
  bob.doc.getText('plan').insert(text(bob).length, ', porte 930 mm')
  await wait(800)
  check('la modification d’un éditeur atteint les autres', text(alice) === 'Mur 3500 mm, porte 930 mm' && text(reader) === 'PIRATE Mur 3500 mm, porte 930 mm')

  const stranger = connect(TOKENS.stranger)
  const forged = connect('faux.faux.faux')
  await wait(1500)
  check('une personne sans rôle est refusée', !stranger.opened)
  check('un jeton invalide est refusé', !forged.opened)

  for (const c of [alice, reader, bob]) c.ws.close()
  await wait(500)
  await stopWorker(worker)

  worker = await startWorker()
  const late = connect(TOKENS.editor)
  await wait(2000)
  check('après redémarrage, le document est retrouvé', text(late) === 'Mur 3500 mm, porte 930 mm')
  late.ws.close()
} catch (error) {
  console.error(error)
  failures++
} finally {
  if (worker) await stopWorker(worker)
  supabase.close()
  rmSync(persistDir, { recursive: true, force: true })
}

console.log(failures === 0 ? '\nTout est bon.' : `\n${failures} vérification(s) en échec.`)
process.exit(failures === 0 ? 0 : 1)
