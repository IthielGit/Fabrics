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

// Route de connexion de Mint (`/api/plugins/mint/…`, choix de l'utilisateur du 2026-11-18) : l'adaptateur
// serveur fourni par Mint fait la connexion OAuth et relaie les appels à `api.mint.gg` ; les jetons restent
// dans des cookies HttpOnly, jamais lisibles par le navigateur. En développement seulement : en
// production (Cloudflare Pages), il faudra une fonction équivalente.
type NodeRequest = AsyncIterable<Uint8Array> & { url?: string; method?: string; headers: Record<string, string | string[] | undefined> }
type NodeResponse = { statusCode: number; setHeader: (key: string, value: string | string[]) => void; end: (body?: Uint8Array) => void }
type MintHandler = (request: Request, options: { origin: string; clientId?: string }) => Promise<Response>
function mintRoute() {
  return {
    name: 'fabrics-mint-route',
    configureServer(server: {
      config: { server: { port?: number } }
      ssrLoadModule: (id: string) => Promise<Record<string, unknown>>
      middlewares: { use: (fn: (req: NodeRequest, res: NodeResponse, next: () => void) => void) => void }
    }) {
      server.middlewares.use((req, res, next) => {
        if (!(req.url ?? '').startsWith('/api/plugins/mint/')) return next()
        void (async () => {
          const origin = process.env.MINT_PASCAL_HOST_ORIGIN ?? `http://localhost:${server.config.server.port ?? 5173}`
          const headers = new Headers()
          for (const [key, value] of Object.entries(req.headers)) {
            if (value !== undefined) headers.set(key, Array.isArray(value) ? value.join(', ') : value)
          }
          const chunks: Uint8Array[] = []
          if (req.method === 'POST') for await (const chunk of req) chunks.push(chunk)
          const request = new Request(new URL(req.url ?? '/', origin), {
            method: req.method,
            headers,
            body: chunks.length > 0 ? Buffer.concat(chunks) : undefined,
          })
          const { handleMintPascalRequest } = (await server.ssrLoadModule('@mint/pascal-plugin/server')) as {
            handleMintPascalRequest: MintHandler
          }
          const response = await handleMintPascalRequest(request, { origin, clientId: process.env.MINT_PASCAL_CLIENT_ID })
          res.statusCode = response.status
          response.headers.forEach((value, key) => {
            if (key !== 'set-cookie') res.setHeader(key, value)
          })
          const cookies = response.headers.getSetCookie()
          if (cookies.length > 0) res.setHeader('Set-Cookie', cookies)
          res.end(new Uint8Array(await response.arrayBuffer()))
        })().catch(() => {
          res.statusCode = 502
          res.end()
        })
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), pascalPublicFiles(), mintRoute()],
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
      // Mint (objets 3D générés) : partie navigateur et adaptateur serveur, fournis en source.
      {
        find: /^@mint\/pascal-plugin(\/server)?$/,
        replacement: `${fileURLToPath(new URL('./packages/pascal/node_modules/@mint/pascal-plugin/src', import.meta.url))}$1/index.ts`,
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
  // Développement : Pascal (≈ 2 200 fichiers source) regroupé en quelques fichiers mis en cache, au lieu
  // d'un fichier par module à chaque chargement de page. Après une modification du code de Pascal,
  // relancer avec `npx vite --force` pour refaire ce regroupement.
  optimizeDeps: {
    // `@pascal-app/editor` est en source TypeScript : il faut autoriser ces extensions.
    extensions: ['.ts', '.tsx'],
    include: ['@pascal-app/editor', '@pascal-app/editor/locales', '@pascal-app/core', '@pascal-app/viewer', '@pascal-app/nodes'],
  },
  // collab-server/ a ses propres dépendances et ses propres tests (npm test dans ce dossier).
  // packages/pascal/ : tests de Pascal sous bun (npm run test:pascal), jamais sous Vitest (ADR 0002).
  test: { exclude: [...configDefaults.exclude, 'collab-server/**', 'packages/pascal/**'] },
})
