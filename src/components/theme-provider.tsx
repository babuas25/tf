'use client'

import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react'

import { getTheme, subscribeTheme } from '@/lib/firebase/theme'
import { ThemeName, THEME_NAMES, ThemeSystemState, getThemeTokens } from '@/lib/themeColors'

export type ThemeContextValue = ThemeSystemState & {
  setColor: (c: ThemeName) => void
  setMode: (m: 'light' | 'dark') => void
}

const ThemeSystemContext = createContext<ThemeContextValue | null>(null)

const STORAGE_KEY = 'tripfeels-theme-system'

export function ThemeSystemProvider({ children }: { children: ReactNode }) {
  const [color, setColor] = useState<ThemeName>('default')
  const [mode, setMode] = useState<'light' | 'dark'>('light')

  // hydrate from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as ThemeSystemState
        if (parsed.color && (THEME_NAMES as readonly string[]).includes(parsed.color))
          setColor(parsed.color)
        if (parsed.mode === 'light' || parsed.mode === 'dark') setMode(parsed.mode)
      }
    } catch (e) {
      void e
    }
  }, [])

  // hydrate from Firestore (global) and subscribe for realtime updates
  useEffect(() => {
    let unsub: (() => void) | undefined
    void (async () => {
      try {
        const remote = await getTheme()
        if (remote) {
          if (remote.colorTheme && (THEME_NAMES as readonly string[]).includes(remote.colorTheme)) {
            setColor(remote.colorTheme as ThemeName)
          }
          if (remote.mode === 'light' || remote.mode === 'dark') setMode(remote.mode)
        }
      } catch (e) {
        void e
      }

      // subscribe to future updates
      unsub = subscribeTheme((doc) => {
        if (!doc) return
        if (doc.colorTheme && (THEME_NAMES as readonly string[]).includes(doc.colorTheme)) {
          setColor(doc.colorTheme as ThemeName)
        }
        if (doc.mode === 'light' || doc.mode === 'dark') setMode(doc.mode)
      })
    })()
    return () => {
      if (unsub) unsub()
    }
  }, [])

  // persist and apply CSS vars
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ color, mode }))
    } catch (e) {
      void e
    }

    const root = document.documentElement

    // toggle light/dark class for tailwind
    root.classList.remove('light', 'dark')
    root.classList.add(mode)

    // expose selected color name to CSS
    root.setAttribute('data-theme-color', color)

    // point base tokens to selected theme tokens
    const tokens = getThemeTokens(color)
    Object.entries(tokens).forEach(([k, v]) => {
      root.style.setProperty(k, v)
    })
  }, [color, mode])

  const value = useMemo(() => ({ color, mode, setColor, setMode }), [color, mode])

  return <ThemeSystemContext.Provider value={value}>{children}</ThemeSystemContext.Provider>
}

export function useThemeSystem() {
  const ctx = useContext(ThemeSystemContext)
  if (!ctx) throw new Error('useThemeSystem must be used within ThemeSystemProvider')
  return ctx
}
