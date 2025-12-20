-- Add content column to articles table for in-app editing
ALTER TABLE articles ADD COLUMN IF NOT EXISTS content TEXT;

-- Add content_updated_at for tracking when content was last modified
ALTER TABLE articles ADD COLUMN IF NOT EXISTS content_updated_at TIMESTAMPTZ;

-- Create an index for faster lookups on content_updated_at
CREATE INDEX IF NOT EXISTS idx_articles_content_updated_at ON articles(content_updated_at);

-- Comment explaining the column purpose
COMMENT ON COLUMN articles.content IS 'Rich text content stored as HTML from Tiptap editor';
COMMENT ON COLUMN articles.content_updated_at IS 'Timestamp of last content modification';
