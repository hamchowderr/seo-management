import * as React from 'react'
import { createAdminClient } from '@/lib/supabase-admin'
import {
  isSlackConfigured,
  postMessage,
  sendDM,
  buildArticleMessage,
  lookupUserByEmail,
} from '@/lib/slack'
import { isEmailConfigured, sendReactEmail } from '@/lib/email'
import { StageChangeEmail, AssignmentEmail } from '../../emails'
import { STAGE_LABELS, type ArticleStage } from '@/lib/constants/stages'
import type { Database } from '@/types/database'

type NotificationPreference = Database['public']['Enums']['notification_preference']

interface ArticleForNotification {
  id: string
  full_title?: string | null
  title?: string | null
  google_doc_url?: string | null
  published_url?: string | null
  company_id: string
}

interface UserForNotification {
  id: string
  full_name: string
  email: string
  slack_user_id?: string | null
  notification_preference: NotificationPreference
}

// Cache for email -> Slack ID lookups (in-memory, lasts for server lifetime)
const slackIdCache = new Map<string, string | null>()

interface CompanyForNotification {
  id: string
  name: string
  slack_channel_id?: string | null
}

/**
 * Get Slack user ID by email (with caching)
 */
async function getSlackUserId(email: string): Promise<string | null> {
  // Check cache first
  if (slackIdCache.has(email)) {
    return slackIdCache.get(email) || null
  }

  // Look up in Slack
  const slackId = await lookupUserByEmail(email)

  // Cache the result (even if null, to avoid repeated lookups)
  slackIdCache.set(email, slackId)

  return slackId
}

interface EmailData {
  subject: string
  react: React.ReactElement
}

/**
 * Send a notification based on user preference
 */
async function sendNotification(
  user: UserForNotification,
  message: string,
  blocks?: Array<Record<string, unknown>>,
  emailData?: EmailData
): Promise<void> {
  const preference = user.notification_preference

  // Slack notification
  if ((preference === 'slack' || preference === 'both') && isSlackConfigured()) {
    try {
      // Use stored slack_user_id, or look up by email
      const slackUserId = user.slack_user_id || (await getSlackUserId(user.email))

      if (slackUserId) {
        await sendDM(slackUserId, message, blocks)
      }
    } catch (error) {
      console.error(`Failed to send Slack DM to ${user.full_name}:`, error)
    }
  }

  // Email notification
  if ((preference === 'email' || preference === 'both') && isEmailConfigured() && emailData) {
    try {
      await sendReactEmail({
        to: user.email,
        subject: emailData.subject,
        react: emailData.react,
      })
    } catch (error) {
      console.error(`Failed to send email to ${user.email}:`, error)
    }
  }
}

/**
 * Post notification to company's Slack channel
 */
async function notifyChannel(
  company: CompanyForNotification,
  message: string,
  blocks?: Array<Record<string, unknown>>
): Promise<void> {
  if (!isSlackConfigured() || !company.slack_channel_id) {
    return
  }

  try {
    await postMessage(company.slack_channel_id, message, blocks)
  } catch (error) {
    console.error(`Failed to post to channel for ${company.name}:`, error)
  }
}

/**
 * Get company data for an article
 */
async function getCompanyForArticle(companyId: string): Promise<CompanyForNotification | null> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('companies')
    .select('id, name, slack_channel_id')
    .eq('id', companyId)
    .single()
  return data
}

/**
 * Get users to notify for a specific role
 */
async function getUsersByRole(role: string, companyId?: string): Promise<UserForNotification[]> {
  const supabase = createAdminClient()

  let query = supabase
    .from('users')
    .select('id, full_name, email, slack_user_id, notification_preference')
    .eq('role', role)
    .eq('is_active', true)

  // If company is specified, filter by users assigned to that company
  if (companyId) {
    const { data: userCompanies } = await supabase
      .from('user_companies')
      .select('user_id')
      .eq('company_id', companyId)

    if (userCompanies && userCompanies.length > 0) {
      const userIds = userCompanies.map((uc) => uc.user_id)
      query = query.in('id', userIds)
    }
  }

  const { data } = await query
  return data || []
}

/**
 * Get assigned user for an article at a specific role
 */
