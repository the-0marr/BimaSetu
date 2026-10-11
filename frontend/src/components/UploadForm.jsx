// frontend/src/components/UploadForm.jsx

import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../i18n/LanguageContext'

const BACKEND = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function UploadForm({ captureData, onResult, onReset, onLoadingChange }) {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [progress, setProgress] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!captureData?.blob) {
      setError(t('upload.captureFirst'))
      return
    }

    // Front-end GPS validation
    if (!captureData.lat || !captureData.lng || captureData.lat === 0.0 || captureData.lng === 0.0) {
      setError("Geo-tag location missing. Enable GPS.")
      return
    }

    setLoading(true)
    onLoadingChange?.(true)
    setError(null)

    const claimId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

    const form = new FormData()
    form.append('image', captureData.blob, 'crop.jpg')
    form.append('lat', captureData.lat ?? 0)
    form.append('lng', captureData.lng ?? 0)
    form.append('timestamp', captureData.timestamp ?? new Date().toISOString())
    form.append('uid', user?.uid ?? 'anonymous')
    form.append('display_name', user?.displayName ?? t('common.farmer'))
    form.append('claim_id', claimId)

    try {
      setProgress(t('upload.uploading'))
      const res = await fetch(`${BACKEND}/api/analyze`, { method: 'POST', body: form })

      setProgress(t('upload.analyzing'))
      const json = await res.json()

      if (!json.success) throw new Error(json.error || t('upload.failed'))

      setProgress(t('upload.generating'))
      await new Promise((r) => setTimeout(r, 500))

      onResult?.(json.data)
    } catch (err) {
      console.error('Submit error:', err)
      let msg = err.message || t('upload.errorGeneric')
      if (msg.includes("Geo-tag missing") || msg.includes("Geo-tag not found")) {
        msg = "❌ Geo-tag not found. Enable location permission and capture image."
      } else if (msg.includes("Please upload crop field") || msg.includes("crop field image only")) {
        msg = "❌ Invalid image. Please upload crop field image only."
      }
      setError(msg)
    } finally {
      setLoading(false)
      setProgress('')
      onLoadingChange?.(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="bg-[#FCFAF5] border border-[#E6DCC9] rounded-xl p-4 flex items-center gap-3">
        {user?.photoURL ? (
          <img src={user.photoURL} alt="" className="w-10 h-10 rounded-full border border-[#E6DCC9]" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-[#E88125] flex items-center justify-center text-white font-semibold text-sm">
            {user?.displayName?.[0] ?? 'F'}
          </div>
        )}
        <div>
          <p className="text-sm font-bold text-[#10261C]">{user?.displayName ?? t('upload.farmer')}</p>
          <p className="text-xs text-gray-500 font-mono">{user?.uid?.slice(0, 16)}…</p>
        </div>
      </div>

      {captureData ? (
        <div className="flex items-center gap-2 text-sm text-green-800 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
          <span className="text-green-600 text-base font-bold">✓</span>
          <span>
            {t('upload.photoReady')} · {new Date(captureData.timestamp).toLocaleString()}
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <span>⚠️</span>
          <span>{t('upload.noPhoto')}</span>
        </div>
      )}

      {error && (
        <div className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !captureData}
        className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#E88125] hover:bg-[#cf6f1b] text-white font-bold rounded-xl transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
      >
        {loading ? (
          <>
            <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
            <span>{progress || t('upload.processing')}</span>
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
              />
            </svg>
            {t('upload.analyseBtn')}
          </>
        )}
      </button>

      {captureData && !loading && (
        <button
          type="button"
          onClick={onReset}
          className="w-full text-sm text-gray-500 hover:text-[#10261C] transition-colors font-medium"
        >
          {t('upload.startOver')}
        </button>
      )}
    </form>
  )
}
