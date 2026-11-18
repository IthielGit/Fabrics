import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { cpSync, createReadStream, existsSync, statSync } from 'node:fs'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'
import { configDefaults, defineConfig } from 'vitest/config'

// Fichiers publics de Pascal (icônes, objets, matières, sons, HDRI) : son code les demande à la racine
// du site (`/icons/…`, `/material/…`). Servis depuis `packages/pascal/apps/editor/public` en
// développement, copiés dans `dist` au build : pas de doublon de 29 Mo dans le dépôt (M19 A2).
const PASCAL_PUBLIC = fileURLToPath(new URL('./packages/pascal/apps/editor/public', import.meta.url))
const PASCAL_PUBLIC_DIRS = ['icons', 'items', 'material', 'audios', 'hdri', 'demos', 'fonts']
const CONTENT_TYPES: Record<string, string> = {
  '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml',
  '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.ogg': 'audio/ogg', '.hdr': 'application/octet-stream',
  '.glb': 'model/gltf-binary', '.json': 'application/json', '.ttf': 'font/ttf', '.woff': 'font/woff',
  '.ktx2': 'image/ktx2', '.bin': 'application/octet-stream',
}
function pascalPublicFiles() {
  return {
    name: 'fabrics-pascal-public',
    configureServer(server: { middlewares: { use: (fn: (req: { url?: string }, res: never, next: () => void) => void) => void } }) {
      server.middlewares.use((req, res, next) => {
        const path = decodeURIComponent((req.url ?? '').split('?')[0])
        const dir = path.split('/')[1] ?? ''
        const file = normalize(join(PASCAL_PUBLIC, path))
        if (!PASCAL_PUBLIC_DIRS.includes(dir) || !file.startsWith(PASCAL_PUBLIC) || !existsSync(file) || !statSync(file).isFile()) return next()
        const out = res as unknown as { setHeader: (k: string, v: string) => void }
        out.setHeader('Content-Type', CONTENT_TYPES[extname(file).toLowerCase()] ?? 'application/octet-stream')
        createReadStream(file).pipe(res as never)
      })
    },
    closeBundle() {
      for (const dir of PASCAL_PUBLIC_DIRS) {
        const from = join(PASCAL_PUBLIC, dir)
        if (existsSync(from)) cpSync(from, fileURLToPath(new URL(`./dist/${dir}`, import.meta.url)), { recursive: true, force: false })
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), pascalPublicFiles()],
  resolve: {
    // Paquets de Pascal (M17, ADR 0002) : `next/image` → simple <img>, sans serveur Next.js.
    // `@pascal-app/core` (M18, ADR 0002 § 5) : version compilée du paquet (`npm run build:pascal`),
    // ses dépendances viennent de `packages/pascal/node_modules` (versions exactes de `bun.lock`).
    alias: [
      { find: 'next/image', replacement: fileURLToPath(new URL('./src/pascal/NextImageShim.tsx', import.meta.url)) },
      {
        find: /^next\/dist\/shared\/lib\/(image-config|image-config-context\.shared-runtime|match-remote-pattern)$/,
        replacement: fileURLToPath(new URL('./src/pascal/NextInternalsShim.ts', import.meta.url)),
      },
      {
        find: /^@pascal-app\/core$/,
        replacement: fileURLToPath(new URL('./packages/pascal/packages/core/dist/index.js', import.meta.url)),
      },
      {
        find: /^@pascal-app\/viewer$/,
        replacement: fileURLToPath(new URL('./packages/pascal/packages/viewer/dist/index.js', import.meta.url)),
      },
      {
        find: /^@pascal-app\/nodes$/,
        replacement: fileURLToPath(new URL('./packages/pascal/packages/nodes/dist/index.js', import.meta.url)),
      },
      // Composants de l'application Pascal repris tels quels (barre de vue, M19 A5) ; leurs imports
      // `@/…` désignent cette application (Fabrics n'utilise pas `@/`).
      {
        find: /^@pascal-app-host\/(.*)$/,
        replacement: `${fileURLToPath(new URL('./packages/pascal/apps/editor/components/', import.meta.url))}$1`,
      },
      {
        find: /^@\/(.*)$/,
        replacement: `${fileURLToPath(new URL('./packages/pascal/apps/editor/', import.meta.url))}$1`,
      },
      // Modules d'extension de Pascal (arbres, environnement, piscine…, M19 A5) : fournis en source.
      {
        find: /^@pascal-app\/plugin-([a-z-]+)$/,
        replacement: `${fileURLToPath(new URL('./packages/pascal/node_modules/@pascal-app/', import.meta.url))}plugin-$1/src/index.ts`,
      },
      // `@pascal-app/editor` (M19 A2) : fourni en source TypeScript, compilé par Vite avec le reste.
      {
        find: /^@pascal-app\/editor$/,
        replacement: fileURLToPath(new URL('./packages/pascal/packages/editor/src/index.tsx', import.meta.url)),
      },
      {
        find: /^@pascal-app\/editor\/locales$/,
        replacement: fileURLToPath(new URL('./packages/pascal/packages/editor/src/i18n/locales.ts', import.meta.url)),
      },
      // `zod` : la copie de Pascal, la même instance que ses schémas (types de nœuds Fabrics, M18).
      { find: /^zod$/, replacement: fileURLToPath(new URL('./packages/pascal/node_modules/zod/index.js', import.meta.url)) },
    ],
    // Une seule copie de React et de three, comme l'impose Pascal (next.config.ts de son application).
    dedupe: ['react', 'react-dom', 'three', '@react-three/fiber'],
  },
  // collab-server/ a ses propres dépendances et ses propres tests (npm test dans ce dossier).
  // packages/pascal/ : tests de Pascal sous bun (npm run test:pascal), jamais sous Vitest (ADR 0002).
  test: { exclude: [...configDefaults.exclude, 'collab-server/**', 'packages/pascal/**'] },
})
