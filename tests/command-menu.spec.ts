import { test, expect } from '@playwright/test'

test.describe('Command Menu', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
  })

  test.describe('Opening the Command Menu', () => {
    test('opens with Ctrl+K keyboard shortcut', async ({ page }) => {
      await page.keyboard.press('Control+k')

      const dialog = page.getByRole('dialog')
      await expect(dialog).toBeVisible()

      const input = page.getByPlaceholder(/type a command or search/i)
      await expect(input).toBeVisible()
    })

    test('opens with Cmd+K keyboard shortcut (Mac)', async ({ page }) => {
      await page.keyboard.press('Meta+k')

      const dialog = page.getByRole('dialog')
      await expect(dialog).toBeVisible()
    })

    test('opens when clicking search trigger on dashboard', async ({ page }) => {
      const searchTrigger = page.locator('button').filter({ hasText: /search articles/i })
      await searchTrigger.click()

      const dialog = page.getByRole('dialog')
      await expect(dialog).toBeVisible()
    })

    test('closes when pressing Escape', async ({ page }) => {
      await page.keyboard.press('Control+k')
      await expect(page.getByRole('dialog')).toBeVisible()

      await page.keyboard.press('Escape')
      await expect(page.getByRole('dialog')).not.toBeVisible()
    })
  })

  test.describe('Navigation Commands', () => {
    test('navigates to Clients page', async ({ page }) => {
      await page.keyboard.press('Control+k')

      await page.getByRole('option', { name: /^Clients$/i }).click()

      await expect(page).toHaveURL('/clients')
    })

    test('navigates to Settings page', async ({ page }) => {
      await page.keyboard.press('Control+k')

      await page.getByRole('option', { name: /^Settings$/i }).click()

      await expect(page).toHaveURL('/settings')
    })
  })

  test.describe('Filter by Stage Commands', () => {
    test('filters articles by Needs Writing stage', async ({ page }) => {
      await page.keyboard.press('Control+k')

      await page.getByRole('option', { name: /needs writing/i }).click()

      await expect(page).toHaveURL(/\/articles\?stage=needs_writing/)
    })

    test('filters articles by Ready for Editing stage', async ({ page }) => {
      await page.keyboard.press('Control+k')

      await page.getByRole('option', { name: /ready for editing/i }).click()

      await expect(page).toHaveURL(/\/articles\?stage=ready_for_editing/)
    })

    test('filters articles by Assigned for Posting stage', async ({ page }) => {
      await page.keyboard.press('Control+k')

      const input = page.getByPlaceholder(/type a command or search/i)
      await input.fill('assigned for posting')

      await page.getByRole('option', { name: /assigned for posting/i }).click()

      await expect(page).toHaveURL(/\/articles\?stage=assigned_for_posting/)
    })
  })

  test.describe('Filter by Content Type Commands', () => {
    test('filters to SEO articles', async ({ page }) => {
      await page.keyboard.press('Control+k')

      const input = page.getByPlaceholder(/type a command or search/i)
      await input.fill('seo articles')

      await page.locator('[data-value="SEO Articles"]').click()

      await expect(page).toHaveURL(/\/articles\?content_type=seo/)
    })

    test('filters to Blog articles', async ({ page }) => {
      await page.keyboard.press('Control+k')

      const input = page.getByPlaceholder(/type a command or search/i)
      await input.fill('blog articles')

      await page.locator('[data-value="Blog Articles"]').click()

      await expect(page).toHaveURL(/\/articles\?content_type=blog/)
    })
  })

  test.describe('My Articles Commands', () => {
    test('shows published articles', async ({ page }) => {
      await page.keyboard.press('Control+k')

      const input = page.getByPlaceholder(/type a command or search/i)
      await input.fill('published')

      await page.getByRole('option', { name: /published articles/i }).click()

      await expect(page).toHaveURL(/\/articles\?stage=published/)
    })
  })

  test.describe('Quick Actions', () => {
    test('Add Keyword navigates to keywords page', async ({ page }) => {
      await page.keyboard.press('Control+k')

      const input = page.getByPlaceholder(/type a command or search/i)
      await input.fill('add keyword')

      await page.locator('[data-value="Add Keyword"]').click()

      // Should navigate to keywords page
      await expect(page).toHaveURL('/keywords')
    })

    test('Add Company navigates to clients page', async ({ page }) => {
      await page.keyboard.press('Control+k')

      const input = page.getByPlaceholder(/type a command or search/i)
      await input.fill('add company')

      await page.getByRole('option', { name: /add company/i }).click()

      // Should navigate to clients page
      await expect(page).toHaveURL('/clients')
    })

    test('Toggle theme switches between dark and light mode', async ({ page }) => {
      // Get initial theme
      const initialTheme = await page.evaluate(() => {
        return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
      })

      await page.keyboard.press('Control+k')

      const input = page.getByPlaceholder(/type a command or search/i)
      await input.fill('switch')

      // Click the theme toggle option - it says "Switch to Light Mode" or "Switch to Dark Mode"
      const themeOption = page.getByRole('option').filter({ hasText: /switch to/i })
      await themeOption.click()

      // Theme should have changed
      const newTheme = await page.evaluate(() => {
        return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
      })

      expect(newTheme).not.toBe(initialTheme)
    })
  })

  test.describe('Search Functionality', () => {
    test('filters commands as user types', async ({ page }) => {
      await page.keyboard.press('Control+k')

      const input = page.getByPlaceholder(/type a command or search/i)
      await input.fill('key')

      // Should see Keywords navigation and keyword-related options
      await expect(page.getByRole('option', { name: /keywords/i }).first()).toBeVisible()
    })

    test('shows no results message for invalid search', async ({ page }) => {
      await page.keyboard.press('Control+k')

      const input = page.getByPlaceholder(/type a command or search/i)
      await input.fill('xyznonexistent123')

      await expect(page.getByText(/no results found/i)).toBeVisible()
    })
  })

  test.describe('Board-specific Actions', () => {
    test('shows board actions when on board page', async ({ page }) => {
      await page.goto('/board')
      await page.waitForLoadState('networkidle')

      await page.keyboard.press('Control+k')

      // Should see board-specific actions
      await expect(page.getByRole('option', { name: /clear all filters/i })).toBeVisible()
      await expect(page.getByRole('option', { name: /show only my articles/i })).toBeVisible()
    })

    test('does not show board actions on other pages', async ({ page }) => {
      await page.goto('/articles')
      await page.waitForLoadState('networkidle')

      await page.keyboard.press('Control+k')

      // Should NOT see board-specific actions
      await expect(page.getByRole('option', { name: /clear all filters/i })).not.toBeVisible()
    })
  })
})
