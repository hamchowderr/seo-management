import { WebClient } from '@slack/web-api'

// Initialize Slack client with bot token
const getSlackClient = () => {
  const token = process.env.SLACK_BOT_TOKEN
  if (!token) {
    throw new Error('SLACK_BOT_TOKEN environment variable is not set')
  }
  return new WebClient(token)
}

/**
 * Check if Slack integration is configured
 */
export function isSlackConfigured(): boolean {
  return !!process.env.SLACK_BOT_TOKEN
}

/**
 * Create a new Slack channel
 * @param name - Channel name (will be converted to lowercase, spaces to hyphens)
 * @returns The channel ID
 */
export async function createChannel(name: string): Promise<string> {
  const slack = getSlackClient()

  // Slack channel names must be lowercase, no spaces, max 80 chars
  const channelName = name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-_]/g, '')
    .slice(0, 80)

  const result = await slack.conversations.create({
    name: channelName,
    is_private: false,
  })

  if (!result.ok || !result.channel?.id) {
    throw new Error(`Failed to create Slack channel: ${result.error}`)
  }

  // Join the channel so the bot can post to it
  await slack.conversations.join({
    channel: result.channel.id,
  })

  return result.channel.id
}

/**
 * Post a message to a Slack channel
 * @param channelId - The channel ID to post to
 * @param text - Plain text message (used as fallback)
 * @param blocks - Optional Block Kit blocks for rich formatting
 */
export async function postMessage(
  channelId: string,
  text: string,
  blocks?: Array<Record<string, unknown>>
): Promise<void> {
  const slack = getSlackClient()

  await slack.chat.postMessage({
    channel: channelId,
    text,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    blocks: blocks as any,
  })
}

/**
 * Send a direct message to a user
 * @param slackUserId - The user's Slack ID
 * @param text - Plain text message
 * @param blocks - Optional Block Kit blocks for rich formatting
 */
export async function sendDM(
  slackUserId: string,
  text: string,
  blocks?: Array<Record<string, unknown>>
): Promise<void> {
  const slack = getSlackClient()

  await slack.chat.postMessage({
    channel: slackUserId, // DMs use user ID as channel
    text,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    blocks: blocks as any,
  })
}

/**
 * Look up a Slack user by their email address
 * @param email - The user's email
 * @returns The Slack user ID, or null if not found
 */
export async function lookupUserByEmail(email: string): Promise<string | null> {
  const slack = getSlackClient()

  try {
    const result = await slack.users.lookupByEmail({ email })
    return result.user?.id || null
  } catch {
    // User not found in Slack workspace
    console.warn(`Slack user not found for email: ${email}`)
    return null
  }
}

/**
 * Invite a user to a channel
 * @param channelId - The channel ID
 * @param userId - The Slack user ID to invite
 */
export async function inviteToChannel(channelId: string, userId: string): Promise<void> {
  const slack = getSlackClient()

  try {
    await slack.conversations.invite({
      channel: channelId,
      users: userId,
    })
  } catch (error: unknown) {
    // Ignore "already_in_channel" error
    const slackError = error as { data?: { error?: string } }
    if (slackError.data?.error !== 'already_in_channel') {
      console.error(`Failed to invite user ${userId} to channel ${channelId}:`, error)
    }
  }
}

/**
 * Build a notification message with article details
 */
export function buildArticleMessage(
  headline: string,
  article: {
    full_title?: string | null
    title?: string | null
    google_doc_url?: string | null
    published_url?: string | null
  },
  additionalText?: string
): { text: string; blocks: Array<Record<string, unknown>> } {
  const title = article.full_title || article.title || 'Untitled'
  const text = `${headline}: ${title}`

  const blocks: Array<Record<string, unknown>> = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*${headline}*\n${title}`,
      },
    },
  ]

  // Add links if available
  const links: string[] = []
  if (article.google_doc_url) {
    links.push(`<${article.google_doc_url}|Open Google Doc>`)
  }
  if (article.published_url) {
    links.push(`<${article.published_url}|View Published Article>`)
  }

  if (links.length > 0) {
    blocks.push({
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: links.join(' | '),
        },
      ],
    })
  }

  if (additionalText) {
    blocks.push({
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: additionalText,
        },
      ],
    })
  }

  return { text, blocks }
}
