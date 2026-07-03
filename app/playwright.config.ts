import { defineConfig } from '@playwright/test'

/** E2E runs against the production build (`npm run build` first). */
export default defineConfig({
  testDir: 'e2e',
  timeout: 60_000,
  use: {
    baseURL: 'http://localhost:4299/on-mars-solo/',
  },
  webServer: {
    command: 'npm run preview -- --port 4299 --strictPort',
    url: 'http://localhost:4299/on-mars-solo/',
    reuseExistingServer: !process.env.CI,
  },
})
