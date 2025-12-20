import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import * as React from 'react'

interface BaseLayoutProps {
  preview: string
  children: React.ReactNode
}

export function BaseLayout({ preview, children }: BaseLayoutProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logo}>SEO Monster</Text>
          </Section>
          <Section style={content}>{children}</Section>
          <Hr style={hr} />
          <Section style={footer}>
            <Text style={footerText}>
              This is an automated notification from SEO Monster.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

const main = {
  backgroundColor: '#f4f4f5',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
}

const container = {
  margin: '40px auto',
  padding: '0',
  maxWidth: '600px',
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
}

const header = {
  padding: '32px 40px',
  borderBottom: '1px solid #e4e4e7',
}

const logo = {
  margin: '0',
  fontSize: '24px',
  fontWeight: '700',
  color: '#18181b',
}

const content = {
  padding: '32px 40px',
}

const hr = {
  borderColor: '#e4e4e7',
  margin: '0',
}

const footer = {
  padding: '24px 40px',
}

const footerText = {
  margin: '0',
  fontSize: '12px',
  color: '#71717a',
  textAlign: 'center' as const,
}

export default BaseLayout
