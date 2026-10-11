import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../i18n/LanguageContext'
import {
  Sprout,
  Microchip,
  MapPin,
  FileText,
  Tractor,
  ChartLine,
  Camera,
  Shield,
  Users,
  Building2,
  CheckCircle2,
  ArrowRight,
  Leaf,
  Zap,
  Clock,
  Globe,
  AlertCircle,
  ChevronDown,
} from 'lucide-react'

const cardGlass = {
  background: 'rgba(255, 255, 255, 0.8)',
  backdropFilter: 'blur(8px)',
  border: '1px solid rgba(22, 58, 43, 0.12)',
}

const FeatureCard = ({ icon: Icon, title, description, index, hoveredCard, setHoveredCard }) => (
  <div
    className={`group rounded-2xl p-7 transition-all duration-300 hover:-translate-y-2 bg-white border border-[#E6E1D5] ${
      hoveredCard === index ? 'border-[#E88125]' : ''
    }`}
    onMouseEnter={() => setHoveredCard(index)}
    onMouseLeave={() => setHoveredCard(null)}
  >
    <div className="w-14 h-14 bg-[#E88125]/10 rounded-xl flex justify-center items-center mb-4 group-hover:scale-110 transition-transform">
      <Icon className="w-6 h-6 text-[#E88125]" />
    </div>
    <h3 className="text-xl font-bold mb-3 text-[#10261C]">{title}</h3>
    <p className="text-gray-600 leading-relaxed text-sm">{description}</p>
  </div>
)

const StepCard = ({ number, title, body, icon: Icon }) => (
  <div className="relative rounded-2xl p-6 bg-white border border-[#E6E1D5] shadow-sm">
    <span className="absolute -top-3 -left-3 w-10 h-10 rounded-full bg-[#E88125] text-white font-bold flex items-center justify-center text-sm shadow">
      {number}
    </span>
    <Icon className="w-8 h-8 text-[#E88125] mb-4 mt-2" />
    <h3 className="text-lg font-bold text-[#10261C] mb-2">{title}</h3>
    <p className="text-gray-500 text-sm leading-relaxed">{body}</p>
  </div>
)

