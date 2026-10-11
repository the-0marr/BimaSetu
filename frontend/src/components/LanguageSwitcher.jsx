import React, { useState, useRef, useEffect } from 'react'
import { Globe, ChevronDown, Check } from 'lucide-react'
import { useLanguage } from '../i18n/LanguageContext'

export default function LanguageSwitcher({ compact = false }) {
  const { lang, setLang, languages, t } = useLanguage()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const current = languages.find((l) => l.code === lang) || languages[0]

  useEffect(() => {
    const close = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-1.5 rounded-full border border-emerald-700/60 text-emerald-200 hover:border-amber-500/50 hover:text-amber-300 transition ${
          compact ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-sm'
        }`}
        aria-label={t('lang.select')}
        aria-expanded={open}
      >
        <Globe className={compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
        <span className="font-medium">{current.native}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 min-w-[140px] rounded-xl border border-emerald-800/60 bg-[#0A120E] shadow-xl z-[60] py-1 overflow-hidden">
          {languages.map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => {
                setLang(l.code)
                setOpen(false)
              }}
              className={`w-full flex items-center justify-between gap-2 px-4 py-2.5 text-sm text-left transition ${
                lang === l.code
                  ? 'bg-amber-500/15 text-amber-400'
                  : 'text-gray-300 hover:bg-emerald-900/40 hover:text-white'
              }`}
            >
              <span>
                <span className="block font-medium">{l.native}</span>
                <span className="block text-xs text-gray-500">{l.label}</span>
              </span>
              {lang === l.code && <Check className="w-4 h-4 shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
