import * as React from 'react'

// Breakpoint constants aligned with Tailwind defaults
export const BREAKPOINTS = {
  mobile: 0,
  tablet: 768,
  desktop: 1024,
} as const

export type Breakpoint = 'mobile' | 'tablet' | 'desktop'

const MOBILE_BREAKPOINT = BREAKPOINTS.tablet
const DESKTOP_BREAKPOINT = BREAKPOINTS.desktop

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener('change', onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener('change', onChange)
  }, [])

  return !!isMobile
}

export function useIsTablet() {
  const [isTablet, setIsTablet] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const checkTablet = () => {
      const width = window.innerWidth
      setIsTablet(width >= MOBILE_BREAKPOINT && width < DESKTOP_BREAKPOINT)
    }

    const mql = window.matchMedia(
      `(min-width: ${MOBILE_BREAKPOINT}px) and (max-width: ${DESKTOP_BREAKPOINT - 1}px)`
    )
    mql.addEventListener('change', checkTablet)
    checkTablet()
    return () => mql.removeEventListener('change', checkTablet)
  }, [])

  return !!isTablet
}

export function useIsDesktop() {
  const [isDesktop, setIsDesktop] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(min-width: ${DESKTOP_BREAKPOINT}px)`)
    const onChange = () => {
      setIsDesktop(window.innerWidth >= DESKTOP_BREAKPOINT)
    }
    mql.addEventListener('change', onChange)
    setIsDesktop(window.innerWidth >= DESKTOP_BREAKPOINT)
    return () => mql.removeEventListener('change', onChange)
  }, [])

  return !!isDesktop
}

export function useBreakpoint(): Breakpoint {
  const isMobile = useIsMobile()
  const isDesktop = useIsDesktop()

  if (isMobile) return 'mobile'
  if (isDesktop) return 'desktop'
  return 'tablet'
}