const BimaSetuLanding = () => {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const [hoveredCard, setHoveredCard] = useState(null)
  const [openFaq, setOpenFaq] = useState(null)

  const scrollToSection = (id) => {
    const element = document.getElementById(id)
    if (element) element.scrollIntoView({ behavior: 'smooth' })
  }

  const handleGetStarted = () => navigate('/signup')
  const handleLogin = () => navigate('/login')

  const heroBullets = useMemo(
    () => [t('landing.bulletSeg'), t('landing.bulletClass'), t('landing.bulletGps'), t('landing.bulletPdf')],
    [t]
  )

  const coreFeatures = useMemo(() => [
    {
      icon: Microchip,
      title: t('landing.featAi'),
      description:
        'SAM (Segment Anything Model) segmentation maps healthy crop versus damaged areas in your field photo. An AI classifier then labels the damage type—waterlogging, lodging, hail, or pest—with a confidence score insurers can review.',
    },
    {
      icon: MapPin,
      title: t('landing.featGeo'),
      description:
        'Every assessment is tied to GPS coordinates and a capture timestamp from your device. This creates a verifiable chain of evidence for field visits and reduces disputes over when and where damage occurred.',
    },
    {
      icon: FileText,
      title: t('landing.featPdf'),
      description:
        'ReportLab generates a structured two-page claim document with your photo, AI overlay mask, damage percentage, classification, and metadata—formatted for Pradhan Mantri Fasal Bima Yojana (PMFBY) review workflows.',
    },
    {
      icon: Camera,
      title: t('landing.featMobile'),
      description:
        'Use your phone’s rear camera directly in the browser to photograph affected plots. No separate app install required—ideal for farmers documenting losses immediately after a weather event.',
    },
    {
      icon: ChartLine,
      title: t('landing.featDash'),
      description:
        'After sign-in, track every claim in one place: view analysis results, download PDFs, monitor pending versus completed assessments, and start new uploads without repeating paperwork.',
    },
    {
      icon: Shield,
      title: t('landing.featTransparent'),
      description:
        'BimaSetu assists—not replaces—licensed agricultural assessors. All outputs are clearly marked for insurer verification, keeping the process honest for farmers and fair for insurance partners.',
    },
  ], [t])

  const processSteps = useMemo(() => [
    {
      icon: Camera,
      title: t('landing.stepCapture'),
      body: 'Log in, open the dashboard, and photograph damaged crops. GPS and time are recorded automatically when location access is enabled on your device.',
    },
    {
      icon: Zap,
      title: t('landing.stepAnalyze'),
      body: 'Images are uploaded to our FastAPI backend. Segmentation estimates damaged area percentage; classification identifies the likely cause. If ML weights are unavailable, proven colour-rule fallbacks still produce usable results.',
    },
    {
      icon: FileText,
      title: t('landing.stepReport'),
      body: 'A PMFBY-oriented PDF is generated and stored. Download it from your dashboard, share with your insurer or cooperative, and keep a digital copy for your records.',
    },
    {
      icon: CheckCircle2,
      title: t('landing.stepTrack'),
      body: 'All claims stay linked to your account. Revisit past assessments, compare damage levels across events, and build a history that supports faster processing on future claims.',
    },
  ], [t])

  const audiences = useMemo(() => [
    {
      icon: Users,
      title: t('landing.audFarmers'),
      body: 'Document crop loss quickly after floods, storms, or pest outbreaks—without waiting days for a manual survey team to reach remote plots.',
    },
    {
      icon: Building2,
      title: t('landing.audInsurers'),
      body: 'Receive standardized photos, masks, and PDFs that speed up desk review. AI pre-analysis highlights severity before field officers confirm final liability.',
    },
    {
      icon: Globe,
      title: t('landing.audFpo'),
      body: 'Support member farmers with a single digital platform. Bulk awareness of PMFBY documentation norms improves claim acceptance rates across the group.',
    },
  ], [t])

  const faqs = [
    {
      q: 'Is BimaSetu an official PMFBY portal?',
      a: 'No. BimaSetu is an independent assistive tool that formats reports for PMFBY-style review. Final claim approval always rests with your insurer and licensed assessor.',
    },
    {
      q: 'What crops and damage types are supported?',
      a: 'The AI is trained around common damage classes: waterlogging, lodging, hail, and pest. Segmentation works on visible crop canopy in daylight photos; accuracy improves with clear, close-up images.',
    },
    {
      q: 'Do I need internet in the field?',
      a: 'You need connectivity to upload and run analysis. Capture photos offline if needed, then upload when you reach network coverage.',
    },
    {
      q: 'Is my data secure?',
      a: 'Claims are stored against your account ID. Use Google sign-in or a registered email. Do not share login credentials; downloaded PDFs are your responsibility to store safely.',
    },
  ]

  return (
    <div className="min-h-screen bg-[#FCFAF5] text-gray-800 font-sans selection:bg-[#E88125]/20">
      <main>
        {/* Hero Section */}
        <section id="hero" className="relative px-6 pt-20 pb-32 md:pt-28 md:pb-44 bg-[#10261C] text-white overflow-hidden">
          {/* Decorative background grids/glows */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-[#E88125]/10 rounded-full blur-2xl pointer-events-none"></div>
          
          <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center relative z-10">
            <div>
              <div className="inline-flex gap-2 items-center text-[#E88125] mb-6 px-4 py-1.5 rounded-full border border-[#E88125]/30 bg-[#E88125]/10 text-xs font-semibold uppercase tracking-wider">
                <Microchip className="w-4 h-4" />
                {t('landing.badge') || "PMFBY ALIGNED VISION AI"}
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 leading-tight tracking-tight text-white">
                Guard Agriculture for your allforms
              </h1>
              <p className="text-gray-300 text-lg mb-4 leading-relaxed max-w-lg">
                {t('landing.heroP1') || "Verifiable, automated crop loss intelligence powered by state-of-the-art vision models."}
              </p>
              <p className="text-gray-400 mb-8 leading-relaxed max-w-lg">
                {t('landing.heroP2') || "BimaSetu uses HSV analytics and SAM (Segment Anything Model) segmentation to generate audit-ready claims immediately on-site."}
              </p>
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={handleGetStarted}
                  className="bg-[#E88125] text-white px-8 py-3.5 rounded-full font-bold hover:bg-[#cf6f1b] transition shadow-lg flex items-center gap-2"
                >
                  {t('landing.getStarted') || "Get Started"}
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={handleLogin}
                  className="border border-white/20 hover:border-[#E88125] text-white px-8 py-3.5 rounded-full hover:bg-white/5 transition font-semibold"
                >
                  {t('landing.farmerLogin') || "Farmer Login"}
                </button>
              </div>
              
              <button
                type="button"
                onClick={() => scrollToSection('services')}
                className="mt-12 flex items-center gap-2 text-gray-400 hover:text-[#E88125] text-sm transition"
              >
                {t('landing.learnMore') || "Learn More"}
                <ChevronDown className="w-4 h-4 animate-bounce" />
              </button>
            </div>

            {/* Hero Image / Card - Styled matching the farmer image in the reference */}
            <div className="relative flex justify-center">
              <div className="absolute -inset-2 bg-gradient-to-r from-emerald-500 to-[#E88125] rounded-[2.5rem] blur opacity-20"></div>
              <div className="relative rounded-[2.5rem] overflow-hidden border-8 border-[#163024] shadow-2xl bg-[#163024] max-w-md w-full h-[450px]">
                <img
                  src="/farmer_empowerment.png"
                  alt="Agriculture"
                  className="w-full h-full object-cover opacity-95 hover:scale-105 transition-transform duration-700"
                />
                {/* Floating Status Box */}
                <div className="absolute bottom-6 left-6 right-6 bg-black/60 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#E88125]/20 flex justify-center items-center">
                    <Sprout className="w-5 h-5 text-[#E88125]" />
                  </div>
                  <div>
                    <p className="text-white text-xs font-bold">BimaSetu AI Core Active</p>
                    <p className="text-gray-400 text-[10px]">Verifying Field GPS tags...</p>
                  </div>
                  <div className="ml-auto w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Curved wave transition at the bottom */}
          <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-[0]">
            <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-[60px] fill-[#FCFAF5]">
              <path d="M0,0 C150,90 350,120 600,100 C850,80 1050,90 1200,120 L1200,120 L0,120 Z"></path>
            </svg>
          </div>
        </section>

        {/* Section 2: Services / Connections ("Centiones of Connections") */}
        <section id="services" className="px-6 py-24 bg-[#FCFAF5] text-[#10261C]">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-3xl mx-auto mb-20">
              <h2 className="text-3xl md:text-5xl font-black mb-6 tracking-tight">
                Centiones of Connections
              </h2>
              <p className="text-gray-600 text-lg leading-relaxed">
                We offer a trusted pipeline that matches farmers' loss claims directly with insurer assessment expectations under Pradhan Mantri Fasal Bima Yojana (PMFBY).
              </p>
            </div>

            <div className="grid lg:grid-cols-12 gap-12 items-center">
              {/* Left Side: Large vertical crop card with scan effect */}
              <div className="lg:col-span-5 relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-600 to-[#E88125] rounded-[2rem] blur opacity-15"></div>
                <div className="relative rounded-[2rem] overflow-hidden border border-[#E0DBCF] bg-white p-4 shadow-xl">
                  <div className="scan-container relative rounded-2xl h-[380px] overflow-hidden scan-border scan-pulse">
                    <img
                      src="/agriculture_ai_scan.png"
                      alt="AI Agriculture Scanning"
                      className="w-full h-full object-cover opacity-90 transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute top-4 left-4 bg-[#10261C]/90 text-white text-xs font-semibold px-3 py-1.5 rounded-md backdrop-blur-sm border border-white/10">
                      AI Field Analysis Mode
                    </div>
                  </div>
                  <div className="mt-4 p-2">
                    <h4 className="font-bold text-lg">Holographic Crop Diagnostic</h4>
                    <p className="text-sm text-gray-500 mt-1">Real-time HSV nature color checks & Laplacian edge detection checks active.</p>
                  </div>
                </div>
              </div>

              {/* Right Side: Service Cards list */}
              <div className="lg:col-span-7 space-y-6">
                <div>
                  <span className="text-[#E88125] text-xs font-extrabold uppercase tracking-wider">Service Cards</span>
                  <h3 className="text-2xl md:text-4xl font-extrabold mt-2 mb-4 text-[#10261C]">
                    State-of-the-Art ML Pipeline
                  </h3>
                  <p className="text-gray-600 mb-8">
                    Every uploaded photo goes through a secure multi-layer validation pipeline to ensure high accuracy and reject non-crop uploads.
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                  {coreFeatures.slice(0, 4).map((feat, idx) => {
                    const IconComponent = feat.icon;
                    return (
                      <div
                        key={idx}
                        className="p-6 rounded-2xl bg-white border border-[#E6E1D5] hover:border-[#E88125] hover:shadow-md transition-all duration-300"
                      >
                        <div className="w-12 h-12 rounded-xl bg-[#E88125]/10 flex justify-center items-center mb-4">
                          <IconComponent className="w-6 h-6 text-[#E88125]" />
                        </div>
                        <h4 className="font-bold text-lg text-[#10261C] mb-2">{feat.title}</h4>
                        <p className="text-sm text-gray-600 leading-relaxed">{feat.description}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Key Features (Responsive Features Section - 3 Columns) */}
        <section id="features" className="px-6 py-24 bg-[#FAF6EE] text-[#10261C] border-y border-[#E6DCC9]">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl md:text-4xl font-black mb-4">Responsive Contact & Features</h2>
              <p className="text-gray-600">Explore why crop assessors and insurance networks rely on BimaSetu.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Column 1: Small stacked card elements with crop photos */}
              <div className="space-y-6">
                <div className="rounded-2xl overflow-hidden bg-white border border-[#E6E1D5] shadow-sm hover:shadow-md transition">
                  <div className="h-44 overflow-hidden relative">
                    <img src="/smart_farming.png" alt="Smart Farming" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    <div className="absolute bottom-3 left-4 text-white text-xs font-bold uppercase tracking-wider bg-emerald-700/80 px-2 py-0.5 rounded">
                      Field Tagger
                    </div>
                  </div>
                  <div className="p-5">
                    <h4 className="font-bold text-md mb-2">Automated GPS Tracking</h4>
                    <p className="text-xs text-gray-500">Acquires accurate coordinates on capture to guarantee authentic field assessments.</p>
                  </div>
                </div>

                <div className="rounded-2xl overflow-hidden bg-white border border-[#E6E1D5] shadow-sm hover:shadow-md transition p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                    </div>
                    <span className="text-xs font-bold text-gray-500">Live Camera Captures Only</span>
                  </div>
                  <p className="text-xs text-gray-600">Forces authentic submissions by blocking standard gallery uploads on-site.</p>
                </div>
              </div>

              {/* Column 2: Key feature checklist */}
              <div className="rounded-2xl bg-white border border-[#E6E1D5] p-8 shadow-sm flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-xl mb-4 text-[#10261C]">Why BimaSetu?</h4>
                  <p className="text-xs text-gray-500 mb-6">Designed directly around real PMFBY field practices and standard insurance documentation norms.</p>
                  
                  <ul className="space-y-4">
                    {[
                      "Accurate crop type and field validation",
                      "Instant PDF claim report generation",
                      "GPS and capture timestamp integration",
                      "Intuitive, multilingual dashboard flow",
                      "Efficient SQLite backend auditing database"
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-[#E88125]/10 flex items-center justify-center shrink-0 mt-0.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#E88125]" />
                        </div>
                        <span className="text-xs text-gray-700 font-medium">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8 pt-6 border-t border-[#F2EDE2]">
                  <button
                    onClick={handleGetStarted}
                    className="w-full py-2.5 rounded-full bg-[#10261C] hover:bg-[#163527] text-white text-xs font-bold tracking-wide transition shadow"
                  >
                    View All Integrations
                  </button>
                </div>
              </div>

              {/* Column 3: Large vertical card with agri_3d_analytics */}
              <div className="relative group overflow-hidden rounded-2xl border border-[#E6E1D5] bg-white p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between">
                <div>
                  <div className="relative rounded-xl overflow-hidden h-60 mb-5">
                    <img src="/agri_3d_analytics.png" alt="Agri Analytics" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                    <span className="absolute bottom-3 left-4 text-[10px] font-bold text-white uppercase tracking-wider bg-[#E88125] px-2.5 py-0.5 rounded-full shadow">
                      Interactive Dashboard
                    </span>
                  </div>
                  <h4 className="font-bold text-lg mb-2">3D Analytics & Dashboard</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Instantly view your claims history, track active assessments, and download structured documents.
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-[#F2EDE2] flex items-center justify-between text-xs text-gray-400">
                  <span>Version 1.2.0</span>
                  <span className="text-[#E88125] font-bold">Active API support</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Testimonials & Contact Form */}
        <section id="why" className="px-6 py-24 bg-[#FCFAF5] text-[#10261C]">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-12 gap-12 items-center">
              {/* Left Column: Form & Title */}
              <div className="md:col-span-7">
                <span className="text-[#E88125] text-xs font-extrabold uppercase tracking-wider">Testimonials & Feedback</span>
                <h2 className="text-3xl md:text-5xl font-black mt-2 mb-6 tracking-tight">Testimonially of Farebaces</h2>
                <p className="text-gray-600 mb-8 leading-relaxed">
                  Have questions about BimaSetu's AI integrations, custom models, or setup? Send us a message and our support team will respond within 24 hours.
                </p>

                <form className="space-y-4 max-w-lg" onSubmit={(e) => e.preventDefault()}>
                  <div>
                    <input
                      type="text"
                      placeholder="Your Name"
                      className="w-full bg-white border border-[#DDD9CE] text-[#10261C] placeholder-gray-400 rounded-xl px-4 py-3 focus:outline-none focus:border-[#E88125] focus:ring-1 focus:ring-[#E88125] transition"
                    />
                  </div>
                  <div>
                    <input
                      type="email"
                      placeholder="Your Email Address"
                      className="w-full bg-white border border-[#DDD9CE] text-[#10261C] placeholder-gray-400 rounded-xl px-4 py-3 focus:outline-none focus:border-[#E88125] focus:ring-1 focus:ring-[#E88125] transition"
                    />
                  </div>
                  <div>
                    <textarea
                      rows="4"
                      placeholder="How can we assist you?"
                      className="w-full bg-white border border-[#DDD9CE] text-[#10261C] placeholder-gray-400 rounded-xl px-4 py-3 focus:outline-none focus:border-[#E88125] focus:ring-1 focus:ring-[#E88125] transition resize-none"
                    ></textarea>
                  </div>
                  <button
                    type="submit"
                    className="bg-[#E88125] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#cf6f1b] transition shadow-md"
                  >
                    Submit Feedback
                  </button>
                </form>
              </div>

              {/* Right Column: Smiling farmer in field (Themed preview) */}
              <div className="md:col-span-5 relative flex justify-center">
                <div className="relative rounded-[2rem] overflow-hidden border-8 border-white shadow-xl bg-white max-w-sm w-full h-[400px]">
                  <img
                    src="/smart_farming.png"
                    alt="Farmer smiling"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#10261C]/75 to-transparent"></div>
                  <div className="absolute bottom-6 left-6 text-white">
                    <p className="text-xs text-amber-400 font-bold uppercase tracking-widest mb-1">Impact Stats</p>
                    <h4 className="text-xl font-black">10,000+ Farms Verified</h4>
                    <p className="text-xs text-gray-300 mt-1">Helping farmers get reliable compensation across India.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 5: Footer */}
        <footer id="contact" className="bg-[#2E1E17] text-white/80 py-16 px-6 border-t border-[#231712]">
          <div className="max-w-7xl mx-auto grid md:grid-cols-12 gap-10">
            {/* Column 1: Brand details */}
            <div className="md:col-span-4">
              <div className="flex items-center gap-2 mb-4">
                <Sprout className="w-6 h-6 text-[#E88125]" />
                <span className="font-bold text-xl text-white tracking-wide">
                  Bima<span className="text-[#E88125]">Setu</span>
                </span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed mb-4 max-w-sm">
                BimaSetu is a modern vision analytics platform engineered to assist in the agricultural crop loss assessment process.
              </p>
              <div className="text-[10px] text-gray-500 max-w-xs flex gap-2">
                <AlertCircle className="w-4 h-4 text-[#E88125] shrink-0 mt-0.5" />
                {t('landing.disclaimer') || "Final claim approval rests with the licensed PMFBY surveyor."}
              </div>
            </div>

            {/* Column 2: Quick Links */}
            <div className="md:col-span-2 space-y-3">
              <h4 className="text-white text-xs font-black uppercase tracking-wider">Product</h4>
              <ul className="space-y-2 text-xs text-gray-400">
                <li><a href="#hero" className="hover:text-white transition">Home</a></li>
                <li><a href="#services" className="hover:text-white transition">Services</a></li>
                <li><a href="#features" className="hover:text-white transition">Features</a></li>
              </ul>
            </div>

            {/* Column 3: Contact */}
            <div className="md:col-span-3 space-y-3">
              <h4 className="text-white text-xs font-black uppercase tracking-wider">{t('landing.contact') || "Contact"}</h4>
              <p className="text-xs text-gray-400">support@bimasetu.com</p>
              <p className="text-[10px] text-gray-500">{t('landing.supportHours') || "Mon-Fri: 9:00 AM - 6:00 PM IST"}</p>
            </div>

            {/* Column 4: Newsletter Box (matches the green card in the reference) */}
            <div className="md:col-span-3">
              <div className="bg-[#10261C] border border-emerald-900/30 rounded-2xl p-6 shadow-xl text-white">
                <h4 className="text-xs font-bold tracking-wider uppercase mb-2">Newsletter</h4>
                <p className="text-[10px] text-gray-400 mb-4 leading-relaxed">
                  Subscribe to receive updates on crop classification versions and model integrations.
                </p>
                <div className="flex gap-2">
                  <input
                    type="email"
                    placeholder="Enter email"
                    className="bg-[#0A1A13] border border-[#16382B] text-xs text-white rounded-lg px-3 py-2 w-full focus:outline-none focus:border-[#E88125]"
                  />
                  <button className="bg-[#E88125] hover:bg-[#cf6f1b] transition px-3.5 rounded-lg text-white font-bold text-xs">
                    Join
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto text-center text-[10px] text-gray-500 border-t border-[#3a261d] mt-12 pt-8">
            <p>{t('nav.brand') || "BimaSetu"} © {new Date().getFullYear()} · Automated Crop Damage Assessment Platform</p>
            <p className="mt-2 flex items-center justify-center gap-1.5 text-[10px] text-gray-500">
              <Clock className="w-3.5 h-3.5 text-[#E88125]" />
              {t('landing.builtFor') || "Built for Indian Farmers"}
            </p>
          </div>
        </footer>
      </main>
    </div>
  )
}

export default BimaSetuLanding
