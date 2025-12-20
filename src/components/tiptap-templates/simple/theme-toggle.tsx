'use client'

// --- UI Primitives ---
import { Button } from '@/components/tiptap-ui-primitive/button'

// --- Icons ---
import { MoonStarIcon } from '@/components/tiptap-icons/moon-star-icon'
import { SunIcon } from '@/components/tiptap-icons/sun-icon'
import { useEffect, useSyncExternalStore, useCallback, useState } from 'react'

function getInitialDarkMode() {
  if (typeof window === 'undefined') return false
  return (
    !!document.querySelector('meta[name="color-scheme"][content="dark"]') ||
    window.matchMedia('(prefers-color-scheme: dark)').matches
  )
}

export function ThemeToggle() {
  const subscribe = useCallback((callback: () => void) => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.addEventListener('change', callback)
    return () => mediaQuery.removeEventListener('change', callback)
  }, [])

  const getSnapshot = useCallback(() => getInitialDarkMode(), [])
  const getServerSnapshot = useCallback(() => false, [])

  const systemDarkMode = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  // Track user override separately
  const [userOverride, setUserOverride] = useState<boolean | null>(null)
  const isDarkMode = userOverride ?? systemDarkMode

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode)
  }, [isDarkMode])

  const toggleDarkMode = () => setUserOverride((prev) => !(prev ?? systemDarkMode))

  return (
    <Button
      onClick={toggleDarkMode}
      aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
      data-style="ghost"
    >
      {isDarkMode ? (
        <MoonStarIcon className="tiptap-button-icon" />
      ) : (
        <SunIcon className="tiptap-button-icon" />
      )}
    </Button>
  )
}
