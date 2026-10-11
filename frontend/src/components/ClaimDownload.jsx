// frontend/src/components/ClaimDownload.jsx
// Reusable PDF download button used in Dashboard claim cards

export default function ClaimDownload({ pdfUrl, claimId }) {
  if (!pdfUrl) return null

  const normalizePdfUrl = (url) => {
    if (!url) return null
    const fixedUrl = url.replace(/\\/g, '/')
    const localPath = fixedUrl.replace(/^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?/i, '')
    if (/^https?:\/\//i.test(fixedUrl) && !/^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?/i.test(fixedUrl)) return fixedUrl
    const BACKEND = import.meta.env.VITE_API_URL || 'http://localhost:8000'
    return `${BACKEND.replace(/\/+$/, '')}/${localPath.replace(/^\/+/, '')}`
  }

  return (
    <a
      href={normalizePdfUrl(pdfUrl)}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-xs font-medium text-forest-400
                 hover:text-white border border-forest-700/50 hover:border-forest-500
                 rounded-lg px-3 py-1.5 transition-all duration-150 group"
      title={`Download PDF for claim ${claimId}`}
    >
      <svg className="w-3.5 h-3.5 group-hover:text-forest-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      </svg>
      PDF
    </a>
  )
}
