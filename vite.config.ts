import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // localhost resolves to ::1 first on this machine. Listen on IPv6
    // with IPv4 mapped so both http://localhost:5173 and 127.0.0.1 work.
    host: '::',
    port: 5173,
  },
})
