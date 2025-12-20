import { Button, Section, Text } from '@react-email/components'
import * as React from 'react'
import { BaseLayout } from './base-layout'

interface StageChangeEmailProps {
  headline: string
  articleTitle: string
  fromStage?: string
  toStage?: string
  googleDocUrl?: string
}

export function StageChangeEmail({
  headline = 'Article moved to Ready for Editing',
  articleTitle = 'Sample Article Title',
  fromStage,
  toStage,
  googleDocUrl,
}: StageChangeEmailProps) {
  return (
    <BaseLayout preview={`${headline}: ${articleTitle}`}>
      <Text style={headingStyle}>{headline}</Text>
      <Text style={articleTitleStyle}>{articleTitle}</Text>

      {fromStage && toStage && (
        <Section style={stageBox}>
          <Text style={stageText}>
            Stage changed from <strong>{fromStage}</strong> to{' '}
            <strong>{toStage}</strong>
          </Text>
        </Section>
      )}

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

const stageBox = {
  marginBottom: '24px',
  padding: '16px',
  backgroundColor: '#f4f4f5',
  borderRadius: '6px',
}

const stageText = {
  margin: '0',
  fontSize: '14px',
  color: '#52525b',
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

export default StageChangeEmail
