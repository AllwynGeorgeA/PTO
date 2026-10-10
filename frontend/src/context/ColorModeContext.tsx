import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

type ColorMode = 'light' | 'dark'

interface ColorModeContextType {
  colorMode: ColorMode
  toggleColorMode: () => void
}

const ColorModeContext = createContext<ColorModeContextType | undefined>(undefined)

const initialMode = (): ColorMode => {
  try {
    const saved = localStorage.getItem('color_mode')
    if (saved === 'light' || saved === 'dark') return saved
  } catch {
    // storage unavailable: fall through to system preference
  }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function ColorModeProvider({ children }: { children: ReactNode }) {
  const [colorMode, setColorMode] = useState<ColorMode>(initialMode)

  // Chakra v3 reads the `dark` / `light` class on <html>.
  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(colorMode)
    root.style.colorScheme = colorMode
    try {
      localStorage.setItem('color_mode', colorMode)
    } catch {
      // ignore
    }
  }, [colorMode])

  const toggleColorMode = useCallback(() => setColorMode((m) => (m === 'dark' ? 'light' : 'dark')), [])
  const value = useMemo(() => ({ colorMode, toggleColorMode }), [colorMode, toggleColorMode])

  return <ColorModeContext.Provider value={value}>{children}</ColorModeContext.Provider>
}

export function useColorMode(): ColorModeContextType {
  const ctx = useContext(ColorModeContext)
  if (!ctx) throw new Error('useColorMode must be used inside ColorModeProvider')
  return ctx
}
