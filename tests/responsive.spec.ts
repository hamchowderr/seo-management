import { test, expect } from '@playwright/test'

test.describe('Responsive Design Tests', () => {
  test.describe('Board Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/board')
      await page.waitForLoadState('networkidle')
    })

    test('mobile: shows tab navigation for stages', async ({ page, isMobile }) => {
      if (!isMobile) {
        test.skip()
      }

      // On mobile, should see tab buttons for stages
      const stageTabs = page.locator('button').filter({ hasText: /Backlog|Writing|Editing/i })
      await expect(stageTabs.first()).toBeVisible()

      // Tab buttons should have min-height of 44px
      const tabButton = stageTabs.first()
      const box = await tabButton.boundingBox()
      expect(box?.height).toBeGreaterThanOrEqual(44)
    })

    test('desktop: shows kanban columns', async ({ page, isMobile }) => {
      if (isMobile) {
        test.skip()
      }

      // On desktop, should see kanban column headers
      const columnHeaders = page
        .locator('h3')
        .filter({ hasText: /Backlog|Writing|Editing|Approval|Approved/i })
      await expect(columnHeaders.first()).toBeVisible()
    })

    test('filters are responsive', async ({ page, isMobile }) => {
      const filterTriggers = page.locator('[data-slot="select-trigger"]')

      if (isMobile) {
        // On mobile, filters should have min-height of 44px
        const firstFilter = filterTriggers.first()
        const box = await firstFilter.boundingBox()
        expect(box?.height).toBeGreaterThanOrEqual(44)
      } else {
        // On desktop, filters should be visible
        await expect(filterTriggers.first()).toBeVisible()
      }
    })
  })

  test.describe('Articles Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/articles')
      await page.waitForLoadState('networkidle')
    })

    test('mobile: shows card layout instead of table', async ({ page, isMobile }) => {
      if (!isMobile) {
        test.skip()
      }

      // On mobile, table should not be visible
      const table = page.locator('table')
      await expect(table).not.toBeVisible()

      // Cards should be visible (space-y-3 container)
      const cardContainer = page.locator('.space-y-3')
      await expect(cardContainer).toBeVisible()
    })

    test('desktop: shows table layout', async ({ page, isMobile }) => {
      if (isMobile) {
        test.skip()
      }

      // On desktop, table should be visible
      const table = page.locator('table')
      await expect(table).toBeVisible()
    })

    test('filter dropdowns have proper touch targets on mobile', async ({ page, isMobile }) => {
      if (!isMobile) {
        test.skip()
      }

      const filterTriggers = page.locator('[data-slot="select-trigger"]')
      const count = await filterTriggers.count()

      for (let i = 0; i < count; i++) {
        const box = await filterTriggers.nth(i).boundingBox()
        if (box) {
          expect(box.height).toBeGreaterThanOrEqual(44)
        }
      }
    })
  })

  test.describe('Keywords Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/keywords')
      await page.waitForLoadState('networkidle')
    })

    test('tabs have proper touch targets on mobile', async ({ page, isMobile }) => {
      if (!isMobile) {
        test.skip()
      }

      const tabs = page.locator('[role="tab"]')
      const count = await tabs.count()

      for (let i = 0; i < count; i++) {
        const box = await tabs.nth(i).boundingBox()
        if (box) {
          expect(box.height).toBeGreaterThanOrEqual(44)
        }
      }
    })

    test('mobile: shows card layout', async ({ page, isMobile }) => {
      if (!isMobile) {
        test.skip()
      }

      // Table should not be visible on mobile
      const table = page.locator('table')
      await expect(table).not.toBeVisible()
    })

    test('desktop: shows table layout', async ({ page, isMobile }) => {
      if (isMobile) {
        test.skip()
      }

      // Table should be visible on desktop
      const table = page.locator('table')
      await expect(table).toBeVisible()
    })
  })

  test.describe('Users Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/users')
      await page.waitForLoadState('networkidle')
    })

    test('mobile: shows card layout', async ({ page, isMobile }) => {
      if (!isMobile) {
        test.skip()
      }

      // Table should not be visible on mobile
      const table = page.locator('table')
      await expect(table).not.toBeVisible()
    })

    test('desktop: shows table layout', async ({ page, isMobile }) => {
      if (isMobile) {
        test.skip()
      }

      // Table should be visible on desktop
      const table = page.locator('table')
      await expect(table).toBeVisible()
    })

    test('invite user button has proper touch target', async ({ page, isMobile }) => {
      if (!isMobile) {
        test.skip()
      }

      const inviteButton = page.getByRole('button', { name: /invite user/i })
      const box = await inviteButton.boundingBox()
      expect(box?.height).toBeGreaterThanOrEqual(44)
    })
  })

  test.describe('Clients Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/clients')
      await page.waitForLoadState('networkidle')
    })

    test('mobile: shows card layout', async ({ page, isMobile }) => {
      if (!isMobile) {
        test.skip()
      }

      // Table should not be visible on mobile
      const table = page.locator('table')
      await expect(table).not.toBeVisible()
    })

    test('desktop: shows table layout', async ({ page, isMobile }) => {
      if (isMobile) {
        test.skip()
      }

      // Table should be visible on desktop
      const table = page.locator('table')
      await expect(table).toBeVisible()
    })

    test('add client button has proper touch target', async ({ page, isMobile }) => {
      if (!isMobile) {
        test.skip()
      }

      const addButton = page.getByRole('button', { name: /add client/i })
      const box = await addButton.boundingBox()
      expect(box?.height).toBeGreaterThanOrEqual(44)
    })
  })

  test.describe('Dashboard Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/dashboard')
      await page.waitForLoadState('networkidle')
    })

    test('stat cards are visible', async ({ page }) => {
      // Stat cards should be visible
      const cards = page.locator('[data-slot="card"]')
      await expect(cards.first()).toBeVisible()
    })

    test('chart is visible', async ({ page }) => {
      // Chart container should be visible (look for recharts or chart container)
      const chart = page.locator('.recharts-responsive-container').first()
      await expect(chart).toBeVisible({ timeout: 10000 })
    })

    test('stat cards stack on mobile', async ({ page, isMobile }) => {
      if (!isMobile) {
        test.skip()
      }

      // Multiple stat cards should be visible
      const cards = page.locator('[data-slot="card"]')
      const count = await cards.count()
      expect(count).toBeGreaterThan(1)
    })
  })

  test.describe('Reports Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/reports')
      await page.waitForLoadState('networkidle')
    })

    test('company filter is responsive on mobile', async ({ page, isMobile }) => {
      if (!isMobile) {
        test.skip()
      }

      const companyFilter = page.locator('[data-slot="select-trigger"]').first()
      const box = await companyFilter.boundingBox()
      expect(box?.height).toBeGreaterThanOrEqual(44)
    })

    test('stat cards are visible', async ({ page }) => {
      const cards = page.locator('[data-slot="card"]')
      await expect(cards.first()).toBeVisible()
    })
  })

  test.describe('No Horizontal Scroll', () => {
    const pagesToTest = [
      '/board',
      '/articles',
      '/keywords',
      '/users',
      '/clients',
      '/dashboard',
      '/reports',
    ]

    for (const pagePath of pagesToTest) {
      test(`${pagePath} has no horizontal scroll on mobile`, async ({ page, isMobile }) => {
        if (!isMobile) {
          test.skip()
        }

        await page.goto(pagePath)
        await page.waitForLoadState('networkidle')

        // Check if body has horizontal scroll
        const hasHorizontalScroll = await page.evaluate(() => {
          return document.documentElement.scrollWidth > document.documentElement.clientWidth
        })

        // Allow small tolerance for sub-pixel rendering
        if (hasHorizontalScroll) {
          const scrollDiff = await page.evaluate(() => {
            return document.documentElement.scrollWidth - document.documentElement.clientWidth
          })
          expect(scrollDiff).toBeLessThan(5) // 5px tolerance
        }
      })
    }
  })

  test.describe('Viewport-specific layouts', () => {
    test('375px mobile - articles shows card layout', async ({ browser }) => {
      const context = await browser.newContext({
        viewport: { width: 375, height: 667 },
        storageState: 'tests/.auth/user.json',
      })
      const page = await context.newPage()

      await page.goto('/articles')
      await page.waitForLoadState('networkidle')

      // Table should not be visible on mobile
      const table = page.locator('table')
      await expect(table).not.toBeVisible()

      await context.close()
    })

    test('768px tablet - articles shows table layout', async ({ browser }) => {
      const context = await browser.newContext({
        viewport: { width: 768, height: 1024 },
        storageState: 'tests/.auth/user.json',
      })
      const page = await context.newPage()

      await page.goto('/articles')
      await page.waitForLoadState('networkidle')

      // Table should be visible on tablet
      const table = page.locator('table')
      await expect(table).toBeVisible()

      await context.close()
    })

    test('1024px desktop - board shows kanban columns', async ({ browser }) => {
      const context = await browser.newContext({
        viewport: { width: 1024, height: 768 },
        storageState: 'tests/.auth/user.json',
      })
      const page = await context.newPage()

      await page.goto('/board')
      await page.waitForLoadState('networkidle')

      // Kanban column headers should be visible
      const columnHeaders = page.locator('h3').filter({ hasText: /Backlog|Writing|Editing/i })
      await expect(columnHeaders.first()).toBeVisible()

      await context.close()
    })
  })
})
