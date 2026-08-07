/// <reference types="vitest/config" />
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [
      react(),
      tailwindcss(),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: parseInt(env.VITE_PORT || '5273'),
      strictPort: true,
    },
    test: {
      // Ambiente Node por defeito: os testes actuais cobrem lógica pura (stores,
      // cálculos). Testes de componentes exigirão jsdom e @testing-library/react.
      environment: 'node',
      include: ['src/**/*.{test,spec}.{ts,tsx}'],
    },
  }
})


