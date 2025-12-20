import { render } from '@react-email/components'
import {
  StageChangeEmail,
  AssignmentEmail,
  ArticleCreatedEmail,
  ArticlePublishedEmail,
} from '../../../../../emails'

const emailTemplates = [
  {
    id: 'stage-change',
    name: 'Stage Change',
    component: StageChangeEmail({
      headline: 'Article moved to Ready for Editing',
      articleTitle: 'How to Optimize Your Website for SEO in 2025',
      fromStage: 'Needs Writing',
      toStage: 'Ready for Editing',
      googleDocUrl: 'https://docs.google.com/document/d/example',
    }),
  },
  {
    id: 'assignment',
    name: 'Assignment',
    component: AssignmentEmail({
      assigneeName: 'John Smith',
      role: 'writer',
      articleTitle: 'Complete Guide to Content Marketing',
      googleDocUrl: 'https://docs.google.com/document/d/example',
    }),
  },
  {
    id: 'article-created',
    name: 'Article Created',
    component: ArticleCreatedEmail({
      articleTitle: 'New SEO Strategies for Small Businesses',
      googleDocUrl: 'https://docs.google.com/document/d/example',
    }),
  },
  {
    id: 'article-published',
    name: 'Article Published',
    component: ArticlePublishedEmail({
      articleTitle: '10 Tips for Better Search Rankings',
      publishedUrl: 'https://example.com/blog/10-tips-for-better-search-rankings',
      googleDocUrl: 'https://docs.google.com/document/d/example',
    }),
  },
]

export default async function EmailPreviewPage() {
  const renderedEmails = await Promise.all(
    emailTemplates.map(async (template) => ({
      ...template,
      html: await render(template.component),
    }))
  )

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="mx-auto max-w-4xl px-4">
        <h1 className="mb-8 text-3xl font-bold text-gray-900">Email Templates Preview</h1>
        <p className="mb-8 text-gray-600">
          Preview all email templates. These are the actual rendered emails that will be sent.
        </p>

        <div className="space-y-8">
          {renderedEmails.map((template) => (
            <div
              key={template.id}
              data-testid={`email-${template.id}`}
              className="overflow-hidden rounded-lg bg-white shadow-lg"
            >
              <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
                <h2 className="text-lg font-semibold text-gray-900">{template.name}</h2>
              </div>
              <div className="p-0">
                <iframe
                  srcDoc={template.html}
                  title={template.name}
                  className="h-[600px] w-full border-0"
                  data-testid={`email-iframe-${template.id}`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
