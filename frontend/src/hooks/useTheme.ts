import { useEffect, useState } from 'react'

export type Theme = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'pos-theme'

function getSystemTheme(): 'light' | 'dark' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(theme: Theme) {
  const root = document.documentElement
  const resolved = theme === 'system' ? getSystemTheme() : theme

  root.classList.remove('light', 'dark')

  if (resolved === 'dark') {
    root.classList.add('dark')
  } else {
    // Añadir .light para que el @media query no aplique cuando el usuario eligió light
    root.classList.add('light')
  }
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      return (localStorage.getItem(STORAGE_KEY) as Theme) ?? 'system'
    } catch {
      return 'system'
    }
  })

  // Aplicar tema al montar y cuando cambia
  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  // Escuchar cambios del sistema cuando el tema es "system"
  useEffect(() => {
    if (theme !== 'system') return

    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => applyTheme('system')

    media.addEventListener('change', handler)
    return () => media.removeEventListener('change', handler)
  }, [theme])

  function setTheme(newTheme: Theme) {
    try {
      if (newTheme === 'system') {
        localStorage.removeItem(STORAGE_KEY)
      } else {
        localStorage.setItem(STORAGE_KEY, newTheme)
      }
    } catch {
      // localStorage no disponible (ej. modo privado con bloqueo)
    }
    setThemeState(newTheme)
  }

  return { theme, setTheme }
}
