import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
// For GitHub Pages project site, build with: BASE_PATH=/accessmap/ npm run build
const base = (globalThis as { process?: { env?: Record<string, string | undefined> } })
  .process?.env?.BASE_PATH || '/'

export default defineConfig({
  base,
  plugins: [react()],
  server: {
    // localhost resolves to ::1 first on this machine. Listen on IPv6
    // with IPv4 mapped so both http://localhost:5173 and 127.0.0.1 work.
    host: '::',
    port: 5173,
  },
})
