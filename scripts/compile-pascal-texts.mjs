// Prépare l'unique fichier de textes de l'interface de Pascal dans Fabrics, en français (choix de
// l'utilisateur du 2026-11-18 : une seule langue, rien d'autre à charger). Pour chaque texte : la
// traduction française de Pascal (relue ou non), sinon le texte anglais d'origine. Une traduction dont
// les variables diffèrent de l'anglais est écartée (l'anglais reste). Pascal n'est pas modifié.
//
// Usage : node scripts/compile-pascal-texts.mjs   (à relancer après une mise à jour de Pascal)
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const pascal = resolve(root, 'packages/pascal')
const load = (path) => import(pathToFileURL(resolve(pascal, 'node_modules', path)).href)

const { parsePo } = await load('pofile-ts/dist/index.js')
const { compileMessageOrThrow } = await load('@lingui/message-utils/dist/compileMessage.mjs')

const localesDir = resolve(pascal, 'packages/editor/src/i18n/locales')
const readPo = (locale) => parsePo(readFileSync(resolve(localesDir, locale, 'messages.po'), 'utf8'))

/** Noms des variables d'un message compilé, triés. */
function variableNames(tokens, names = new Set()) {
  for (const token of tokens) {
    if (!Array.isArray(token)) continue
    if (typeof token[0] === 'string') names.add(token[0])
    const cases = token[2]
    if (cases && typeof cases === 'object') {
      for (const value of Object.values(cases)) if (Array.isArray(value)) variableNames(value, names)
    }
  }
  return [...names].sort()
}

const compiled = {}
let english = 0
let skipped = 0
for (const item of readPo('en').items) {
  if (item.obsolete) continue
  compiled[item.msgid] = compileMessageOrThrow(item.msgstr[0] || item.msgid)
  english += 1
}
const sources = new Map(readPo('en').items.map((item) => [item.msgid, item.msgstr[0] || item.msgid]))
let french = 0
for (const item of readPo('fr').items) {
  const translation = item.msgstr[0]
  const source = sources.get(item.msgid)
  if (!translation || item.obsolete || !source) continue
  try {
    const tokens = compileMessageOrThrow(translation)
    const same = JSON.stringify(variableNames(compileMessageOrThrow(source))) === JSON.stringify(variableNames(tokens))
    if (!same) throw new Error('placeholders')
    compiled[item.msgid] = tokens
    french += 1
  } catch {
    skipped += 1
  }
}

const sorted = Object.fromEntries(Object.entries(compiled).sort(([a], [b]) => a.localeCompare(b)))
const out = resolve(root, 'src/i18n/pascalTexts.ts')
writeFileSync(
  out,
  '// Fichier généré par `node scripts/compile-pascal-texts.mjs` : ne pas modifier à la main.\n' +
    "// Textes de l'interface de Pascal en français (anglais d'origine s'il manque une traduction).\n" +
    `export const pascalTexts: Record<string, unknown> = JSON.parse(${JSON.stringify(JSON.stringify(sorted))})\n`,
)
console.log(`${Object.keys(sorted).length} textes : ${french} en français, ${english - french} restés en anglais (${skipped} traductions écartées) → ${out}`)
