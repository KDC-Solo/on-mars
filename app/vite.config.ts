/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import pkg from './package.json' with { type: 'json' }

// https://vite.dev/config/
export default defineConfig({
  // Served from https://ianpogi5.github.io/on-mars-solo/
  base: '/on-mars-solo/',
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'On Mars Solo Companion',
        short_name: 'OM Solo',
        description: 'Runs the Lacerda bot for On Mars solo mode',
        theme_color: '#d4552a',
        background_color: '#07060d',
        display: 'standalone',
        start_url: '/on-mars-solo/',
        scope: '/on-mars-solo/',
        icons: [],
      },
    }),
  ],
  test: {
    exclude: ['e2e/**', 'node_modules/**'],
  },
})
