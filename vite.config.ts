import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // The runtime `.env` holds server secrets and NODE_ENV for the Node process.
  // Vite must not read it: a `NODE_ENV=development` line there would otherwise
  // make `vite build` emit a development bundle. The app has no client-side
  // env vars, so pointing Vite at an empty directory costs nothing.
  envDir: 'env',
  server: { port: 5173 },
  resolve: {
    alias: { '~': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  // `postgres`, `better-auth` and `drizzle-orm` are Node libraries: keep them
  // out of the SSR bundle so their runtime feature detection keeps working.
  ssr: { external: ['postgres', 'better-auth', 'drizzle-orm', 'bcryptjs'] },
  plugins: [tailwindcss(), tanstackStart(), viteReact()],
})
