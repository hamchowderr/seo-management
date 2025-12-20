import { Button, Section, Text } from '@react-email/components'
import * as React from 'react'
import { BaseLayout } from './base-layout'

interface ArticlePublishedEmailProps {
  articleTitle: string
  publishedUrl?: string
  googleDocUrl?: string
}

export function ArticlePublishedEmail({
  articleTitle = 'Sample Article Title',
  publishedUrl,
  googleDocUrl,
}: ArticlePublishedEmailProps) {
  return (
    <BaseLayout preview={`Article Published: ${articleTitle}`}>
      <Text style={headingStyle}>Article Published</Text>
      <Text style={articleTitleStyle}>{articleTitle}</Text>

      <Section style={successBox}>
        <Text style={successText}>
          This article has been published and is now live.
        </Text>
      </Section>

      <Section style={buttonContainer}>
        {publishedUrl && (
          <Button style={primaryButton} href={publishedUrl}>
            View Published Article
          </Button>
        )}
        {googleDocUrl && (
          <Button style={secondaryButton} href={googleDocUrl}>
            Open Google Doc
          </Button>
        )}
      </Section>
    </BaseLayout>
  )
}

const headingStyle = {
  margin: '0 0 16px 0',
  fontSize: '20px',
  fontWeight: '600',
  color: '#18181b',
}

const articleTitleStyle = {
  margin: '0 0 24px 0',
  fontSize: '16px',
  fontWeight: '700',
  color: '#3f3f46',
}

const successBox = {
  marginBottom: '24px',
  padding: '16px',
  backgroundColor: '#dcfce7',
  borderRadius: '6px',
}

const successText = {
  margin: '0',
  fontSize: '14px',
  color: '#166534',
}

const buttonContainer = {
  display: 'flex',
  gap: '12px',
}

const primaryButton = {
  display: 'inline-block',
  padding: '12px 24px',
  backgroundColor: '#16a34a',
  color: '#ffffff',
  textDecoration: 'none',
  borderRadius: '6px',
  fontSize: '14px',
  fontWeight: '500',
  marginRight: '12px',
}

const secondaryButton = {
  display: 'inline-block',
  padding: '12px 24px',
  backgroundColor: '#18181b',
  color: '#ffffff',
  textDecoration: 'none',
  borderRadius: '6px',
  fontSize: '14px',
  fontWeight: '500',
}

export default ArticlePublishedEmail
