import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    // Authentication setup - runs first
    { name: 'setup', testMatch: /.*\.setup\.ts/ },

    // Mobile viewport (authenticated)
    {
      name: 'Mobile',
      use: {
        ...devices['iPhone 14'],
        storageState: 'tests/.auth/user.json',
      },
      dependencies: ['setup'],
    },
    // Tablet viewport (authenticated)
    {
      name: 'Tablet',
      use: {
        viewport: { width: 768, height: 1024 },
        storageState: 'tests/.auth/user.json',
      },
      dependencies: ['setup'],
    },
    // Desktop viewport (authenticated)
    {
      name: 'Desktop',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'tests/.auth/user.json',
      },
      dependencies: ['setup'],
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
  },
})
