'use client'

import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react'
import { EditorContent, EditorContext, useEditor } from '@tiptap/react'
import { StarterKit } from '@tiptap/starter-kit'
import { Image } from '@tiptap/extension-image'
import { TaskItem, TaskList } from '@tiptap/extension-list'
import { TextAlign } from '@tiptap/extension-text-align'
import { Typography } from '@tiptap/extension-typography'
import { Highlight } from '@tiptap/extension-highlight'
import { Subscript } from '@tiptap/extension-subscript'
import { Superscript } from '@tiptap/extension-superscript'
import { Selection } from '@tiptap/extensions'
import { Save, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

// Tiptap UI components
import { Spacer } from '@/components/tiptap-ui-primitive/spacer'
import { Toolbar, ToolbarGroup, ToolbarSeparator } from '@/components/tiptap-ui-primitive/toolbar'
import { HorizontalRule } from '@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node-extension'
import { HeadingDropdownMenu } from '@/components/tiptap-ui/heading-dropdown-menu'
import { ListDropdownMenu } from '@/components/tiptap-ui/list-dropdown-menu'
import { BlockquoteButton } from '@/components/tiptap-ui/blockquote-button'
import { CodeBlockButton } from '@/components/tiptap-ui/code-block-button'
import { ColorHighlightPopover } from '@/components/tiptap-ui/color-highlight-popover'
import { LinkPopover } from '@/components/tiptap-ui/link-popover'
import { MarkButton } from '@/components/tiptap-ui/mark-button'
import { TextAlignButton } from '@/components/tiptap-ui/text-align-button'
import { UndoRedoButton } from '@/components/tiptap-ui/undo-redo-button'

// Import node styles
import '@/components/tiptap-node/blockquote-node/blockquote-node.scss'
import '@/components/tiptap-node/code-block-node/code-block-node.scss'
import '@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node.scss'
import '@/components/tiptap-node/list-node/list-node.scss'
import '@/components/tiptap-node/image-node/image-node.scss'
import '@/components/tiptap-node/heading-node/heading-node.scss'
import '@/components/tiptap-node/paragraph-node/paragraph-node.scss'
import '@/components/articles/article-editor.scss'

export type InsertMode = 'replace' | 'title' | 'append'

export interface ArticleEditorRef {
  insertContent: (content: string, mode?: InsertMode) => void
  streamContent: (content: string) => void
  getContent: () => string
}

interface ArticleEditorProps {
  articleId: string
  initialContent?: string | null
  onSave?: () => void
  aiGenerateButton?: React.ReactNode
}

export const ArticleEditor = forwardRef<ArticleEditorRef, ArticleEditorProps>(
  function ArticleEditor({ articleId, initialContent, onSave, aiGenerateButton }, ref) {
    const [saving, setSaving] = useState(false)
    const [hasChanges, setHasChanges] = useState(false)
    const toolbarRef = useRef<HTMLDivElement>(null)

    const editor = useEditor({
      immediatelyRender: false,
      editorProps: {
        attributes: {
          autocomplete: 'off',
          autocorrect: 'off',
          autocapitalize: 'off',
          'aria-label': 'Article content editor',
          class: 'simple-editor',
        },
      },
      extensions: [
        StarterKit.configure({
          horizontalRule: false,
          link: {
            openOnClick: false,
            enableClickSelection: true,
          },
        }),
        HorizontalRule,
        TextAlign.configure({ types: ['heading', 'paragraph'] }),
        TaskList,
        TaskItem.configure({ nested: true }),
        Highlight.configure({ multicolor: true }),
        Image,
        Typography,
        Superscript,
        Subscript,
        Selection,
      ],
      content: initialContent || '<p>Start writing your article...</p>',
      onUpdate: () => {
        setHasChanges(true)
      },
    })

    // Expose methods via ref for AI content insertion
    useImperativeHandle(ref, () => ({
      insertContent: (content: string, mode: InsertMode = 'replace') => {
        if (!editor) return

        switch (mode) {
          case 'title': {
            // Find and replace existing H1, or insert at beginning
            const { doc } = editor.state
            let h1Pos: { from: number; to: number } | null = null

            doc.descendants((node, pos) => {
              if (node.type.name === 'heading' && node.attrs.level === 1) {
                h1Pos = { from: pos, to: pos + node.nodeSize }
                return false // Stop searching
              }
              return true
            })

            if (h1Pos !== null) {
              // Replace existing H1
              const pos = h1Pos as { from: number; to: number }
              editor.chain().focus().deleteRange(pos).insertContentAt(pos.from, content).run()
            } else {
              // Insert at the beginning
              editor.chain().focus().insertContentAt(0, content).run()
            }
            break
          }
          case 'append': {
            // Append to the end of the document
            editor.chain().focus().insertContentAt(editor.state.doc.content.size, content).run()
            break
          }
          case 'replace':
          default: {
            // Replace all content
            editor.commands.setContent(content)
            break
          }
        }
        setHasChanges(true)
      },
      streamContent: (content: string) => {
        // Stream content in real-time (replaces all content with accumulated stream)
        if (!editor) return
        editor.commands.setContent(content, { emitUpdate: false })
      },
      getContent: () => {
        return editor?.getHTML() || ''
      },
    }))

    // Update editor content when initialContent changes (e.g., after refetch)
    useEffect(() => {
      if (editor && initialContent !== undefined) {
        const currentContent = editor.getHTML()
        // Only update if content is different and we don't have unsaved changes
        if (currentContent !== initialContent && !hasChanges) {
          editor.commands.setContent(initialContent || '<p>Start writing your article...</p>')
        }
      }
    }, [editor, initialContent, hasChanges])

    const handleSave = async () => {
      if (!editor) return

      setSaving(true)
      try {
        const content = editor.getHTML()

        const response = await fetch(`/api/articles/${articleId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content }),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to save')
        }

        toast.success('Content saved successfully')
        setHasChanges(false)
        onSave?.()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to save content')
      } finally {
        setSaving(false)
      }
    }

    if (!editor) {
      return (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
        </div>
      )
    }

    return (
      <div className="space-y-4">
        <div className="article-editor-wrapper">
          <EditorContext.Provider value={{ editor }}>
            <Toolbar ref={toolbarRef} className="article-editor-toolbar">
              <Spacer />

              <ToolbarGroup>
                <UndoRedoButton action="undo" />
                <UndoRedoButton action="redo" />
              </ToolbarGroup>

              <ToolbarSeparator />

              <ToolbarGroup>
                <HeadingDropdownMenu levels={[1, 2, 3, 4]} />
                <ListDropdownMenu types={['bulletList', 'orderedList', 'taskList']} />
                <BlockquoteButton />
                <CodeBlockButton />
              </ToolbarGroup>

              <ToolbarSeparator />

              <ToolbarGroup>
                <MarkButton type="bold" />
                <MarkButton type="italic" />
                <MarkButton type="strike" />
                <MarkButton type="code" />
                <MarkButton type="underline" />
                <ColorHighlightPopover />
                <LinkPopover />
              </ToolbarGroup>

              <ToolbarSeparator />

              <ToolbarGroup>
                <TextAlignButton align="left" />
                <TextAlignButton align="center" />
                <TextAlignButton align="right" />
              </ToolbarGroup>

              {aiGenerateButton && (
                <>
                  <ToolbarSeparator />
                  <ToolbarGroup>{aiGenerateButton}</ToolbarGroup>
                </>
              )}

              <Spacer />
            </Toolbar>

            <div className="article-editor-content">
              <EditorContent editor={editor} role="presentation" />
            </div>
          </EditorContext.Provider>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm">
            {hasChanges ? 'Unsaved changes' : 'All changes saved'}
          </p>
          <Button onClick={handleSave} disabled={saving || !hasChanges}>
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Content
          </Button>
        </div>
      </div>
    )
  }
)
