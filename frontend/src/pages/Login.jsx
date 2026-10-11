import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../i18n/LanguageContext'
import {
  Mail, Lock, LogIn, CheckCircle,
  Eye, EyeOff, Sprout, Shield, Zap,
  Phone, MessageSquare, ArrowLeft, Loader2
} from 'lucide-react'

// ── Tabs ────────────────────────────────────────────────────────────────
const TABS = { EMAIL: 'email', PHONE: 'phone' }

// ── Google SVG Logo (official colors) ───────────────────────────────────
const GoogleLogo = () => (
  <svg width="20" height="20" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    <path fill="none" d="M0 0h48v48H0z"/>
  </svg>
)

// ── Main Component ───────────────────────────────────────────────────────
const BimaSetuLogin = () => {
  const navigate = useNavigate()
  const { loginWithEmail, loginWithGoogle, loginWithPhone, verifyOtp, createFarmerProfile } = useAuth()
  const { t } = useLanguage()

  // ── State ──────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState(TABS.EMAIL)
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // Phone OTP state
  const [phone, setPhone] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [showPhoneProfileForm, setShowPhoneProfileForm] = useState(false)
  const [profileForm, setProfileForm] = useState({ fullName: '', phone: '', village: '', state: '' })
  const otpRefs = useRef([])

  // ── Helpers ────────────────────────────────────────────────────────────
  const clearError = () => setError('')

  // ── Email Login ────────────────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault()
    clearError()
    if (!formData.email) return setError(t('auth.enterEmail'))
    if (!formData.password) return setError(t('auth.enterPassword'))
    setIsLoading(true)
    try {
      await loginWithEmail(formData.email, formData.password)
      navigate('/home')
    } catch (err) {
      setError(err.message || 'Failed to sign in. Please verify your credentials.')
    } finally {
      setIsLoading(false)
    }
  }

  // ── Google Login ───────────────────────────────────────────────────────
  const handleGoogle = async () => {
    clearError()
    setIsLoading(true)
    try {
      await loginWithGoogle()
      navigate('/home')
    } catch (err) {
      setError(err.message || 'Failed to sign in with Google.')
    } finally {
      setIsLoading(false)
    }
  }

  // ── Phone: Send OTP ────────────────────────────────────────────────────
  const handleSendOtp = async () => {
    clearError()
    setShowPhoneProfileForm(false)
    const trimmed = phone.trim()
    if (!trimmed || trimmed.length < 10) return setError('Enter a valid phone number with country code (e.g. +91XXXXXXXXXX)')
    setIsLoading(true)
    try {
      await loginWithPhone(trimmed, 'recaptcha-container')
      setOtpSent(true)
    } catch (err) {
      setError(err.message || 'Failed to send OTP. Check your number and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // ── Phone: Verify OTP ──────────────────────────────────────────────────
  const handleVerifyOtp = async () => {
    clearError()
    const code = otp.join('')
    if (code.length < 6) return setError('Please enter the full 6-digit OTP.')
    setIsLoading(true)
    try {
      const result = await verifyOtp(code)
      if (result?.newFarmer) {
        setProfileForm({
          fullName: '',
          phone: result.phoneNumber || phone,
          village: '',
          state: '',
        })
        setShowPhoneProfileForm(true)
        setOtpSent(false)
        return
      }
      navigate('/home')
    } catch (err) {
      setError(err.message || 'Invalid OTP. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreatePhoneProfile = async (e) => {
    e.preventDefault()
    clearError()
    if (!profileForm.fullName.trim()) return setError('Please enter your full name to continue.')
    setIsLoading(true)
    try {
      await createFarmerProfile(profileForm)
      navigate('/home')
    } catch (err) {
      setError(err.message || 'Unable to create farmer profile. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // ── OTP digit handling ─────────────────────────────────────────────────
  const handleOtpChange = (val, idx) => {
    if (!/^\d?$/.test(val)) return
    const next = [...otp]
    next[idx] = val
    setOtp(next)
    if (val && idx < 5) otpRefs.current[idx + 1]?.focus()
  }

  const handleOtpKeyDown = (e, idx) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      otpRefs.current[idx - 1]?.focus()
    }
  }

  // ── Left panel features ────────────────────────────────────────────────
  const features = [
    { Icon: Shield, label: t('auth.geoVerified') },
    { Icon: Zap, label: t('auth.aiAnalysis') },
    { Icon: CheckCircle, label: t('auth.pmfbyReports') },
  ]

  // ─────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#FCFAF5] flex justify-center items-center px-4">
      {/* Invisible reCAPTCHA anchor — required by Firebase Phone Auth */}
      <div id="recaptcha-container" />

      <div className="max-w-5xl w-full grid md:grid-cols-2 gap-10 py-10">

        {/* ── Left: Brand ──────────────────────────────────────────────── */}
        <div className="hidden md:flex flex-col justify-center space-y-6">
          <div className="flex items-center gap-3">
            <Sprout className="w-10 h-10 text-[#E88125]" />
            <span className="text-4xl font-bold text-[#10261C]">BimaSetu</span>
          </div>

          <h1 className="text-5xl font-bold text-[#10261C] leading-tight">
            {t('auth.aiCropDamage')}
            <span className="block text-[#E88125]">{t('auth.assessment')}</span>
          </h1>

          <div className="space-y-4 text-[#10261C] font-medium">
            {features.map(({ Icon, label }) => (
              <div key={label} className="flex items-center gap-3">
                <Icon className="w-5 h-5 text-[#E88125]" />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right: Login Card ─────────────────────────────────────────── */}
        <div className="flex flex-col justify-center">
          <div className="bg-white border border-[#E6DCC9] shadow-xl rounded-3xl p-8 md:p-10">
            <h2 className="text-3xl font-bold text-center text-[#10261C] mb-2">
              {t('auth.welcomeBack')}
            </h2>
            <p className="text-center text-gray-500 mb-6 font-medium">
              {t('auth.signInContinue')}
            </p>

            {/* ── Google Sign-In ─────────────────────────────────────────── */}
            <button
              id="btn-google-login"
              type="button"
              onClick={handleGoogle}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 border border-[#DDD9CE] bg-white hover:bg-gray-50 text-[#10261C] py-3 rounded-xl font-semibold transition-all duration-300 shadow-sm hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed mb-4"
            >
              <GoogleLogo />
              Continue with Google
            </button>

            {/* ── Divider ────────────────────────────────────────────────── */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-[#E6DCC9]" />
              <span className="text-xs text-gray-400 font-semibold uppercase tracking-wide">or</span>
              <div className="flex-1 h-px bg-[#E6DCC9]" />
            </div>

            {/* ── Tab switch ─────────────────────────────────────────────── */}
            <div className="flex rounded-xl border border-[#E6DCC9] overflow-hidden mb-5">
              <button
                type="button"
                onClick={() => { setActiveTab(TABS.EMAIL); clearError(); setOtpSent(false) }}
                className={`flex-1 py-2 text-sm font-bold transition-all duration-200 flex items-center justify-center gap-1.5 ${
                  activeTab === TABS.EMAIL
                    ? 'bg-[#E88125] text-white'
                    : 'bg-white text-gray-500 hover:bg-gray-50'
                }`}
              >
                <Mail className="w-4 h-4" /> Email
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab(TABS.PHONE); clearError(); setOtpSent(false) }}
                className={`flex-1 py-2 text-sm font-bold transition-all duration-200 flex items-center justify-center gap-1.5 ${
                  activeTab === TABS.PHONE
                    ? 'bg-[#E88125] text-white'
                    : 'bg-white text-gray-500 hover:bg-gray-50'
                }`}
              >
                <Phone className="w-4 h-4" /> Mobile OTP
              </button>
            </div>

            {/* ── Error ─────────────────────────────────────────────────── */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl text-sm mb-4">
                {error}
              </div>
            )}

            {/* ════════════ EMAIL TAB ════════════════════════════════════ */}
            {activeTab === TABS.EMAIL && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                  <input
                    id="input-email"
                    type="email"
                    placeholder={t('auth.enterEmail')}
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-white border border-[#DDD9CE] text-[#10261C] placeholder-gray-400 focus:outline-none focus:border-[#E88125] focus:ring-1 focus:ring-[#E88125] transition-all duration-300"
                  />
                </div>

                <div className="relative">
                  <Lock className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                  <input
                    id="input-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder={t('auth.enterPassword')}
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pl-12 pr-12 py-3 rounded-xl bg-white border border-[#DDD9CE] text-[#10261C] placeholder-gray-400 focus:outline-none focus:border-[#E88125] focus:ring-1 focus:ring-[#E88125] transition-all duration-300"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    className="absolute right-4 top-3.5 text-gray-400 hover:text-[#10261C]"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                <button
                  id="btn-email-login"
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#E88125] hover:bg-[#cf6f1b] text-white py-3 rounded-xl font-bold transition-all duration-300 flex justify-center items-center gap-2 shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5" />}
                  {isLoading ? 'Signing in…' : t('nav.login')}
                </button>
              </form>
            )}

            {/* ════════════ PHONE / OTP TAB ══════════════════════════════ */}
            {activeTab === TABS.PHONE && (
              <div className="space-y-4">
                {showPhoneProfileForm ? (
                  <form onSubmit={handleCreatePhoneProfile} className="space-y-4">
                    <div className="text-center">
                      <p className="text-[#10261C] font-semibold text-lg">Complete farmer onboarding</p>
                      <p className="text-sm text-gray-500">Your phone is verified. Provide farm details to finish registration.</p>
                    </div>
                    <div className="relative">
                      <User className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Full Name"
                        value={profileForm.fullName}
                        onChange={e => setProfileForm({ ...profileForm, fullName: e.target.value })}
                        className="w-full pl-12 pr-4 py-3 rounded-xl bg-white border border-[#DDD9CE] text-[#10261C] placeholder-gray-400 focus:outline-none focus:border-[#E88125] focus:ring-1 focus:ring-[#E88125] transition-all duration-300"
                      />
                    </div>
                    <div className="relative">
                      <Phone className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                      <input
                        type="tel"
                        placeholder="Phone Number"
                        value={profileForm.phone}
                        disabled
                        className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-100 border border-[#DDD9CE] text-gray-600 placeholder-gray-400 focus:outline-none"
                      />
                    </div>
                    <div className="relative">
                      <MessageSquare className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Village (optional)"
                        value={profileForm.village}
                        onChange={e => setProfileForm({ ...profileForm, village: e.target.value })}
                        className="w-full pl-12 pr-4 py-3 rounded-xl bg-white border border-[#DDD9CE] text-[#10261C] placeholder-gray-400 focus:outline-none focus:border-[#E88125] focus:ring-1 focus:ring-[#E88125] transition-all duration-300"
                      />
                    </div>
                    <div className="relative">
                      <Shield className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="State (optional)"
                        value={profileForm.state}
                        onChange={e => setProfileForm({ ...profileForm, state: e.target.value })}
                        className="w-full pl-12 pr-4 py-3 rounded-xl bg-white border border-[#DDD9CE] text-[#10261C] placeholder-gray-400 focus:outline-none focus:border-[#E88125] focus:ring-1 focus:ring-[#E88125] transition-all duration-300"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-[#E88125] hover:bg-[#cf6f1b] text-white py-3 rounded-xl font-bold transition-all duration-300 flex justify-center items-center gap-2 shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                      {isLoading ? 'Saving…' : 'Complete Registration'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowPhoneProfileForm(false); setOtpSent(false); setOtp(['', '', '', '', '', '']); clearError() }}
                      className="w-full text-sm text-[#E88125] font-semibold hover:underline text-center py-1"
                    >
                      Cancel and restart
                    </button>
                  </form>
                ) : !otpSent ? (
                  /* ── Step 1: Enter phone ─────────────────────────────── */
                  <>
                    <div className="relative">
                      <Phone className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                      <input
                        id="input-phone"
                        type="tel"
                        placeholder="+91 98765 43210"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 rounded-xl bg-white border border-[#DDD9CE] text-[#10261C] placeholder-gray-400 focus:outline-none focus:border-[#E88125] focus:ring-1 focus:ring-[#E88125] transition-all duration-300"
                      />
                    </div>
                    <p className="text-xs text-gray-400 font-medium">
                      Include country code · e.g. <span className="font-bold text-gray-500">+91</span> for India
                    </p>
                    <button
                      id="btn-send-otp"
                      type="button"
                      onClick={handleSendOtp}
                      disabled={isLoading}
                      className="w-full bg-[#E88125] hover:bg-[#cf6f1b] text-white py-3 rounded-xl font-bold transition-all duration-300 flex justify-center items-center gap-2 shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <MessageSquare className="w-5 h-5" />}
                      {isLoading ? 'Sending OTP…' : 'Send OTP'}
                    </button>
                  </>
                ) : (
                  /* ── Step 2: Verify OTP ──────────────────────────────── */
                  <>
                    <div className="flex items-center gap-2 mb-1">
                      <button
                        type="button"
                        onClick={() => { setOtpSent(false); setOtp(['','','','','','']); clearError() }}
                        className="text-gray-400 hover:text-[#10261C] transition-colors"
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </button>
                      <p className="text-sm text-gray-500 font-medium">
                        OTP sent to <span className="font-bold text-[#10261C]">{phone}</span>
                      </p>
                    </div>

                    {/* 6-digit OTP boxes */}
                    <div className="flex gap-2 justify-center">
                      {otp.map((digit, idx) => (
                        <input
                          key={idx}
                          id={`otp-digit-${idx}`}
                          ref={el => (otpRefs.current[idx] = el)}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={e => handleOtpChange(e.target.value, idx)}
                          onKeyDown={e => handleOtpKeyDown(e, idx)}
                          className="w-10 h-12 text-center text-xl font-bold border border-[#DDD9CE] rounded-xl text-[#10261C] focus:outline-none focus:border-[#E88125] focus:ring-1 focus:ring-[#E88125] transition-all duration-200"
                        />
                      ))}
                    </div>

                    <button
                      id="btn-verify-otp"
                      type="button"
                      onClick={handleVerifyOtp}
                      disabled={isLoading}
                      className="w-full bg-[#E88125] hover:bg-[#cf6f1b] text-white py-3 rounded-xl font-bold transition-all duration-300 flex justify-center items-center gap-2 shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                      {isLoading ? 'Verifying…' : 'Verify OTP & Sign In'}
                    </button>

                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={isLoading}
                      className="w-full text-sm text-[#E88125] font-semibold hover:underline text-center py-1 disabled:opacity-50"
                    >
                      Resend OTP
                    </button>
                  </>
                )}
              </div>
            )}

            {/* ── Footer: go to Signup ────────────────────────────────────── */}
            <div className="text-center text-gray-500 font-medium pt-4 mt-2 border-t border-[#E6DCC9]">
              {t('auth.noAccount')}
              <button
                type="button"
                onClick={() => navigate('/signup')}
                className="text-[#E88125] font-bold ml-2 hover:underline"
              >
                {t('nav.signup')}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

export default BimaSetuLogin