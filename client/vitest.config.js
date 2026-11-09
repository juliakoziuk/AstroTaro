import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// Тести екранів (npm run test:ui): справжні компоненти в jsdom. Решта тестів проєкту — node --test (див. "test" у package.json).
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    include: ['src/**/*.ui.test.{js,jsx}'],
    setupFiles: ['./src/test/setup.js'],
    css: false,
    // екрани тягнуть важкі картинки (plate-*.webp, svg): перший імпорт під навантаженням легко перевищує типові 5 с
    testTimeout: 20000,
    hookTimeout: 20000,
  },
})
