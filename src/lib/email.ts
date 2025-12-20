import { render } from '@react-email/components'
import { Resend } from 'resend'
import * as React from 'react'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

interface ReactEmailOptions {
  to: string
  subject: string
  react: React.ReactElement
}

/**
 * Check if email is configured
 */
export function isEmailConfigured(): boolean {
  return !!process.env.RESEND_API_KEY
}

/**
 * Get the from email address
 */
function getFromEmail(): string {
  return process.env.RESEND_FROM_EMAIL || 'SEO Monster <notifications@seomonster.dev>'
}

/**
 * Send an email using Resend
 */
export async function sendEmail(options: EmailOptions): Promise<void> {
  if (!resend) {
    console.warn('[Email] Resend not configured - skipping email to:', options.to)
    return
  }

  try {
    const { error } = await resend.emails.send({
      from: getFromEmail(),
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    })

    if (error) {
      console.error('[Email] Failed to send:', error)
      throw new Error(error.message)
    }
  } catch (err) {
    console.error('[Email] Error sending email:', err)
    throw err
  }
}

/**
 * Send an email using React Email components
 */
export async function sendReactEmail(options: ReactEmailOptions): Promise<void> {
  if (!resend) {
    console.warn('[Email] Resend not configured - skipping email to:', options.to)
    return
  }

  try {
    const html = await render(options.react)
    const text = await render(options.react, { plainText: true })

    const { error } = await resend.emails.send({
      from: getFromEmail(),
      to: options.to,
      subject: options.subject,
      html,
      text,
    })

    if (error) {
      console.error('[Email] Failed to send:', error)
      throw new Error(error.message)
    }
  } catch (err) {
    console.error('[Email] Error sending email:', err)
    throw err
  }
}
