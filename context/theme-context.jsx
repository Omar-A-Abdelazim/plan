'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { getTheme, saveTheme } from '@/lib/storage'

const ThemeContext = createContext(undefined)

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState('dark')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const savedTheme = getTheme()
    setThemeState(savedTheme)
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      const root = document.documentElement
      if (theme === 'dark') {
        root.classList.add('dark')
      } else {
        root.classList.remove('dark')
      }
      saveTheme(theme)
    }
  }, [theme, mounted])

  const toggleTheme = useCallback(() => {
    setThemeState(prev => prev === 'dark' ? 'light' : 'dark')
  }, [])

  const setTheme = useCallback((newTheme) => {
    setThemeState(newTheme)
  }, [])

  if (!mounted) {
    return <div className="min-h-screen bg-background" />
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
