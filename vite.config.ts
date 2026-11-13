import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { configDefaults, defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // collab-server/ a ses propres dépendances et ses propres tests (npm test dans ce dossier).
  test: { exclude: [...configDefaults.exclude, 'collab-server/**'] },
})
