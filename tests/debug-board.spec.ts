import { test, expect, Page } from '@playwright/test'

// Helper to capture console messages and errors
function setupConsoleLogging(page: Page) {
  const logs: { type: string; text: string }[] = []

  page.on('console', (msg) => {
    logs.push({ type: msg.type(), text: msg.text() })
    if (msg.type() === 'error') {
      console.log(`[CONSOLE ERROR]: ${msg.text()}`)
    }
  })

  page.on('pageerror', (error) => {
    console.log(`[PAGE ERROR]: ${error.message}`)
    console.log(`[PAGE ERROR STACK]: ${error.stack}`)
  })

  return logs
}

test.describe('Debug Board Page Refresh Issue', () => {
  test.use({ storageState: 'tests/.auth/user.json' })

  test('click card and monitor for page refresh', async ({ page }) => {
    const logs = setupConsoleLogging(page)

    // Track if page reloads
    let reloadCount = 0
    page.on('load', () => {
      reloadCount++
      console.log(`[PAGE LOAD EVENT #${reloadCount}]`)
    })

    // Navigate to board page
    console.log('Navigating to /board...')
    await page.goto('/board')
    await page.waitForLoadState('networkidle')
    console.log('Board page loaded')

    // Wait for the kanban board to be visible
    await page.waitForSelector('.cursor-pointer', { timeout: 10000 })
    console.log('Kanban cards are visible')

    // Take screenshot before clicking
    await page.screenshot({ path: 'debug-before-click.png' })

    // Find and click on a card
    const cards = await page.locator('.cursor-pointer').all()
    console.log(`Found ${cards.length} cards`)

    if (cards.length > 0) {
      console.log('Clicking first card...')

      // Store current URL to detect navigation
      const urlBefore = page.url()

      await cards[0].click()

      // Wait a moment to see if anything happens
      await page.waitForTimeout(2000)

      const urlAfter = page.url()
      console.log(`URL before: ${urlBefore}`)
      console.log(`URL after: ${urlAfter}`)

      // Check if modal appeared
      const modal = page.locator('[role="dialog"]')
      const modalVisible = await modal.isVisible().catch(() => false)
      console.log(`Modal visible: ${modalVisible}`)

      // Take screenshot after clicking
      await page.screenshot({ path: 'debug-after-click.png' })

      // Wait more to observe any delayed issues
      await page.waitForTimeout(3000)

      console.log(`Total page loads detected: ${reloadCount}`)

      // Print all console errors
      const errors = logs.filter((l) => l.type === 'error')
      if (errors.length > 0) {
        console.log('\n=== Console Errors ===')
        errors.forEach((e) => console.log(e.text))
      }

      // Check if we're still on the board page
      expect(page.url()).toContain('/board')
    }
  })

  test('click modal tabs and wait for polling', async ({ page }) => {
    test.setTimeout(60000) // 60 second timeout

    const logs = setupConsoleLogging(page)

    let reloadCount = 0
    let modalClosedUnexpectedly = false

    page.on('load', () => {
      reloadCount++
      console.log(`[PAGE LOAD EVENT #${reloadCount}]`)
    })

    console.log('Navigating to /board...')
    await page.goto('/board')
    await page.waitForLoadState('networkidle')
    console.log('Board page loaded')

    await page.waitForSelector('.cursor-pointer', { timeout: 10000 })

    // Click first card
    const cards = await page.locator('.cursor-pointer').all()
    console.log(`Found ${cards.length} cards`)
    await cards[0].click()

    // Wait for modal
    const modal = page.locator('[role="dialog"]')
    await expect(modal).toBeVisible({ timeout: 5000 })
    console.log('Modal is open')

    // Try clicking each tab
    const tabs = ['Checklist', 'Comments', 'History', 'Details']
    for (const tabName of tabs) {
      console.log(`Clicking ${tabName} tab...`)
      const tab = modal.getByRole('tab', { name: tabName })
      if (await tab.isVisible()) {
        await tab.click()
        await page.waitForTimeout(500)

        // Check if modal is still visible
        if (!(await modal.isVisible())) {
          console.log(`MODAL CLOSED after clicking ${tabName}!`)
          modalClosedUnexpectedly = true
          break
        }
      }
    }

    await page.screenshot({ path: 'debug-modal-tabs.png' })

    // Wait for 35 seconds to trigger polling (30 second interval)
    console.log('Waiting 35 seconds for polling to trigger...')
    for (let i = 0; i < 7; i++) {
      await page.waitForTimeout(5000)
      console.log(`${(i + 1) * 5} seconds elapsed...`)

      // Check modal is still visible
      const stillVisible = await modal.isVisible().catch(() => false)
      if (!stillVisible) {
        console.log('MODAL CLOSED during wait!')
        modalClosedUnexpectedly = true
        break
      }
    }

    await page.screenshot({ path: 'debug-after-wait.png' })

    console.log(`\nFinal status:`)
    console.log(`  Page loads: ${reloadCount}`)
    console.log(`  Modal closed unexpectedly: ${modalClosedUnexpectedly}`)

    const errors = logs.filter((l) => l.type === 'error')
    if (errors.length > 0) {
      console.log('\n=== Console Errors ===')
      errors.forEach((e) => console.log(e.text))
    }

    expect(reloadCount).toBe(1) // Only initial load
    expect(modalClosedUnexpectedly).toBe(false)
  })
})
