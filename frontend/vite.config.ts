import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Production build goes to dist/renderer (Electron reads from here)
  build: {
    outDir: '../dist/renderer',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    proxy: {
      '/tracks': 'http://localhost:8000',
      '/health':  'http://localhost:8000',
    }
  }
})
