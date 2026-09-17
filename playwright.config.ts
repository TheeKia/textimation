import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/browser',
  testMatch: '**/*.e2e.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  use: { baseURL: 'http://127.0.0.1:3053', trace: 'retain-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command:
      'bunx vite --config tests/browser/vite.config.ts --host 127.0.0.1 --port 3053 --strictPort',
    url: 'http://127.0.0.1:3053',
    reuseExistingServer: !process.env.CI,
  },
})
