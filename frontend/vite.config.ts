/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Porta fixa (2026-09-16): o backend do e-Sigma so libera CORS para
    // localhost:5173/127.0.0.1:5173. Com strictPort, se a 5173 estiver ocupada
    // o Vite falha alto em vez de subir noutra porta e quebrar o CORS.
    port: 5173,
    strictPort: true,
  },
  // test: {
  //   globals: true,
  //   environment: 'jsdom',
  //   setupFiles: './src/compartilhado/testes/setupTests.ts',
  // },
})
