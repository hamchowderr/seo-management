import { test, expect } from '@playwright/test'

test.describe('Email Templates', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dev/emails')
  })

  test('should render email preview page', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Email Templates Preview' })).toBeVisible()
  })

  test('should display stage change email', async ({ page }) => {
    const emailContainer = page.getByTestId('email-stage-change')
    await expect(emailContainer).toBeVisible()

    const iframe = page.getByTestId('email-iframe-stage-change')
    await expect(iframe).toBeVisible()

    // Check iframe content
    const frame = iframe.contentFrame()
    await expect(frame.getByText('SEO Monster', { exact: true })).toBeVisible()
    await expect(frame.getByText('Article moved to Ready for Editing', { exact: true })).toBeVisible()
    await expect(frame.getByText('How to Optimize Your Website for SEO in 2025', { exact: true })).toBeVisible()
    await expect(frame.getByText('Needs Writing', { exact: true })).toBeVisible()
    await expect(frame.getByRole('link', { name: 'Open Google Doc' })).toBeVisible()
  })

  test('should display assignment email', async ({ page }) => {
    const emailContainer = page.getByTestId('email-assignment')
    await expect(emailContainer).toBeVisible()

    const iframe = page.getByTestId('email-iframe-assignment')
    const frame = iframe.contentFrame()
    await expect(frame.getByText('SEO Monster', { exact: true })).toBeVisible()
    await expect(frame.getByText("You've been assigned as writer", { exact: true })).toBeVisible()
    await expect(frame.getByText('Complete Guide to Content Marketing', { exact: true })).toBeVisible()
    await expect(frame.getByRole('link', { name: 'Open Google Doc' })).toBeVisible()
  })

  test('should display article created email', async ({ page }) => {
    const emailContainer = page.getByTestId('email-article-created')
    await expect(emailContainer).toBeVisible()

    const iframe = page.getByTestId('email-iframe-article-created')
    const frame = iframe.contentFrame()
    await expect(frame.getByText('SEO Monster', { exact: true })).toBeVisible()
    await expect(frame.getByText('New Article Created', { exact: true })).toBeVisible()
    await expect(frame.getByText('New SEO Strategies for Small Businesses', { exact: true })).toBeVisible()
    await expect(frame.getByRole('link', { name: 'Open Google Doc' })).toBeVisible()
  })

  test('should display article published email', async ({ page }) => {
    const emailContainer = page.getByTestId('email-article-published')
    await expect(emailContainer).toBeVisible()

    const iframe = page.getByTestId('email-iframe-article-published')
    const frame = iframe.contentFrame()
    await expect(frame.getByText('SEO Monster', { exact: true })).toBeVisible()
    await expect(frame.getByText('Article Published', { exact: true })).toBeVisible()
    await expect(frame.getByText('10 Tips for Better Search Rankings', { exact: true })).toBeVisible()
    await expect(frame.getByRole('link', { name: 'View Published Article' })).toBeVisible()
  })

  test('should take screenshots of all emails', async ({ page }) => {
    // Screenshot entire page
    await page.screenshot({ path: 'test-results/emails-preview.png', fullPage: true })

    // Individual email screenshots
    const emails = ['stage-change', 'assignment', 'article-created', 'article-published']
    for (const email of emails) {
      const container = page.getByTestId(`email-${email}`)
      await container.screenshot({ path: `test-results/email-${email}.png` })
    }
  })
})
