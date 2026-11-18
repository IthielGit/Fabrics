import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { configDefaults, defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    // Paquets de Pascal (M17, ADR 0002) : `next/image` → simple <img>, sans serveur Next.js.
    // `@pascal-app/core` (M18, ADR 0002 § 5) : version compilée du paquet (`npm run build:pascal`),
    // ses dépendances viennent de `packages/pascal/node_modules` (versions exactes de `bun.lock`).
    alias: [
      { find: 'next/image', replacement: fileURLToPath(new URL('./src/pascal/NextImageShim.tsx', import.meta.url)) },
      {
        find: /^@pascal-app\/core$/,
        replacement: fileURLToPath(new URL('./packages/pascal/packages/core/dist/index.js', import.meta.url)),
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
