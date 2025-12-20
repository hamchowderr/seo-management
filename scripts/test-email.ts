import { config } from 'dotenv'
config({ path: '.env.local' })
import { Resend } from 'resend'
import { render } from '@react-email/components'
import * as React from 'react'
import {
  StageChangeEmail,
  AssignmentEmail,
  ArticleCreatedEmail,
  ArticlePublishedEmail,
} from '../emails'

const resend = new Resend(process.env.RESEND_API_KEY)
const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'
const testEmail = 'delivered@resend.dev'

async function sendTestEmail(name: string, component: React.ReactElement, subject: string) {
  console.log(`\nSending ${name} email...`)

  const html = await render(component)
  const text = await render(component, { plainText: true })

  const { data, error } = await resend.emails.send({
    from: fromEmail,
    to: testEmail,
    subject,
    html,
    text,
  })

  if (error) {
    console.error(`  ❌ Failed: ${error.message}`)
    return false
  }

  console.log(`  ✅ Sent! ID: ${data?.id}`)
  return true
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function main() {
  console.log('='.repeat(50))
  console.log('Testing Email Templates with Resend')
  console.log('='.repeat(50))
  console.log(`From: ${fromEmail}`)
  console.log(`To: ${testEmail}`)

  if (!process.env.RESEND_API_KEY) {
    console.error('\n❌ RESEND_API_KEY not set in environment')
    process.exit(1)
  }

  const results: boolean[] = []

  // Test Stage Change Email
  results.push(
    await sendTestEmail(
      'Stage Change',
      React.createElement(StageChangeEmail, {
        headline: 'Article moved to Ready for Editing',
        articleTitle: 'How to Optimize Your Website for SEO in 2025',
        fromStage: 'Needs Writing',
        toStage: 'Ready for Editing',
        googleDocUrl: 'https://docs.google.com/document/d/example',
      }),
      '[SEO Monster] Article moved to Ready for Editing'
    )
  )

  await sleep(1000) // Rate limit: 2 requests/second

  // Test Assignment Email
  results.push(
    await sendTestEmail(
      'Assignment',
      React.createElement(AssignmentEmail, {
        assigneeName: 'John Smith',
        role: 'writer',
        articleTitle: 'Complete Guide to Content Marketing',
        googleDocUrl: 'https://docs.google.com/document/d/example',
      }),
      '[SEO Monster] Assigned as writer: Complete Guide to Content Marketing'
    )
  )

  await sleep(1000) // Rate limit: 2 requests/second

  // Test Article Created Email
  results.push(
    await sendTestEmail(
      'Article Created',
      React.createElement(ArticleCreatedEmail, {
        articleTitle: 'New SEO Strategies for Small Businesses',
        googleDocUrl: 'https://docs.google.com/document/d/example',
      }),
      '[SEO Monster] New Article: New SEO Strategies for Small Businesses'
    )
  )

  await sleep(1000) // Rate limit: 2 requests/second

  // Test Article Published Email
  results.push(
    await sendTestEmail(
      'Article Published',
      React.createElement(ArticlePublishedEmail, {
        articleTitle: '10 Tips for Better Search Rankings',
        publishedUrl: 'https://example.com/blog/10-tips-for-better-search-rankings',
        googleDocUrl: 'https://docs.google.com/document/d/example',
      }),
      '[SEO Monster] Published: 10 Tips for Better Search Rankings'
    )
  )

  console.log('\n' + '='.repeat(50))
  const passed = results.filter(Boolean).length
  const total = results.length
  console.log(`Results: ${passed}/${total} emails sent successfully`)
  console.log('='.repeat(50))
  console.log('\nCheck your Resend dashboard to see the emails:')
  console.log('https://resend.com/emails')
}

main().catch(console.error)
