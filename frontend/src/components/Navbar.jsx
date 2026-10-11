import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../i18n/LanguageContext'
import LanguageSwitcher from './LanguageSwitcher'
import {
  Menu,
  X,
  Sprout,
  LogIn,
  UserPlus,
  LayoutDashboard,
  LogOut,
  Home,
  Sparkles,
  Info,
  Phone,
} from 'lucide-react'

const BimaSetuNavbar = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout, loading: authLoading } = useAuth()
  const { t } = useLanguage()

  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  const isLoggedIn = !!user

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const resize = () => {
      if (window.innerWidth >= 768) setIsOpen(false)
    }
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  const handleLogin = () => {
    navigate('/login')
    setIsOpen(false)
  }

  const handleSignup = () => {
    navigate('/signup')
    setIsOpen(false)
  }

  const handleFarmerHome = () => {
    navigate('/home')
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setIsOpen(false)
  }

  const handleDashboard = () => {
    navigate('/dashboard')
    setIsOpen(false)
  }

  const handleProfile = () => {
    navigate('/profile')
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setIsOpen(false)
  }

  const navLinkClass = (path) =>
    location.pathname === path
      ? 'text-[#E88125] font-semibold'
      : 'text-white/80 hover:text-[#E88125] font-medium'

  const handleLogout = async () => {
    await logout()
    navigate('/')
    setIsOpen(false)
  }

  const handleBrandClick = () => {
    if (isLoggedIn) {
      handleFarmerHome()
    } else {
      navigate('/')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleScrollTo = (id) => {
    if (isLoggedIn) {
      handleFarmerHome()
      return
    }

    if (location.pathname !== '/') {
      navigate('/')
      setTimeout(() => {
        const el = document.getElementById(id)
        if (el) el.scrollIntoView({ behavior: 'smooth' })
      }, 300)
      setIsOpen(false)
      return
    }

    const element = document.getElementById(id)
    if (element) element.scrollIntoView({ behavior: 'smooth' })
    setIsOpen(false)
  }

  const publicMenuItems = [
    { id: 'hero', labelKey: 'nav.home', icon: Home },
    { id: 'features', labelKey: 'nav.features', icon: Sparkles },
    { id: 'why', labelKey: 'nav.about', icon: Info },
    { id: 'contact', labelKey: 'nav.contact', icon: Phone },
  ]

  const authMenuItems = [
    { labelKey: 'nav.home', onClick: handleFarmerHome, path: '/home' },
    { labelKey: 'nav.dashboard', onClick: handleDashboard, path: '/dashboard' },
    { labelKey: 'nav.profile', onClick: handleProfile, path: '/profile' },
  ]

  const menuItems = isLoggedIn ? authMenuItems : publicMenuItems

  if (authLoading) return <div className="h-16 md:h-20" />

  return (
    <>
      <nav
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-[#10261C]/95 backdrop-blur-xl border-b border-emerald-950/40 shadow-xl'
            : 'bg-[#10261C] border-b border-emerald-950/20'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 md:h-20 flex items-center justify-between gap-2">
          <div
            onClick={handleBrandClick}
            className="flex items-center gap-2 cursor-pointer group shrink-0"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && handleBrandClick()}
          >
            <Sprout className="w-7 h-7 text-[#E88125] group-hover:scale-110 transition" />
            <span className="text-xl md:text-2xl font-black text-white tracking-wide">
              Bima<span className="text-[#E88125]">Setu</span>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-1 lg:gap-2">
            {menuItems.map((item) => (
              <button
                key={item.labelKey}
                onClick={item.onClick || (() => handleScrollTo(item.id))}
                className={`px-3 lg:px-4 py-2 rounded-full transition text-sm ${
                  item.path ? navLinkClass(item.path) : 'text-white/80 hover:text-[#E88125] font-medium'
                }`}
              >
                {t(item.labelKey)}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <LanguageSwitcher compact />

            <div className="hidden md:flex items-center gap-2">
              {!isLoggedIn ? (
                <>
                  <button
                    onClick={handleLogin}
                    className="px-5 py-2 rounded-full border border-white/20 text-white/95 hover:border-[#E88125] hover:text-[#E88125] transition text-sm font-semibold"
                  >
                    <LogIn className="w-4 h-4 inline mr-1.5" />
                    {t('nav.login')}
                  </button>
                  <button
                    onClick={handleSignup}
                    className="px-5 py-2 rounded-full bg-[#E88125] text-white font-semibold hover:bg-[#cf6f1b] transition text-sm shadow-md"
                  >
                    <UserPlus className="w-4 h-4 inline mr-1.5" />
                    {t('nav.signup')}
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleDashboard}
                    className="px-5 py-2 rounded-full border border-white/20 text-white/95 hover:border-[#E88125] hover:text-[#E88125] transition text-sm font-semibold"
                  >
                    <LayoutDashboard className="w-4 h-4 inline mr-1.5" />
                    {t('nav.dashboard')}
                  </button>
                  <button
                    onClick={handleLogout}
                    className="px-5 py-2 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition text-sm font-semibold"
                  >
                    <LogOut className="w-4 h-4 inline mr-1.5" />
                    {t('nav.logout')}
                  </button>
                </>
              )}
            </div>

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden text-white/95 p-1"
              aria-label="Toggle menu"
            >
              {isOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>

        {isOpen && (
          <div className="md:hidden bg-[#0C1E16] p-6 space-y-4 border-t border-emerald-950/50">
            <div className="pb-2">
              <LanguageSwitcher />
            </div>
            {menuItems.map((item) => (
              <button
                key={item.labelKey}
                onClick={item.onClick || (() => handleScrollTo(item.id))}
                className={`block w-full text-left transition ${
                  item.path ? navLinkClass(item.path) : 'text-white/80 hover:text-[#E88125] font-medium'
                }`}
              >
                {t(item.labelKey)}
              </button>
            ))}
            <hr className="border-emerald-950/40" />
            {!isLoggedIn ? (
              <>
                <button onClick={handleLogin} className="block w-full text-left text-white/80 hover:text-[#E88125]">
                  {t('nav.login')}
                </button>
                <button onClick={handleSignup} className="block w-full text-left text-[#E88125] font-semibold">
                  {t('nav.signup')}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleProfile}
                  className={`block w-full text-left ${navLinkClass('/profile')}`}
                >
                  {t('nav.profile')}
                </button>
                <button
                  onClick={handleDashboard}
                  className={`block w-full text-left ${navLinkClass('/dashboard')}`}
                >
                  {t('nav.dashboard')}
                </button>
                <button onClick={handleLogout} className="block w-full text-left text-red-400">
                  {t('nav.logout')}
                </button>
              </>
            )}
          </div>
        )}
      </nav>
      <div className="h-16 md:h-20" />
    </>
  )
}

export default BimaSetuNavbar
