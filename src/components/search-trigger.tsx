'use client'

import { Search } from 'lucide-react'

export function SearchTrigger() {
  const handleClick = () => {
    // Simulate Ctrl+K / Cmd+K to open command menu
    const event = new KeyboardEvent('keydown', {
      key: 'k',
      metaKey: true,
      ctrlKey: true,
      bubbles: true,
    })
    document.dispatchEvent(event)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring hover:bg-accent flex h-10 w-full cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:max-w-md"
    >
      <Search className="text-muted-foreground h-4 w-4" />
      <span className="text-muted-foreground flex-1 text-left">Search articles, keywords...</span>
      <kbd className="bg-muted text-muted-foreground pointer-events-none hidden h-5 items-center gap-1 rounded border px-1.5 font-mono text-[10px] font-medium sm:flex">
        <span className="text-xs">⌘</span>K
      </kbd>
    </button>
  )
}
