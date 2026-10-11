import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { translations, LANGUAGES, DEFAULT_LANG } from './translations'

const STORAGE_KEY = 'bimasetu_lang'

const LanguageContext = createContext(null)

function getNested(obj, path) {
  return path.split('.').reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj)
}

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved && translations[saved]) return saved
    } catch {
      /* ignore */
    }
    return DEFAULT_LANG
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, lang)
    document.documentElement.lang = lang
  }, [lang])

  const setLang = useCallback((code) => {
    if (translations[code]) setLangState(code)
  }, [])

  const t = useCallback(
    (key, vars) => {
      let str = getNested(translations[lang], key) ?? getNested(translations.en, key) ?? key
      if (typeof str !== 'string') return key
      if (vars) {
        Object.entries(vars).forEach(([k, v]) => {
          str = str.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), String(v))
        })
      }
      return str
    },
    [lang]
  )

  const value = useMemo(() => ({ lang, setLang, t, languages: LANGUAGES }), [lang, setLang, t])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
  return ctx
}
