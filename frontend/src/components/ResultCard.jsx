// frontend/src/components/ResultCard.jsx

import { useLanguage } from '../i18n/LanguageContext'

const TYPE_CONFIG = {
  waterlogging: { emoji: '💧', color: 'text-blue-400', bg: 'bg-blue-900/30', border: 'border-blue-700/50' },
  lodging: { emoji: '🌾', color: 'text-yellow-400', bg: 'bg-yellow-900/30', border: 'border-yellow-700/50' },
  hail: { emoji: '🌨️', color: 'text-cyan-400', bg: 'bg-cyan-900/30', border: 'border-cyan-700/50' },
  pest: { emoji: '🐛', color: 'text-orange-400', bg: 'bg-orange-900/30', border: 'border-orange-700/50' },
}

function SeverityBar({ pct, t }) {
  const color =
    pct >= 75 ? 'bg-red-500' : pct >= 50 ? 'bg-amber-500' : pct >= 25 ? 'bg-orange-400' : 'bg-green-500'
  const label =
    pct >= 75
      ? t('result.severe')
      : pct >= 50
        ? t('result.high')
        : pct >= 25
          ? t('result.moderate')
          : t('result.low')
  return (
    <div>
      <div className="flex justify-between text-xs text-forest-400 mb-1.5">
        <span>{t('result.damageExtent')}</span>
        <span className="font-medium text-white">{label}</span>
      </div>
      <div className="w-full h-2.5 bg-forest-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${color}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
    </div>
  )
}

export default function ResultCard({ result, onNewClaim }) {
  const { t } = useLanguage()
  if (!result) return null

  const { damage_pct, damage_type, confidence, mask_url, image_url, pdf_url, claim_id } = result
  const typeConf = TYPE_CONFIG[damage_type] ?? TYPE_CONFIG.pest

  return (
    <div className="space-y-5 animate-fade-up">
      <div className="flex items-center gap-3 bg-green-900/30 border border-green-700/50 rounded-2xl px-5 py-4">
        <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-xl flex-shrink-0">
          ✓
        </div>
        <div>
          <p className="font-semibold text-green-300">{t('result.complete')}</p>
          <p className="text-xs text-green-500 font-mono">
            {t('result.claim', { id: claim_id?.slice(0, 12) })}
          </p>
        </div>
      </div>

      <div className="card">
        <div className="grid grid-cols-2 gap-4 mb-5">
          <div className="bg-forest-800/60 rounded-xl p-4 text-center">
            <p className="text-4xl font-display font-bold text-white">{damage_pct?.toFixed(1)}%</p>
            <p className="text-xs text-forest-400 mt-1">{t('result.cropDamaged')}</p>
          </div>
          <div className={`rounded-xl p-4 text-center ${typeConf.bg} border ${typeConf.border}`}>
            <p className="text-3xl mb-1">{typeConf.emoji}</p>
            <p className={`text-sm font-semibold capitalize ${typeConf.color}`}>{damage_type}</p>
            <p className="text-xs text-forest-500 mt-0.5">{t('result.damageType')}</p>
          </div>
        </div>

        <SeverityBar pct={damage_pct ?? 0} t={t} />

        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-forest-400">{t('result.confidence')}</span>
          <span className="font-mono font-medium text-white">
            {((confidence ?? 0) * 100).toFixed(1)}%
          </span>
        </div>
      </div>

      {(image_url || mask_url) && (
        <div className="card">
          <p className="text-sm font-medium text-forest-300 mb-3">{t('result.photoEvidence')}</p>
          <div className="grid grid-cols-2 gap-3">
            {image_url && (
              <div>
                <img src={image_url} alt="Original" className="w-full aspect-video object-cover rounded-xl" />
                <p className="text-xs text-center text-forest-500 mt-1.5">{t('result.original')}</p>
              </div>
            )}
            {mask_url && (
              <div>
                <img src={mask_url} alt="Damage overlay" className="w-full aspect-video object-cover rounded-xl" />
                <p className="text-xs text-center text-forest-500 mt-1.5">{t('result.aiOverlay')}</p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="space-y-3">
        {pdf_url && (
          <a
            href={normalizePdfUrl(pdf_url)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary w-full flex items-center justify-center gap-2 py-3.5"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
              />
            </svg>
            {t('result.downloadPmfby')}
          </a>
        )}
        <button
          className="btn-secondary w-full flex items-center justify-center gap-2 py-3 opacity-60 cursor-not-allowed"
          disabled
          title={t('result.comingSoon')}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          {t('result.submitInsurer')}
        </button>
        <button
          onClick={onNewClaim}
          className="w-full text-sm text-forest-400 hover:text-white transition-colors py-2"
        >
          {t('result.fileAnother')}
        </button>
      </div>
    </div>
  )
}
