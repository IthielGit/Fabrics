// Contrôle de sécurité Supabase (jalon M13, lot F) : deux comptes, un visiteur anonyme.
//
// Lancement (deux comptes de TEST déjà créés et confirmés dans l'application) :
//   npm run check:security
// avec les variables TEST_A_EMAIL, TEST_A_PASSWORD, TEST_B_EMAIL, TEST_B_PASSWORD.
// Le script ne touche qu'à ce qu'il crée (un projet « __test_securite__ », une image, un lien)
// et supprime tout à la fin. Il ne s'exécute jamais avec `npm test`.

import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'node:crypto'

const { VITE_SUPABASE_URL: url, VITE_SUPABASE_ANON_KEY: key } = process.env
const { TEST_A_EMAIL, TEST_A_PASSWORD, TEST_B_EMAIL, TEST_B_PASSWORD } = process.env

if (!url || !key || !TEST_A_EMAIL || !TEST_A_PASSWORD || !TEST_B_EMAIL || !TEST_B_PASSWORD) {
  console.error(
    'Variables manquantes : VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY (fichier .env.local) et ' +
      'TEST_A_EMAIL, TEST_A_PASSWORD, TEST_B_EMAIL, TEST_B_PASSWORD.',
  )
  process.exit(2)
}
if (TEST_A_EMAIL.toLowerCase() === TEST_B_EMAIL.toLowerCase()) {
  console.error('Les comptes A et B doivent être différents.')
  process.exit(2)
}

const newClient = () => createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })

async function login(email, password) {
  const client = newClient()
  const { data, error } = await client.auth.signInWithPassword({ email, password })
  if (error) throw new Error(`Connexion impossible pour ${email} : ${error.message}`)
  return { client, user: data.user }
}

let failures = 0
let total = 0
async function check(label, run) {
  total += 1
  try {
    const ok = await run()
    if (ok === true) {
      console.log(`  ✓ ${label}`)
    } else {
      failures += 1
      console.log(`  ✗ ${label}`)
    }
  } catch (error) {
    failures += 1
    console.log(`  ✗ ${label} (erreur : ${error instanceof Error ? error.message : error})`)
  }
}

const emptyDocument = {
  version: 4,
  unit: 'mm',
  page: { width: 10000, height: 10000, background: '#ffffff' },
  elements: [],
}

const a = await login(TEST_A_EMAIL, TEST_A_PASSWORD)
const b = await login(TEST_B_EMAIL, TEST_B_PASSWORD)
if (a.user.id === b.user.id) {
  console.error('Les comptes A et B sont le même compte.')
  process.exit(2)
}
const anon = newClient()

const projectId = randomUUID()
const assetPath = `${a.user.id}/${randomUUID()}`
let shareId = null
let token = null

