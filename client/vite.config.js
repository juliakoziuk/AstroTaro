import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Навчальний симулятор React Native: уроки імпортують 'react-native',
      // як у справжньому проекті, а тут це підміняється на src/rn-lite
      'react-native': fileURLToPath(new URL('./src/rn-lite/index.js', import.meta.url)),
    },
  },
  build: {
    // сторінки проєкту: навчальний застосунок (index) і екрани MYSTIQ за макетами (landing, login)
    rollupOptions: {
      input: {
        index: fileURLToPath(new URL('./index.html', import.meta.url)),
        landing: fileURLToPath(new URL('./landing.html', import.meta.url)),
        login: fileURLToPath(new URL('./login.html', import.meta.url)),
        app: fileURLToPath(new URL('./app.html', import.meta.url)),
      },
    },
  },
})
