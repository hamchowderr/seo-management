import { test as setup, expect } from '@playwright/test'

const authFile = 'tests/.auth/user.json'

setup('authenticate', async ({ page }) => {
  // Go to login page
  await page.goto('/auth/login')
  await page.waitForLoadState('networkidle')

  // Fill in credentials from seed data
  await page.getByLabel(/email/i).fill('admin@seomonster.dev')
  await page.getByLabel(/password/i).fill('password123')

  // Click login button
  await page.getByRole('button', { name: /sign in|log in|login/i }).click()

  // Wait for redirect to dashboard or any authenticated page
  await page.waitForURL((url) => !url.pathname.includes('/auth/login'), {
    timeout: 10000,
  })

  // Verify we're logged in by checking we're not on login page
  await expect(page).not.toHaveURL(/\/auth\/login/)

  // Save authentication state
  await page.context().storageState({ path: authFile })
})
