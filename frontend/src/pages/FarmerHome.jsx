import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  FileText,
  Sprout,
  Camera,
  ChevronRight,
  ChevronLeft,
  BarChart3,
  Clock,
  CheckCircle2,
  Zap,
  MapPin,
  Download,
  Loader2,
  Sparkles,
  Leaf,
  TrendingUp,
  Play,
  RefreshCw,
  Image as ImageIcon,
  Activity,
  ArrowUpRight,
  Pause,
  PlayCircle,
  Trash2,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../i18n/LanguageContext'

const BACKEND = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const normalizePdfUrl = (pdfUrl) => {
  if (!pdfUrl) return null
  const fixedUrl = pdfUrl.replace(/\\/g, '/')
  const localPath = fixedUrl.replace(/^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?/i, '')
  if (/^https?:\/\//i.test(fixedUrl) && !/^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?/i.test(fixedUrl)) return fixedUrl
  return `${BACKEND.replace(/\/+$/, '')}/${localPath.replace(/^\/+/, '')}`;
}

const cardStyle = {
  backgroundColor: '#FFFFFF',
  border: '1px solid #E6DCC9',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
}

const DAMAGE_TYPES = ['waterlogging', 'lodging', 'hail', 'pest']

function AnimatedCounter({ value, duration = 900 }) {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    const target = Number(value) || 0
    if (target === 0) {
      setDisplay(0)
      return
    }
    const start = performance.now()
    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplay(Math.round(target * eased))
      if (t < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [value, duration])

  return <span>{display}</span>
}

function damageBadgeClass(pct) {
  if (pct < 30) return 'text-green-800 bg-green-50 border-green-200 font-semibold'
  if (pct < 60) return 'text-amber-800 bg-amber-50 border-amber-200 font-semibold'
  return 'text-red-800 bg-red-50 border-red-200 font-semibold'
}

export default function FarmerHome() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { t } = useLanguage()

  const greetingText = useMemo(() => {
    const h = new Date().getHours()
    if (h < 12) return t('farmerHome.greetingMorning')
    if (h < 17) return t('farmerHome.greetingAfternoon')
    return t('farmerHome.greetingEvening')
  }, [t])

  const TIPS = useMemo(
    () => [t('farmerHome.tip1'), t('farmerHome.tip2'), t('farmerHome.tip3'), t('farmerHome.tip4')],
    [t]
  )

  const PIPELINE_STEPS = useMemo(
    () => [
      { id: 'capture', label: t('farmerHome.stepCapture'), desc: t('farmerHome.stepCaptureDesc'), icon: Camera },
      { id: 'analyze', label: t('farmerHome.stepAnalyze'), desc: t('farmerHome.stepAnalyzeDesc'), icon: Zap },
      { id: 'report', label: t('farmerHome.stepReport'), desc: t('farmerHome.stepReportDesc'), icon: FileText },
      { id: 'track', label: t('farmerHome.stepTrack'), desc: t('farmerHome.stepTrackDesc'), icon: BarChart3 },
    ],
    [t]
  )

  const SERVICE_STEPS = useMemo(
    () => [
      {
        icon: Camera,
        title: t('farmerHome.serviceCapture'),
        body: t('farmerHome.serviceCaptureBody'),
        action: t('farmerHome.openDashboardAction'),
        path: '/dashboard',
      },
      {
        icon: Zap,
        title: t('farmerHome.serviceAnalyze'),
        body: t('farmerHome.serviceAnalyzeBody'),
        action: t('farmerHome.startAssessmentAction'),
        path: '/dashboard',
      },
      {
        icon: FileText,
        title: t('farmerHome.serviceReport'),
        body: t('farmerHome.serviceReportBody'),
        action: t('farmerHome.viewClaimsAction'),
        tab: 'claims',
      },
      {
        icon: CheckCircle2,
        title: t('farmerHome.serviceTrack'),
        body: t('farmerHome.serviceTrackBody'),
        action: t('farmerHome.myClaimsAction'),
        tab: 'claims',
      },
    ],
    [t]
  )

  const [activeTab, setActiveTab] = useState('overview')
  const [activeStep, setActiveStep] = useState(0)
  const [activeServiceStep, setActiveServiceStep] = useState(0)
  const [hoveredAction, setHoveredAction] = useState(null)
  const [hoveredStat, setHoveredStat] = useState(null)
  const [tipIndex, setTipIndex] = useState(0)
  const [tipsPaused, setTipsPaused] = useState(false)
  const [claims, setClaims] = useState([])
  const [claimsLoading, setClaimsLoading] = useState(true)
  const [expandedClaim, setExpandedClaim] = useState(null)
  const [refreshSpin, setRefreshSpin] = useState(false)
  const [justRefreshed, setJustRefreshed] = useState(false)
  const [claimFilter, setClaimFilter] = useState('all')

  const stats = useMemo(
    () => ({
      total: claims.length,
      completed: claims.filter((c) => c.status === 'completed').length,
      avgDamage:
        claims.length > 0
          ? Math.round(
              claims.reduce((s, c) => s + (Number(c.damage_pct) || 0), 0) / claims.length
            )
          : 0,
      recent: claims.filter((c) => {
        if (!c.created_at) return false
        const d = new Date(c.created_at)
        const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
        return d.getTime() > weekAgo
      }).length,
    }),
    [claims]
  )

  const completionRate = stats.total
    ? Math.round((stats.completed / stats.total) * 100)
    : 0

  const damageBreakdown = useMemo(() => {
    const counts = {}
    DAMAGE_TYPES.forEach((t) => (counts[t] = 0))
    claims.forEach((c) => {
      const type = (c.damage_type || 'other').toLowerCase()
      if (counts[type] !== undefined) counts[type]++
      else counts.other = (counts.other || 0) + 1
    })
    const max = Math.max(...Object.values(counts), 1)
    return DAMAGE_TYPES.map((type) => ({
      type,
      count: counts[type] || 0,
      pct: Math.round(((counts[type] || 0) / max) * 100),
    }))
  }, [claims])

  const filteredClaims = useMemo(() => {
    if (claimFilter === 'all') return claims
    if (claimFilter === 'completed') return claims.filter((c) => c.status === 'completed')
    if (claimFilter === 'pending') return claims.filter((c) => c.status !== 'completed')
    return claims.filter((c) => (c.damage_type || '').toLowerCase() === claimFilter)
  }, [claims, claimFilter])

  const fetchClaims = useCallback(async () => {
    if (!user?.uid) return
    setClaimsLoading(true)
    try {
      const res = await fetch(`${BACKEND}/api/claims?uid=${encodeURIComponent(user.uid)}`)
      const json = await res.json()
      if (json.success) setClaims(json.data?.claims || [])
    } catch {
      setClaims([])
    } finally {
      setClaimsLoading(false)
    }
  }, [user?.uid])

  useEffect(() => {
    fetchClaims()
  }, [fetchClaims])

  useEffect(() => {
    if (tipsPaused) return
    const id = setInterval(() => {
      setTipIndex((i) => (i + 1) % TIPS.length)
    }, 5000)
    return () => clearInterval(id)
  }, [tipsPaused])

  const handleRefresh = () => {
    setRefreshSpin(true)
    fetchClaims().finally(() => {
      setTimeout(() => setRefreshSpin(false), 600)
      setJustRefreshed(true)
      setTimeout(() => setJustRefreshed(false), 2000)
    })
  }

  const handleDeleteClaim = async (claimId) => {
    if (!window.confirm(t('common.confirmDelete') || "Are you sure you want to delete this report?")) {
      return
    }
    try {
      const res = await fetch(`${BACKEND}/api/claims/${claimId}`, {
        method: 'DELETE',
      })
      const json = await res.json()
      if (json.success) {
        setClaims((prev) => prev.filter((c) => c.id !== claimId))
      } else {
        alert(json.error || "Failed to delete claim")
      }
    } catch (err) {
      console.error("Error deleting claim:", err)
      alert("Error deleting report. Please try again.")
    }
  }

  const handleServiceStepAction = (step) => {
    if (step.path) {
      navigate(step.path)
      return
    }
    if (step.tab) setActiveTab(step.tab)
    document.getElementById('tab-panel')?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleStatClick = (statId) => {
    if (statId === 'total' || statId === 'completed') {
      setActiveTab('claims')
      setClaimFilter(statId === 'completed' ? 'completed' : 'all')
    } else if (statId === 'week') {
      setActiveTab('claims')
      setClaimFilter('all')
    } else {
      setActiveTab('overview')
    }
    document.getElementById('tab-panel')?.scrollIntoView({ behavior: 'smooth' })
  }

  const quickActions = useMemo(
    () => [
      {
        id: 'claim',
        title: t('farmerHome.fileClaim'),
        description: t('farmerHome.fileClaimDesc'),
        icon: Camera,
        color: 'from-amber-500 to-amber-600',
        glow: 'hover:shadow-amber-500/20',
        onClick: () => navigate('/dashboard'),
      },
      {
        id: 'dash',
        title: t('farmerHome.myDashboard'),
        description: t('farmerHome.myDashboardDesc'),
        icon: LayoutDashboard,
        color: 'from-emerald-500 to-emerald-600',
        glow: 'hover:shadow-emerald-500/20',
        onClick: () => navigate('/dashboard'),
      },
      {
        id: 'reports',
        title: t('farmerHome.pmfbyReports'),
        description: t('farmerHome.pmfbyReportsDesc'),
        icon: FileText,
        color: 'from-blue-500 to-blue-600',
        glow: 'hover:shadow-blue-500/20',
        onClick: () => {
          setActiveTab('claims')
          document.getElementById('tab-panel')?.scrollIntoView({ behavior: 'smooth' })
        },
      },
    ],
    [t, navigate]
  )

  const tabs = useMemo(
    () => [
      { id: 'overview', label: t('farmerHome.tabOverview'), icon: Sparkles },
      { id: 'claims', label: t('farmerHome.tabClaims'), icon: FileText },
      { id: 'guide', label: t('farmerHome.tabGuide'), icon: Play },
    ],
    [t]
  )

  const statCards = useMemo(
    () => [
      { id: 'total', label: t('farmerHome.totalClaims'), value: stats.total, icon: BarChart3, color: 'text-blue-400' },
      { id: 'completed', label: t('farmerHome.completed'), value: stats.completed, icon: CheckCircle2, color: 'text-emerald-400' },
      { id: 'week', label: t('farmerHome.thisWeek'), value: stats.recent, icon: Clock, color: 'text-amber-400' },
      { id: 'avg', label: t('farmerHome.avgDamage'), value: stats.avgDamage, icon: TrendingUp, color: 'text-red-400', suffix: '%' },
    ],
    [t, stats]
  )

  const filterLabel = (f) => {
    if (f === 'all') return t('common.all')
    if (f === 'completed') return t('common.completed')
    if (f === 'pending') return t('common.pending')
    return t(`farmerHome.damageTypes.${f}`)
  }

  return (
    <div className="min-h-screen bg-[#FCFAF5] text-[#10261C] relative overflow-hidden font-sans">
      {/* Curved Forest Green Top Banner */}
      <section className="relative overflow-hidden pt-28 pb-36 bg-[#10261C] text-white">
        <div
          className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-emerald-600/10 blur-3xl pointer-events-none"
          aria-hidden
        />
        <div
          className="absolute bottom-20 -left-16 w-56 h-56 rounded-full bg-[#E88125]/10 blur-3xl pointer-events-none"
          aria-hidden
        />

        <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <span className="inline-flex items-center gap-2 text-[#E88125] text-sm px-3 py-1 rounded-full border border-[#E88125]/30 bg-[#E88125]/10 font-semibold">
                  <Sprout className="w-4 h-4 animate-pulse" />
                  {t('farmerHome.portal')}
                </span>
                {justRefreshed && (
                  <span className="text-xs text-amber-400 animate-[farmer-fade-up_0.3s_ease-out] flex items-center gap-1">
                    <Activity className="w-3 h-3" />
                    {t('farmerHome.dataUpdated')}
                  </span>
                )}
                {!claimsLoading && (
                  <span className="text-xs text-emerald-200/80 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    {t('farmerHome.claimsOnFile', { count: stats.total })}
                  </span>
                )}
              </div>
              <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-2 leading-tight">
                {greetingText},{' '}
                <span className="text-[#E88125]">
                  {user?.name || t('common.farmer')}
                </span>
              </h1>
              <p className="text-emerald-100/70 max-w-xl font-medium">
                {t('farmerHome.hubDesc')}
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-[#E88125] text-white font-bold hover:bg-[#cf6f1b] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-[#E88125]/25 shrink-0"
            >
              <Camera className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              {t('farmerHome.startAssessment')}
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Curved wave transition at the bottom */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-[0]">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-[60px] fill-[#FCFAF5]">
            <path d="M0,0 C150,90 350,120 600,100 C850,80 1050,90 1200,120 L1200,120 L0,120 Z"></path>
          </svg>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 pb-20 -mt-16">
        
        {/* Interactive stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 farmer-enter">
          {statCards.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => handleStatClick(s.id)}
              onMouseEnter={() => setHoveredStat(s.id)}
              onMouseLeave={() => setHoveredStat(null)}
              className={`group rounded-2xl p-5 text-left transition-all duration-300 hover:-translate-y-1 hover:border-[#E88125]/50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#E88125]/40 ${
                hoveredStat === s.id ? 'scale-[1.02]' : ''
              }`}
              style={cardStyle}
            >
              <div className="flex items-center justify-between mb-2">
                <s.icon className={`w-5 h-5 ${s.color}`} />
                <ArrowUpRight
                  className={`w-4 h-4 text-gray-400 transition ${
                    hoveredStat === s.id ? 'text-[#E88125] translate-x-0.5 -translate-y-0.5' : ''
                  }`}
                />
              </div>
              <p className="text-2xl font-bold text-[#10261C] tabular-nums">
                <AnimatedCounter value={s.value} />
                {s.suffix || ''}
              </p>
              <p className="text-gray-500 text-xs mt-1 font-medium">{s.label}</p>
              <p className="text-[10px] text-[#E88125] mt-2 opacity-0 group-hover:opacity-100 transition sm:opacity-100 font-semibold">
                {t('farmerHome.clickExplore')}
              </p>
            </button>
          ))}
        </div>

        {/* Completion ring + damage breakdown */}
        <div className="grid md:grid-cols-2 gap-6 mb-10 farmer-enter">
          <div className="rounded-2xl p-6 flex items-center gap-6" style={cardStyle}>
            <div className="relative w-24 h-24 shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="#F3EFE6" strokeWidth="10" />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke="url(#grad)"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={`${completionRate * 2.64} 264`}
                  className="transition-all duration-1000"
                />
                <defs>
                  <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#10261C" />
                    <stop offset="100%" stopColor="#E88125" />
                  </linearGradient>
                </defs>
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-xl font-bold text-[#10261C]">
                {completionRate}%
              </span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#10261C] mb-1">{t('farmerHome.completionRate')}</h3>
              <p className="text-gray-600 text-sm">
                {t('farmerHome.completionDesc', { done: stats.completed, total: stats.total })}
              </p>
              <button
                type="button"
                onClick={handleRefresh}
                className="mt-3 text-sm text-[#10261C] font-semibold hover:text-[#E88125] flex items-center gap-1 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${refreshSpin ? 'animate-spin' : ''}`} />
                {t('farmerHome.syncData')}
              </button>
            </div>
          </div>

          <div className="rounded-2xl p-6" style={cardStyle}>
            <h3 className="text-lg font-bold text-[#10261C] mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#E88125]" />
              {t('farmerHome.damageByType')}
            </h3>
            <div className="space-y-3">
              {damageBreakdown.map((d) => (
                <button
                  key={d.type}
                  type="button"
                  onClick={() => {
                    setClaimFilter(d.type)
                    setActiveTab('claims')
                    document.getElementById('tab-panel')?.scrollIntoView({ behavior: 'smooth' })
                  }}
                  className="w-full group text-left"
                >
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600 capitalize group-hover:text-[#10261C] transition font-medium">
                      {t(`farmerHome.damageTypes.${d.type}`)}
                    </span>
                    <span className="text-[#10261C] font-semibold">{d.count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-[#F3EFE6] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#10261C] to-[#E88125] transition-all duration-700 group-hover:from-[#E88125] group-hover:to-[#cf6f1b]"
                      style={{ width: `${d.pct}%` }}
                    />
                  </div>
                </button>
              ))}
            </div>
            {claims.length === 0 && !claimsLoading && (
              <p className="text-gray-500 text-xs mt-3">{t('farmerHome.uploadForBreakdown')}</p>
            )}
          </div>
        </div>

        {/* Interactive how it works */}
        <section id="how-it-works" className="mb-10 farmer-enter">
          <div className="max-w-4xl mx-auto text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-[#10261C] mb-4">{t('farmerHome.howWorks')}</h2>
            <p className="text-gray-600 font-medium leading-relaxed">
              {t('farmerHome.howWorksClick')}
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto mb-6">
            {SERVICE_STEPS.map((step, i) => {
              const active = activeServiceStep === i
              const Icon = step.icon
              return (
                <button
                  key={step.title}
                  type="button"
                  onClick={() => setActiveServiceStep(i)}
                  className={`relative rounded-2xl p-6 h-full text-left transition-all duration-300 ${
                    active
                      ? 'ring-2 ring-[#E88125] -translate-y-1 shadow-md'
                      : 'hover:-translate-y-0.5 hover:border-[#E88125]/40'
                  }`}
                  style={cardStyle}
                >
                  <span
                    className={`absolute -top-3 -left-3 w-10 h-10 rounded-full font-bold flex items-center justify-center text-sm transition ${
                      active ? 'bg-[#E88125] text-white scale-110' : 'bg-[#10261C]/10 text-[#10261C]'
                    }`}
                  >
                    {i + 1}
                  </span>
                  <Icon className={`w-8 h-8 mb-4 mt-2 ${active ? 'text-[#E88125]' : 'text-[#10261C]/60'}`} />
                  <h3 className="text-lg font-bold text-[#10261C] mb-2">{step.title}</h3>
                  <p className={`text-sm leading-relaxed ${active ? 'text-gray-700' : 'text-gray-500'}`}>
                    {active ? step.body : step.body.slice(0, 72) + '…'}
                  </p>
                </button>
              )
            })}
          </div>
          <div
            key={activeServiceStep}
            className="max-w-3xl mx-auto rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-[farmer-fade-up_0.35s_ease-out]"
            style={cardStyle}
          >
            <p className="text-gray-700 text-sm leading-relaxed flex-1 font-medium">
              {SERVICE_STEPS[activeServiceStep].body}
            </p>
            <button
              type="button"
              onClick={() => handleServiceStepAction(SERVICE_STEPS[activeServiceStep])}
              className="shrink-0 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#E88125] hover:bg-[#cf6f1b] text-white font-semibold shadow-md transition"
            >
              {SERVICE_STEPS[activeServiceStep].action}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </section>

        {/* Tabs Selector */}
        <div id="tab-panel" className="flex flex-wrap gap-2 mb-6 farmer-enter">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
                activeTab === tab.id
                  ? 'bg-[#E88125] text-white shadow-md scale-105'
                  : 'bg-white text-gray-600 border border-[#E6DCC9] hover:text-[#10261C] hover:border-[#E88125]'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.id === 'claims' && claims.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-[#10261C]/10 text-xs text-[#10261C]">
                  {claims.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab panels */}
        <div className="space-y-6 farmer-enter">
          {activeTab === 'overview' && (
            <>
              <div className="grid sm:grid-cols-3 gap-4">
                {quickActions.map((action) => (
                  <button
                    key={action.id}
                    type="button"
                    onClick={action.onClick}
                    onMouseEnter={() => setHoveredAction(action.id)}
                    onMouseLeave={() => setHoveredAction(null)}
                    className="rounded-2xl p-5 text-left transition-all duration-300 hover:-translate-y-1 hover:border-[#E88125]/40"
                    style={{
                      ...cardStyle,
                      transform:
                        hoveredAction === action.id ? 'translateY(-4px) scale(1.01)' : undefined,
                    }}
                  >
                    <div
                      className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-3 transition-transform duration-300 ${
                        hoveredAction === action.id ? 'scale-110 rotate-3' : ''
                      }`}
                    >
                      <action.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-[#10261C] font-bold text-sm mb-1">{action.title}</h3>
                    <p className="text-gray-500 text-xs leading-relaxed font-medium">{action.description}</p>
                    <ChevronRight
                      className={`w-4 h-4 text-[#E88125] mt-3 transition-all ${
                        hoveredAction === action.id ? 'opacity-100 translate-x-1' : 'opacity-40'
                      }`}
                    />
                  </button>
                ))}
              </div>

              {/* Recent claims preview */}
              <div className="rounded-2xl p-6" style={cardStyle}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-[#10261C]">{t('farmerHome.latestActivity')}</h3>
                  <button
                    type="button"
                    onClick={() => setActiveTab('claims')}
                    className="text-sm text-[#E88125] font-semibold hover:underline"
                  >
                    {t('farmerHome.viewAll')}
                  </button>
                </div>
                {claimsLoading ? (
                  <Loader2 className="w-8 h-8 animate-spin text-[#E88125] mx-auto" />
                ) : claims.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-6">
                    {t('farmerHome.noActivity')}{' '}
                    <button
                      type="button"
                      onClick={() => navigate('/dashboard')}
                      className="text-[#E88125] font-semibold hover:underline"
                    >
                      {t('farmerHome.startFirst')}
                    </button>
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {claims.slice(0, 3).map((claim) => {
                      const pct = Number(claim.damage_pct) || 0
                      return (
                        <li key={claim.id}>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveTab('claims')
                              setExpandedClaim(claim.id)
                            }}
                            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-[#FCFAF5] transition text-left"
                          >
                            <FileText className="w-5 h-5 text-[#E88125] shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-[#10261C] font-semibold text-sm truncate capitalize">
                                {claim.damage_type || t('farmerHome.assessment')}
                              </p>
                              <p className="text-gray-500 text-xs font-medium">
                                {claim.created_at
                                  ? new Date(claim.created_at).toLocaleDateString()
                                  : '—'}
                              </p>
                            </div>
                            <span className={`text-xs px-2 py-0.5 rounded-full border ${damageBadgeClass(pct)}`}>
                              {pct.toFixed(0)}%
                            </span>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>

              {/* Auto-rotating tips */}
              <div
                className="rounded-2xl p-5"
                style={cardStyle}
                onMouseEnter={() => setTipsPaused(true)}
                onMouseLeave={() => setTipsPaused(false)}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-bold text-[#E88125] flex items-center gap-2">
                    <Leaf className="w-4 h-4" />
                    {t('farmerHome.fieldTip')}
                    {tipsPaused ? (
                      <Pause className="w-3 h-3 text-gray-400" />
                    ) : (
                      <PlayCircle className="w-3 h-3 text-[#10261C] animate-pulse" />
                    )}
                  </span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setTipIndex((i) => (i - 1 + TIPS.length) % TIPS.length)}
                      className="p-1.5 rounded-lg border border-[#DDD9CE] hover:bg-[#FCFAF5] text-gray-500 hover:text-[#10261C] transition"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setTipIndex((i) => (i + 1) % TIPS.length)}
                      className="p-1.5 rounded-lg border border-[#DDD9CE] hover:bg-[#FCFAF5] text-gray-500 hover:text-[#10261C] transition"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <p
                  key={tipIndex}
                  className="text-gray-700 text-sm leading-relaxed font-medium animate-[farmer-fade-up_0.4s_ease-out]"
                >
                  {TIPS[tipIndex]}
                </p>
                <div className="flex gap-1.5 mt-4">
                  {TIPS.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setTipIndex(i)}
                      className={`h-1.5 rounded-full transition-all ${
                        i === tipIndex ? 'w-8 bg-[#E88125]' : 'w-2 bg-[#10261C]/25 hover:bg-[#10261C]/45'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === 'claims' && (
            <div className="rounded-2xl p-6" style={cardStyle}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <h2 className="text-xl font-bold text-[#10261C]">{t('farmerHome.recentClaims')}</h2>
                <div className="flex flex-wrap gap-2">
                  {['all', 'completed', 'pending', ...DAMAGE_TYPES].map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setClaimFilter(f)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold capitalize transition ${
                        claimFilter === f
                          ? 'bg-[#E88125] text-white'
                          : 'bg-white text-gray-600 border border-[#DDD9CE] hover:text-[#10261C] hover:border-[#E88125]'
                      }`}
                    >
                      {filterLabel(f)}
                    </button>
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={handleRefresh}
                className="text-sm text-[#10261C] font-semibold hover:text-[#E88125] flex items-center gap-1 mb-4"
              >
                <RefreshCw className={`w-4 h-4 ${refreshSpin ? 'animate-spin' : ''}`} />
                {t('common.refresh')}
              </button>

              {claimsLoading ? (
                <div className="flex flex-col items-center py-12 text-gray-500">
                  <Loader2 className="w-10 h-10 animate-spin text-[#E88125] mb-3" />
                  {t('farmerHome.loadingClaims')}
                </div>
              ) : filteredClaims.length === 0 ? (
                <div className="text-center py-12">
                  <ImageIcon className="w-14 h-14 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4 font-medium">
                    {claimFilter === 'all'
                      ? t('farmerHome.noClaims')
                      : t('farmerHome.noClaimsFilter', { filter: filterLabel(claimFilter) })}
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate('/dashboard')}
                    className="px-6 py-3 rounded-full bg-[#E88125] text-white font-bold hover:bg-[#cf6f1b] transition shadow-md"
                  >
                    {t('farmerHome.uploadCrop')}
                  </button>
                </div>
              ) : (
                <ul className="space-y-3">
                  {filteredClaims.slice(0, 8).map((claim) => {
                    const open = expandedClaim === claim.id
                    const pct = Number(claim.damage_pct) || 0
                    return (
                      <li
                        key={claim.id}
                        className={`rounded-xl border transition-all duration-300 overflow-hidden ${
                          open
                            ? 'border-[#E88125] bg-[#FCFAF5]/80'
                            : 'border-[#E6DCC9] bg-white hover:border-[#E88125]'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => setExpandedClaim(open ? null : claim.id)}
                          className="w-full flex items-center gap-4 p-4 text-left font-sans"
                        >
                          <div className="w-10 h-10 rounded-lg bg-[#FCFAF5] border border-[#E6DCC9] flex items-center justify-center shrink-0">
                            <FileText className="w-5 h-5 text-[#E88125]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[#10261C] font-semibold text-sm truncate capitalize">
                              {claim.damage_type || t('farmerHome.assessment')} · {claim.id?.slice(0, 8)}…
                            </p>
                            <p className="text-gray-500 text-xs font-medium">
                              {claim.created_at
                                ? new Date(claim.created_at).toLocaleDateString()
                                : '—'}
                            </p>
                          </div>
                          <span className={`badge border text-xs shrink-0 ${damageBadgeClass(pct)}`}>
                            {pct.toFixed(1)}%
                          </span>
                          <ChevronRight
                            className={`w-5 h-5 text-gray-500 transition-transform ${
                              open ? 'rotate-90' : ''
                            }`}
                          />
                        </button>
                        {open && (
                          <div className="px-4 pb-4 pt-0 border-t border-[#E6DCC9] animate-[farmer-fade-up_0.3s_ease-out]">
                            <div className="grid sm:grid-cols-2 gap-3 text-sm text-gray-600 mb-3 mt-4">
                              <p>
                                <span className="text-gray-400 font-medium">{t('farmerHome.type')}:</span>{' '}
                                <span className="font-semibold text-[#10261C]">{claim.damage_type || '—'}</span>
                              </p>
                              <p>
                                <span className="text-gray-400 font-medium">{t('farmerHome.confidence')}:</span>{' '}
                                <span className="font-semibold text-[#10261C]">
                                  {claim.confidence
                                    ? `${(Number(claim.confidence) * 100).toFixed(0)}%`
                                    : '—'}
                                </span>
                              </p>
                              <p className="flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 text-gray-400" />
                                <span className="font-semibold text-[#10261C]">
                                  {claim.lat != null && claim.lng != null
                                    ? `${Number(claim.lat).toFixed(4)}, ${Number(claim.lng).toFixed(4)}`
                                    : t('farmerHome.gpsNotRecorded')}
                                </span>
                              </p>
                              <p>
                                <span className="text-gray-400 font-medium">{t('farmerHome.status')}:</span>{' '}
                                <span className="text-[#E88125] font-bold capitalize">
                                  {claim.status === 'completed'
                                    ? t('common.completed')
                                    : t('common.pending')}
                                </span>
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-4 pt-2 border-t border-gray-100">
                              {claim.pdf_url && (
                                <a
                                  href={normalizePdfUrl(claim.pdf_url)}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#E88125] text-white hover:bg-[#cf6f1b] font-semibold text-sm transition shadow-sm"
                                >
                                  <Download className="w-4 h-4" />
                                  {t('farmerHome.downloadPdf')}
                                </a>
                              )}
                              <button
                                type="button"
                                onClick={() => handleDeleteClaim(claim.id)}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 font-semibold text-sm transition"
                              >
                                <Trash2 className="w-4 h-4" />
                                {t('common.delete') || 'Delete'}
                              </button>
                            </div>
                          </div>
                        )}
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          )}

          {activeTab === 'guide' && (
            <div className="rounded-2xl p-6" style={cardStyle}>
              <h2 className="text-xl font-bold text-[#10261C] mb-2">{t('farmerHome.claimPipeline')}</h2>
              <p className="text-gray-500 text-sm mb-6 font-medium">{t('farmerHome.pipelineClick')}</p>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-0 mb-8">
                {PIPELINE_STEPS.map((step, i) => (
                  <React.Fragment key={step.id}>
                    <button
                      type="button"
                      onClick={() => setActiveStep(i)}
                      className={`flex-1 flex flex-col items-center p-4 rounded-xl transition-all duration-300 ${
                        activeStep === i
                          ? 'bg-[#E88125]/10 border-2 border-[#E88125] scale-[1.02]'
                          : 'bg-white border border-[#E6DCC9] hover:bg-[#FCFAF5] hover:border-[#E88125]/40'
                      }`}
                    >
                      <step.icon
                        className={`w-8 h-8 mb-2 ${
                          activeStep === i ? 'text-[#E88125]' : 'text-[#10261C]/50'
                        }`}
                      />
                      <span className="text-[#10261C] text-sm font-semibold">{step.label}</span>
                    </button>
                    {i < PIPELINE_STEPS.length - 1 && (
                      <div className="hidden sm:flex items-center px-1">
                        <ChevronRight className="w-5 h-5 text-[#E6DCC9]" />
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>
              <div
                key={activeStep}
                className="rounded-xl p-5 bg-white border border-[#E6DCC9] shadow-sm animate-[farmer-fade-up_0.35s_ease-out]"
              >
                {(() => {
                  const step = PIPELINE_STEPS[activeStep]
                  const StepIcon = step.icon
                  return (
                    <>
                      <div className="flex items-center gap-3 mb-2">
                        <StepIcon className="w-6 h-6 text-[#E88125]" />
                        <h3 className="text-lg font-bold text-[#10261C]">
                          Step {activeStep + 1}: {step.label}
                        </h3>
                      </div>
                      <p className="text-gray-600 text-sm mb-4 font-medium">{step.desc}</p>
                      <button
                        type="button"
                        onClick={() => navigate('/dashboard')}
                        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#10261C] text-white text-sm font-semibold hover:bg-[#163527] transition"
                      >
                        {t('farmerHome.tryStep')}
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </>
                  )
                })()}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