async function getAssignedUser(
  articleId: string,
  role: string
): Promise<UserForNotification | null> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('article_assignments')
    .select(
      `
      users (
        id,
        full_name,
        email,
        slack_user_id,
        notification_preference
      )
    `
    )
    .eq('article_id', articleId)
    .eq('assigned_role', role)
    .eq('is_active', true)
    .single()

  if (!data?.users) return null

  // Supabase returns nested relations - users is the related user object
  const user = data.users as unknown as UserForNotification
  return user
}

/**
 * Notify when an article moves to a new stage
 */
export async function notifyStageChange(
  article: ArticleForNotification,
  fromStage: ArticleStage,
  toStage: ArticleStage
): Promise<void> {
  const company = await getCompanyForArticle(article.company_id)
  if (!company) return

  const fromLabel = STAGE_LABELS[fromStage]
  const toLabel = STAGE_LABELS[toStage]
  const headline = `Article moved to ${toLabel}`
  const articleTitle = article.full_title || article.title || 'Untitled Article'

  const { text, blocks } = buildArticleMessage(headline, article, `Moved from ${fromLabel}`)

  // Build email data using React Email
  const emailData: EmailData = {
    subject: `[SEO Monster] ${headline}`,
    react: React.createElement(StageChangeEmail, {
      headline,
      articleTitle,
      fromStage: fromLabel,
      toStage: toLabel,
      googleDocUrl: article.google_doc_url || undefined,
    }),
  }

  // Post to company channel
  await notifyChannel(company, text, blocks)

  // DM specific users based on the new stage
  const stageRoleMap: Partial<Record<ArticleStage, string>> = {
    needs_writing: 'writer',
    ready_for_editing: 'editor',
    assigned_for_posting: 'poster',
  }

  const roleToNotify = stageRoleMap[toStage]
  if (roleToNotify) {
    // Check if there's an assigned user for this role
    const assignedUser = await getAssignedUser(article.id, roleToNotify)
    if (assignedUser) {
      await sendNotification(assignedUser, text, blocks, emailData)
    }
  }

  // Always notify admins for approval stage
  if (toStage === 'ready_for_approval') {
    const admins = await getUsersByRole('admin')
    for (const admin of admins) {
      await sendNotification(admin, text, blocks, emailData)
    }
  }
}

/**
 * Notify when a user is assigned to an article
 */
export async function notifyAssignment(
  article: ArticleForNotification,
  assignee: UserForNotification,
  role: string
): Promise<void> {
  const company = await getCompanyForArticle(article.company_id)
  if (!company) return

  const headline = `${assignee.full_name} assigned as ${role}`
  const articleTitle = article.full_title || article.title || 'Untitled Article'
  const { text, blocks } = buildArticleMessage(headline, article)

  // Post to company channel
  await notifyChannel(company, text, blocks)

  // DM the assigned user with email
  const dmHeadline = `You've been assigned as ${role}`
  const { text: dmText, blocks: dmBlocks } = buildArticleMessage(dmHeadline, article)
  const emailData: EmailData = {
    subject: `[SEO Monster] Assigned as ${role}: ${articleTitle}`,
    react: React.createElement(AssignmentEmail, {
      assigneeName: assignee.full_name,
      role,
      articleTitle,
      googleDocUrl: article.google_doc_url || undefined,
    }),
  }
  await sendNotification(assignee, dmText, dmBlocks, emailData)
}

/**
 * Notify when a new article is created
 */
export async function notifyArticleCreated(article: ArticleForNotification): Promise<void> {
  const company = await getCompanyForArticle(article.company_id)
  if (!company) return

  const { text, blocks } = buildArticleMessage('New article created', article)

  // Post to company channel
  await notifyChannel(company, text, blocks)
}

/**
 * Notify when an article is published
 */
export async function notifyArticlePublished(article: ArticleForNotification): Promise<void> {
  const company = await getCompanyForArticle(article.company_id)
  if (!company) return

  const { text, blocks } = buildArticleMessage(
    'Article published',
    article,
    article.published_url ? `Live at: ${article.published_url}` : undefined
  )

  // Post to company channel
  await notifyChannel(company, text, blocks)
}
