import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

// In development/preview, /api is forwarded to the local API (cd server && npm run dev).
const apiProxy = {
  '/api': { target: process.env.API_PROXY_TARGET || 'http://localhost:4000', changeOrigin: true },
}

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      // Rules shared with the API in /server (validation, service list, limits)
      '@shared': fileURLToPath(new URL('./shared', import.meta.url)),
    },
  },
  server: { proxy: apiProxy },
  preview: { proxy: apiProxy },
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    assetsInlineLimit: 4096,
  },
})
