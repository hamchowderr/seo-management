import { Button, Section, Text } from '@react-email/components'
import * as React from 'react'
import { BaseLayout } from './base-layout'

interface ArticleCreatedEmailProps {
  articleTitle: string
  googleDocUrl?: string
}

export function ArticleCreatedEmail({
  articleTitle = 'Sample Article Title',
  googleDocUrl,
}: ArticleCreatedEmailProps) {
  return (
    <BaseLayout preview={`New Article Created: ${articleTitle}`}>
      <Text style={headingStyle}>New Article Created</Text>
      <Text style={articleTitleStyle}>{articleTitle}</Text>

      <Section style={infoBox}>
        <Text style={infoText}>
          A new article has been created and is ready for writing.
        </Text>
      </Section>

      {googleDocUrl && (
        <Button style={button} href={googleDocUrl}>
          Open Google Doc
        </Button>
      )}
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

const infoBox = {
  marginBottom: '24px',
  padding: '16px',
  backgroundColor: '#dbeafe',
  borderRadius: '6px',
}

const infoText = {
  margin: '0',
  fontSize: '14px',
  color: '#1e40af',
}

const button = {
  display: 'inline-block',
  padding: '12px 24px',
  backgroundColor: '#18181b',
  color: '#ffffff',
  textDecoration: 'none',
  borderRadius: '6px',
  fontSize: '14px',
  fontWeight: '500',
}

export default ArticleCreatedEmail
