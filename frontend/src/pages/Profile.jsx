import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  User,
  Mail,
  Shield,
  LogOut,
  CheckCircle2,
  Circle,
  Sprout,
  Home,
  LayoutDashboard,
  KeyRound,
  Bell,
  ChevronRight,
  Trash2,
  Eye,
  Download,
  FileText,
  Loader2,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../i18n/LanguageContext'

const BACKEND = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const cardStyle = {
  background: 'rgba(16, 35, 21, 0.6)',
  backdropFilter: 'blur(12px)',
  border: '1px solid rgba(70, 130, 70, 0.4)',
}

export default function Profile() {
  const navigate = useNavigate()
  const { user, logout, updateProfile, farmerId } = useAuth()
  const { t } = useLanguage()

  const defaultChecklist = [
    { id: 'profile', labelKey: 'profile.checkName', done: false },
    { id: 'explore', labelKey: 'profile.checkSteps', done: false },
    { id: 'upload', labelKey: 'profile.checkUpload', done: false },
    { id: 'pdf', labelKey: 'profile.checkPdf', done: false },
  ]

  const [editName, setEditName] = useState(user?.name || '')
  const [saving, setSaving] = useState(false)
  const [saveFlash, setSaveFlash] = useState(false)
  const [checklist, setChecklist] = useState(defaultChecklist)
  const [claimsCount, setClaimsCount] = useState(0)
  const [claims, setClaims] = useState([])
  const [claimsLoading, setClaimsLoading] = useState(false)

  const checklistKey = `bimasetu_checklist_${user?.uid || 'guest'}`

  const initials = (user?.name || user?.email || 'F')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const profileProgress = useMemo(() => {
    let n = 0
    if (user?.name?.trim()) n += 25
    if (user?.email) n += 25
    if (checklist.filter((c) => c.done).length >= 2) n += 25
    if (claimsCount > 0) n += 25
    return n
  }, [user, checklist, claimsCount])

  const fetchClaims = useCallback(async () => {
    if (!user?.uid) return
    setClaimsLoading(true)
    try {
      const res = await fetch(`${BACKEND}/api/claims?uid=${encodeURIComponent(user.uid)}`)
      const json = await res.json()
      if (json.success) {
        const claimsList = json.data?.claims || []
        setClaims(claimsList)
        setClaimsCount(claimsList.length)
      }
    } catch {
      setClaims([])
      setClaimsCount(0)
    } finally {
      setClaimsLoading(false)
    }
  }, [user?.uid])

  const handleDeleteClaim = async (claimId) => {
    if (!window.confirm("Are you sure you want to delete this report?")) {
      return
    }
    try {
      const res = await fetch(`${BACKEND}/api/claims/${claimId}`, {
        method: 'DELETE',
      })
      const json = await res.json()
      if (json.success) {
        setClaims((prev) => prev.filter((c) => c.id !== claimId))
        setClaimsCount((prev) => Math.max(0, prev - 1))
      } else {
        alert(json.error || "Failed to delete claim")
      }
    } catch (err) {
      console.error("Error deleting claim:", err)
      alert("Error deleting report. Please try again.")
    }
  }

  useEffect(() => {
    setEditName(user?.name || '')
  }, [user?.name])

  useEffect(() => {
    try {
      const saved = localStorage.getItem(checklistKey)
      if (saved) setChecklist(JSON.parse(saved))
    } catch {
      /* ignore */
    }
  }, [checklistKey])

  useEffect(() => {
    if (user?.name?.trim()) {
      setChecklist((prev) =>
        prev.map((c) => (c.id === 'profile' ? { ...c, done: true } : c))
      )
    }
  }, [user?.name])

  useEffect(() => {
    if (claimsCount > 0) {
      setChecklist((prev) =>
        prev.map((c) =>
          c.id === 'upload' || c.id === 'pdf' ? { ...c, done: true } : c
        )
      )
    }
  }, [claimsCount])

  useEffect(() => {
    localStorage.setItem(checklistKey, JSON.stringify(checklist))
  }, [checklist, checklistKey])

  useEffect(() => {
    fetchClaims()
  }, [fetchClaims])

  const toggleChecklistItem = (id) => {
    setChecklist((prev) =>
      prev.map((c) => (c.id === id ? { ...c, done: !c.done } : c))
    )
  }

  const handleSaveProfile = (e) => {
    e.preventDefault()
    const trimmed = editName.trim()
    if (!trimmed) return
    setSaving(true)
    updateProfile({ name: trimmed })
    setSaveFlash(true)
    setTimeout(() => {
      setSaving(false)
      setSaveFlash(false)
    }, 700)
  }

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-[#FCFAF5] text-[#10261C]">
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-8">
        <header className="mb-8">
          <div className="flex items-center gap-2 text-[#E88125] text-sm mb-2 font-bold">
            <User className="w-4 h-4" />
            <span>{t('profile.accountSettings')}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-[#10261C] mb-2">{t('profile.myProfile')}</h1>
          <p className="text-gray-500 font-medium">{t('profile.manageDesc')}</p>
        </header>

        <div className="space-y-6">
          {/* Avatar & identity */}
          <div
            className={`bg-white border border-[#E6DCC9] shadow-sm rounded-2xl p-8 transition-all duration-500 ${
              saveFlash ? 'farmer-avatar-ring ring-2 ring-[#E88125]/60' : ''
            }`}
          >
            <div className="flex flex-col sm:flex-row items-center gap-8">
              <div className={`relative shrink-0 ${saveFlash ? 'farmer-avatar-ring' : ''}`}>
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#E88125] to-[#cf6f1b] flex items-center justify-center text-3xl font-bold text-white">
                  {initials}
                </div>
              </div>
              <div className="flex-1 text-center sm:text-left w-full">
                <p className="text-2xl font-bold text-[#10261C]">{user?.name || t('common.farmer')}</p>
                <p className="text-gray-500 flex items-center justify-center sm:justify-start gap-2 mt-1 font-medium">
                  <Mail className="w-4 h-4 text-gray-400" />
                  {user?.email || t('profile.noEmail')}
                </p>
                <p className="text-[#E88125] font-mono text-sm mt-2 font-semibold">{farmerId}</p>
                <div className="w-full max-w-xs mt-4 mx-auto sm:mx-0">
                  <div className="flex justify-between text-xs text-gray-500 mb-1 font-semibold">
                    <span>{t('profile.profileStrength')}</span>
                    <span>{profileProgress}%</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-[#10261C]/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#E88125] transition-all duration-700"
                      style={{ width: `${profileProgress}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Edit profile */}
          <div className="rounded-2xl p-6 bg-white border border-[#E6DCC9] shadow-sm">
            <h2 className="text-lg font-bold text-[#10261C] mb-4 flex items-center gap-2">
              <Sprout className="w-5 h-5 text-[#E88125]" />
              {t('profile.editProfile')}
            </h2>
            <form onSubmit={handleSaveProfile} className="space-y-4 max-w-md">
              <div>
                <label className="text-gray-500 text-sm font-semibold block mb-1.5">{t('profile.displayName')}</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white border border-[#DDD9CE] text-[#10261C] placeholder-gray-400 focus:outline-none focus:border-[#E88125] focus:ring-1 focus:ring-[#E88125]/30 transition-all duration-300"
                  placeholder={t('profile.namePlaceholder')}
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-[#E88125] hover:bg-[#cf6f1b] text-white font-semibold transition disabled:opacity-50 shadow-md hover:shadow-lg"
              >
                {saving ? t('common.saving') : t('profile.saveChanges')}
              </button>
            </form>
          </div>

          {/* Account details */}
          <div className="rounded-2xl p-6 bg-white border border-[#E6DCC9] shadow-sm">
            <h2 className="text-lg font-bold text-[#10261C] mb-4">{t('profile.accountDetails')}</h2>
            <dl className="space-y-4">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-[#FCFAF5] border border-gray-100">
                <Mail className="w-5 h-5 text-[#10261C] mt-0.5" />
                <div>
                  <dt className="text-xs text-gray-500 uppercase font-semibold">{t('auth.email')}</dt>
                  <dd className="text-[#10261C] font-semibold">{user?.email || '—'}</dd>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-xl bg-[#FCFAF5] border border-gray-100">
                <KeyRound className="w-5 h-5 text-[#10261C] mt-0.5" />
                <div>
                  <dt className="text-xs text-gray-500 uppercase font-semibold">{t('profile.accountId')}</dt>
                  <dd className="text-[#10261C] text-sm font-mono break-all font-semibold">{user?.uid || '—'}</dd>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-xl bg-[#FCFAF5] border border-gray-100">
                <LayoutDashboard className="w-5 h-5 text-[#10261C] mt-0.5" />
                <div>
                  <dt className="text-xs text-gray-500 uppercase font-semibold">{t('profile.totalClaimsFiled')}</dt>
                  <dd className="text-[#10261C] font-semibold">{claimsCount}</dd>
                </div>
              </div>
            </dl>
          </div>

          {/* Submitted Claims list */}
          <div className="rounded-2xl p-6 bg-white border border-[#E6DCC9] shadow-sm">
            <h2 className="text-lg font-bold text-[#10261C] mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#E88125]" />
              {t('profile.myClaims') || 'My Submitted Claims'}
            </h2>
            {claimsLoading ? (
              <div className="flex flex-col items-center py-6 text-gray-500">
                <Loader2 className="w-8 h-8 animate-spin text-[#E88125] mb-2" />
                <span>{t('farmerHome.loadingClaims') || 'Loading claims...'}</span>
              </div>
            ) : claims.length === 0 ? (
              <div className="text-center py-6 text-gray-500 font-medium">
                <p>{t('profile.noClaimsYet') || 'No claims filed yet.'}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="py-2 pr-2 text-gray-500 font-semibold text-sm">{t('dashboard.crop') || 'Crop'}</th>
                      <th className="py-2 pr-2 text-gray-500 font-semibold text-sm hidden sm:table-cell">{t('dashboard.date') || 'Date'}</th>
                      <th className="py-2 pr-2 text-gray-500 font-semibold text-sm">{t('dashboard.damage') || 'Damage'}</th>
                      <th className="py-2 text-gray-500 font-semibold text-sm">{t('dashboard.action') || 'Action'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {claims.map((claim) => (
                      <tr key={claim.id} className="border-b border-gray-100 hover:bg-[#FCFAF5] transition-colors">
                        <td className="py-3 pr-2">
                          <p className="text-[#10261C] font-semibold text-sm capitalize">{claim.damage_type || 'Crop Assessment'}</p>
                        </td>
                        <td className="py-3 pr-2 hidden sm:table-cell">
                          <p className="text-gray-500 text-sm font-medium">
                            {claim.created_at ? new Date(claim.created_at).toLocaleDateString() : '—'}
                          </p>
                        </td>
                        <td className="py-3 pr-2">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${
                            (Number(claim.damage_pct) || 0) < 30 ? 'text-green-800 bg-green-50 border border-green-200' :
                            (Number(claim.damage_pct) || 0) < 60 ? 'text-amber-800 bg-amber-50 border border-amber-200' :
                            'text-red-800 bg-red-50 border border-red-200'
                          }`}>
                            {Number(claim.damage_pct || 0).toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-3">
                          <div className="flex gap-2">
                            {claim.pdf_path && (
                              <button
                                onClick={() => {
                                  const fixedUrl = `${BACKEND}/${claim.pdf_path.replace(/\\/g, '/')}`;
                                  window.open(fixedUrl, '_blank');
                                }}
                                className="p-1.5 rounded-lg bg-green-50 border border-green-200 hover:bg-green-100 transition-colors"
                                  title="Download PDF"
                              >
                                <Download className="w-4 h-4 text-green-700" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteClaim(claim.id)}
                              className="p-1.5 rounded-lg bg-red-50 border border-red-200 hover:bg-red-100 transition-colors"
                              title="Delete Report"
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Setup checklist */}
          <div className="rounded-2xl p-6 bg-white border border-[#E6DCC9] shadow-sm">
            <h2 className="text-lg font-bold text-[#10261C] mb-4 flex items-center gap-2">
              <Bell className="w-5 h-5 text-[#E88125]" />
              {t('profile.setupChecklist')}
            </h2>
            <div className="space-y-2 font-semibold">
              {checklist.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggleChecklistItem(item.id)}
                  className="w-full flex items-center gap-3 text-left text-sm py-3 px-4 rounded-xl hover:bg-[#FCFAF5] border border-transparent hover:border-[#E6DCC9] transition group"
                >
                  {item.done ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                  ) : (
                    <Circle className="w-5 h-5 text-gray-400 group-hover:text-[#E88125] shrink-0" />
                  )}
                  <span className={item.done ? 'text-gray-400 line-through' : 'text-[#10261C]'}>
                      {t(item.labelKey)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Quick links & logout */}
          <div className="grid sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => navigate('/home')}
              className="rounded-2xl p-5 text-left transition hover:-translate-y-0.5 flex items-center justify-between group bg-white border border-[#E6DCC9] shadow-sm"
            >
              <div className="flex items-center gap-3">
                <Home className="w-5 h-5 text-[#E88125]" />
                <span className="text-[#10261C] font-bold">{t('profile.backHome')}</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[#E88125] transition" />
            </button>
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="rounded-2xl p-5 text-left transition hover:-translate-y-0.5 flex items-center justify-between group bg-white border border-[#E6DCC9] shadow-sm"
            >
              <div className="flex items-center gap-3">
                <LayoutDashboard className="w-5 h-5 text-[#10261C]" />
                <span className="text-[#10261C] font-bold">{t('profile.openDashboard')}</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[#E88125] transition" />
            </button>
          </div>

          <div className="rounded-2xl p-4 flex items-center gap-2 text-gray-500 text-sm bg-white border border-[#E6DCC9] shadow-sm font-medium">
            <Shield className="w-4 h-4 text-[#10261C] shrink-0" />
            <span>{t('profile.pmfbyNote')}</span>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 transition font-bold"
          >
            <LogOut className="w-5 h-5" />
            {t('profile.logoutBtn')}
          </button>
        </div>
      </div>
    </div>
  )
}