try {
  console.log('\nPréparation (compte A) : un projet, une image, un lien protégé par mot de passe')
  const insert = await a.client
    .from('projects')
    .insert({ id: projectId, name: '__test_securite__', kind: 'plan', document: emptyDocument })
  if (insert.error) throw new Error(`Création du projet de test : ${insert.error.message}`)
  const upload = await a.client.storage.from('assets').upload(assetPath, new Blob(['secret']), {
    contentType: 'text/plain',
  })
  if (upload.error) throw new Error(`Envoi de l'image de test : ${upload.error.message}`)
  const created = await a.client.rpc('create_share', {
    p_project_id: projectId,
    p_password: 'motdepasse-de-test',
    p_expires_at: null,
  })
  if (created.error) throw new Error(`Création du lien de test : ${created.error.message}`)
  shareId = created.data.id
  token = created.data.token

  console.log('\nCompte A (propriétaire)')
  await check('relit son projet', async () => {
    const { data } = await a.client.from('projects').select('name').eq('id', projectId)
    return data?.length === 1 && data[0].name === '__test_securite__'
  })
  await check('voit son lien, mais ne peut pas lire le mot de passe haché', async () => {
    const own = await a.client.from('shares').select('id, has_password').eq('id', shareId)
    const hash = await a.client.from('shares').select('password_hash').eq('id', shareId)
    return own.data?.length === 1 && own.data[0].has_password === true && hash.error !== null
  })
  await check('ne peut pas créer un lien pour un projet qui n’existe pas', async () => {
    const { error } = await a.client.rpc('create_share', { p_project_id: randomUUID() })
    return error !== null
  })

  console.log('\nCompte B (autre compte) : ne doit rien voir ni rien toucher')
  await check('ne voit pas le projet de A', async () => {
    const { data, error } = await b.client.from('projects').select('id').eq('id', projectId)
    return !error && data.length === 0
  })
  await check('ne voit aucun projet de A dans sa liste', async () => {
    const { data, error } = await b.client.from('projects').select('id')
    return !error && !data.some((row) => row.id === projectId)
  })
  await check('ne peut pas modifier le projet de A', async () => {
    const { data } = await b.client.from('projects').update({ name: 'piraté' }).eq('id', projectId).select()
    return (data ?? []).length === 0
  })
  await check('ne peut pas supprimer le projet de A', async () => {
    const { data } = await b.client.from('projects').delete().eq('id', projectId).select()
    return (data ?? []).length === 0
  })
  await check('ne peut pas créer un projet au nom de A', async () => {
    const { error } = await b.client
      .from('projects')
      .insert({ id: randomUUID(), owner_id: a.user.id, name: 'intrus', kind: 'plan', document: emptyDocument })
    return error !== null
  })
  await check('ne voit pas le lien de A', async () => {
    const { data, error } = await b.client.from('shares').select('id').eq('id', shareId)
    return !error && data.length === 0
  })
  await check('ne peut pas désactiver ni supprimer le lien de A', async () => {
    const off = await b.client.from('shares').update({ active: false }).eq('id', shareId).select('id')
    const del = await b.client.from('shares').delete().eq('id', shareId).select('id')
    return (off.data ?? []).length === 0 && (del.data ?? []).length === 0
  })
  await check('ne peut pas créer un lien pour le projet de A', async () => {
    const { error } = await b.client.rpc('create_share', { p_project_id: projectId })
    return error !== null
  })
  await check('ne peut pas changer le mot de passe du lien de A', async () => {
    const { error } = await b.client.rpc('set_share_password', { p_share_id: shareId, p_password: 'x' })
    return error !== null
  })
  await check('ne peut pas lire l’image de A', async () => {
    const { data, error } = await b.client.storage.from('assets').download(assetPath)
    return error !== null && !data
  })
  await check('ne peut pas obtenir un lien signé vers l’image de A', async () => {
    const { data, error } = await b.client.storage.from('assets').createSignedUrl(assetPath, 60)
    return error !== null && !data
  })
  await check('ne voit pas le dossier d’images de A', async () => {
    const { data, error } = await b.client.storage.from('assets').list(a.user.id)
    return !error && (data ?? []).length === 0
  })
  await check('ne peut pas déposer une image dans le dossier de A', async () => {
    const { error } = await b.client.storage
      .from('assets')
      .upload(`${a.user.id}/intrus`, new Blob(['x']), { contentType: 'text/plain' })
    return error !== null
  })
  await check('ne peut pas supprimer l’image de A', async () => {
    await b.client.storage.from('assets').remove([assetPath])
    const { data, error } = await a.client.storage.from('assets').download(assetPath)
    return !error && Boolean(data)
  })
  await check('le projet de A est intact après ces tentatives', async () => {
    const { data } = await a.client.from('projects').select('name').eq('id', projectId)
    return data?.length === 1 && data[0].name === '__test_securite__'
  })

  console.log('\nVisiteur anonyme (sans compte)')
  await check('ne peut lire aucune table', async () => {
    const shares = await anon.from('shares').select('id')
    const projects = await anon.from('projects').select('id')
    return shares.error !== null && !projects.error && projects.data.length === 0
  })
  await check('ne peut pas lire l’image de A', async () => {
    const { data, error } = await anon.storage.from('assets').download(assetPath)
    return error !== null && !data
  })
  await check('ne peut pas créer de lien', async () => {
    const { error } = await anon.rpc('create_share', { p_project_id: projectId })
    return error !== null
  })
  await check('un jeton inconnu donne « indisponible »', async () => {
    const { data } = await anon.rpc('get_shared_project', { p_token: 'jeton-inconnu' })
    return data?.status === 'unavailable'
  })

  console.log('\nLien partagé (visiteur anonyme)')
  const open = async (password) => {
    const { data, error } = await anon.rpc('get_shared_project', { p_token: token, p_password: password ?? null })
    if (error) throw error
    return data
  }
  await check('sans mot de passe : demande le mot de passe, rien de plus', async () => {
    const data = await open()
    return data.status === 'password_required' && data.project === undefined
  })
  await check('mauvais mot de passe : refusé', async () => {
    const data = await open('mauvais')
    return data.status === 'wrong_password' && data.project === undefined
  })
  await check('bon mot de passe : le plan est renvoyé, sans identifiant de compte ni mot de passe haché', async () => {
    const data = await open('motdepasse-de-test')
    const text = JSON.stringify(data)
    return (
      data.status === 'ok' &&
      data.project.name === '__test_securite__' &&
      !text.includes('owner_id') &&
      !text.includes('password_hash') &&
      !text.includes(a.user.id)
    )
  })
  await check('lien désactivé : indisponible', async () => {
    await a.client.from('shares').update({ active: false }).eq('id', shareId)
    return (await open('motdepasse-de-test')).status === 'unavailable'
  })
  await check('lien réactivé : de nouveau disponible', async () => {
    await a.client.from('shares').update({ active: true }).eq('id', shareId)
    return (await open('motdepasse-de-test')).status === 'ok'
  })
  await check('lien expiré : indisponible', async () => {
    await a.client.from('shares').update({ expires_at: new Date(Date.now() - 60_000).toISOString() }).eq('id', shareId)
    return (await open('motdepasse-de-test')).status === 'unavailable'
  })
  await check('date limite retirée : de nouveau disponible', async () => {
    await a.client.from('shares').update({ expires_at: null }).eq('id', shareId)
    return (await open('motdepasse-de-test')).status === 'ok'
  })
  await check('mot de passe retiré : accessible sans mot de passe', async () => {
    await a.client.rpc('set_share_password', { p_share_id: shareId, p_password: '' })
    return (await open()).status === 'ok'
  })
  await check('lien supprimé : indisponible', async () => {
    await a.client.from('shares').delete().eq('id', shareId)
    return (await open()).status === 'unavailable'
  })
} finally {
  console.log('\nNettoyage')
  await a.client.from('projects').delete().eq('id', projectId)
  await a.client.storage.from('assets').remove([assetPath])
  console.log('  projet, image et lien de test supprimés')
}

console.log(`\n${total - failures} contrôle(s) réussi(s) sur ${total}.`)
if (failures > 0) {
  console.log(`⚠ ${failures} échec(s) : NE PAS considérer la sécurité comme validée.`)
  process.exit(1)
}
console.log('✓ Sécurité validée : aucun compte ne voit les données d’un autre, les liens se comportent comme prévu.')
