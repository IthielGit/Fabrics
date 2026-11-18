// Compile les traductions françaises « à relire » (fuzzy) du catalogue de Pascal dans un paquet de
// Fabrics (choix de l'utilisateur du 2026-11-18, M19 A5). Pascal les écarte de sa compilation tant
// qu'elles ne sont pas relues ; Fabrics les charge par-dessus le catalogue officiel, sans modifier
// Pascal. Une traduction dont les variables diffèrent de l'anglais est ignorée.
//
// Usage : node scripts/compile-pascal-fr.mjs   (à relancer après une mise à jour de Pascal)
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

const english = new Map(readPo('en').items.map((item) => [item.msgid, item.msgstr[0] || item.msgid]))
const compiled = {}
let skipped = 0
for (const item of readPo('fr').items) {
  const translation = item.msgstr[0]
  if (!item.flags.fuzzy || !translation || item.obsolete) continue
  const source = english.get(item.msgid)
  if (!source) continue
  try {
    const tokens = compileMessageOrThrow(translation)
    const same = JSON.stringify(variableNames(compileMessageOrThrow(source))) === JSON.stringify(variableNames(tokens))
    if (!same) throw new Error('placeholders')
    compiled[item.msgid] = tokens
  } catch {
    skipped += 1
  }
}

const sorted = Object.fromEntries(Object.entries(compiled).sort(([a], [b]) => a.localeCompare(b)))
const out = resolve(root, 'src/i18n/pascalFrReview.ts')
writeFileSync(
  out,
  '// Fichier généré par `node scripts/compile-pascal-fr.mjs` : ne pas modifier à la main.\n' +
    '// Traductions françaises de Pascal pas encore relues (fuzzy), chargées par `src/pascal/bootstrap.ts`.\n' +
    `export const pascalFrReview: Record<string, unknown> = JSON.parse(${JSON.stringify(JSON.stringify(sorted))})\n`,
)
console.log(`${Object.keys(sorted).length} traductions compilées, ${skipped} ignorées → ${out}`)
