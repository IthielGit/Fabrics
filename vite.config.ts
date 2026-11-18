import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { configDefaults, defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    // Paquets de Pascal (M17, ADR 0002) : `next/image` → simple <img>, sans serveur Next.js.
    alias: { 'next/image': fileURLToPath(new URL('./src/pascal/NextImageShim.tsx', import.meta.url)) },
    // Une seule copie de React et de three, comme l'impose Pascal (next.config.ts de son application).
    dedupe: ['react', 'react-dom', 'three', '@react-three/fiber'],
  },
  // collab-server/ a ses propres dépendances et ses propres tests (npm test dans ce dossier).
  // packages/pascal/ : tests de Pascal sous bun (npm run test:pascal), jamais sous Vitest (ADR 0002).
  test: { exclude: [...configDefaults.exclude, 'collab-server/**', 'packages/pascal/**'] },
})
