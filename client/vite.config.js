import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
  build: {
    outDir: '../backend/public-client',
    emptyOutDir: true,
    copyPublicDir: true,
  },
})
