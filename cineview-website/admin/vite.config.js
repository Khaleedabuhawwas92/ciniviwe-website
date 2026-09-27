import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      // Status labels and service list shared with the API and the website
      '@shared': fileURLToPath(new URL('../shared', import.meta.url)),
    },
  },
  server: { port: 5174, strictPort: true },
  preview: { port: 4174, strictPort: true },
  build: { target: 'es2020' },
})
