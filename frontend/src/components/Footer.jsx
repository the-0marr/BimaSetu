import React from 'react';
import {
  Seedling,
  Facebook,
  Twitter,
  Linkedin,
  Instagram,
  Youtube,
  Mail,
  Phone,
  MapPin,
  ChevronRight,
  Shield,
  Zap,
  FileText,
  Home,
  Info,
  HelpCircle,
  Globe
} from 'lucide-react';

const BimaSetuFooter = () => {
  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Features', href: '/features', icon: Zap },
    { name: 'About Us', href: '/about', icon: Info },
    { name: 'Contact', href: '/contact', icon: HelpCircle },
  ];

  const features = [
    { name: 'AI Damage Detection', href: '/features#ai-detection' },
    { name: 'Geo-tag Verification', href: '/features#geotag' },
    { name: 'PMFBY Reports', href: '/features#pmfby' },
    { name: 'Farmer Dashboard', href: '/dashboard' },
  ];

  const contactInfo = [
    { icon: Mail, text: 'support@bimasetu.com', href: 'mailto:support@bimasetu.com' },
    { icon: Phone, text: '+91-80-4709 2110', href: 'tel:+918047092110' },
    { icon: MapPin, text: 'Bengaluru, India', href: '#' },
  ];

  const socialIcons = [
    { icon: Facebook, href: '#', label: 'Facebook', color: 'hover:bg-[#1877f2]' },
    { icon: Twitter, href: '#', label: 'Twitter', color: 'hover:bg-[#1da1f2]' },
    { icon: Linkedin, href: '#', label: 'LinkedIn', color: 'hover:bg-[#0a66c2]' },
    { icon: Instagram, href: '#', label: 'Instagram', color: 'hover:bg-[#e4405f]' },
    { icon: Youtube, href: '#', label: 'YouTube', color: 'hover:bg-[#ff0000]' },
  ];

  const handleScrollTo = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="relative mt-auto">
      {/* Main Footer */}
      <div 
        className="relative pt-16 pb-8 overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, #0A120E 0%, #07100B 100%)',
          borderTop: '1px solid rgba(70, 130, 70, 0.3)',
        }}
      >
        {/* Background Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[-100px] left-[-100px] w-64 h-64 bg-emerald-700/10 rounded-full blur-3xl" />
          <div className="absolute bottom-[-100px] right-[-100px] w-80 h-80 bg-amber-800/10 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            
            {/* Logo & Brand Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 group cursor-pointer" onClick={() => handleScrollTo('home')}>
                <div className="relative">
                  <div className="absolute inset-0 bg-amber-500/30 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <Seedling className="w-8 h-8 text-amber-500 relative z-10 transition-transform duration-300 group-hover:scale-110" />
                </div>
                <span className="text-2xl font-extrabold bg-gradient-to-r from-emerald-300 via-lime-400 to-amber-400 bg-clip-text text-transparent">
                  BimaSetu
                </span>
              </div>
              
              <p className="text-gray-400 text-sm leading-relaxed">
                AI-powered crop damage assessment platform helping farmers get fair and transparent insurance claims.
              </p>
              
              {/* Trust Badge */}
              <div className="flex items-center gap-3 pt-2">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-900/30 border border-emerald-700/30">
                  <Shield className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 text-xs font-medium">96% Accuracy</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-900/30 border border-emerald-700/30">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-amber-400 text-xs font-medium">2.5M+ Farmers</span>
                </div>
              </div>
            </div>

            {/* Quick Links Section */}
            <div>
              <h3 className="text-white font-semibold text-lg mb-4 relative inline-block">
                Quick Links
                <div className="absolute bottom-[-6px] left-0 w-8 h-0.5 bg-amber-500 rounded-full"></div>
              </h3>
              <ul className="space-y-3">
                {quickLinks.map((link, index) => (
                  <li key={index}>
                    <a
                      href={link.href}
                      className="group flex items-center gap-2 text-gray-400 hover:text-amber-400 transition-all duration-300 text-sm"
                    >
                      <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 -translate-x-2 transition-all duration-300" />
                      <link.icon className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
                      <span className="group-hover:translate-x-1 transition-transform duration-300">
                        {link.name}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Features Section */}
            <div>
              <h3 className="text-white font-semibold text-lg mb-4 relative inline-block">
                Features
                <div className="absolute bottom-[-6px] left-0 w-8 h-0.5 bg-amber-500 rounded-full"></div>
              </h3>
              <ul className="space-y-3">
                {features.map((feature, index) => (
                  <li key={index}>
                    <a
                      href={feature.href}
                      className="group flex items-center gap-2 text-gray-400 hover:text-amber-400 transition-all duration-300 text-sm"
                    >
                      <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 -translate-x-2 transition-all duration-300" />
                      <span className="group-hover:translate-x-1 transition-transform duration-300">
                        {feature.name}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact Section */}
            <div>
              <h3 className="text-white font-semibold text-lg mb-4 relative inline-block">
                Contact Us
                <div className="absolute bottom-[-6px] left-0 w-8 h-0.5 bg-amber-500 rounded-full"></div>
              </h3>
              <ul className="space-y-3">
                {contactInfo.map((item, index) => (
                  <li key={index}>
                    <a
                      href={item.href}
                      className="group flex items-center gap-3 text-gray-400 hover:text-amber-400 transition-all duration-300 text-sm"
                    >
                      <div className="w-7 h-7 rounded-lg bg-emerald-900/30 flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
                        <item.icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="group-hover:translate-x-1 transition-transform duration-300">
                        {item.text}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>

              {/* Newsletter Signup */}
              <div className="mt-6">
                <p className="text-gray-400 text-xs mb-2">Stay updated with our newsletter</p>
                <div className="flex">
                  <input
                    type="email"
                    placeholder="Email address"
                    className="flex-1 px-3 py-2 text-sm rounded-l-lg bg-emerald-900/30 border border-emerald-700/50 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50"
                  />
                  <button className="px-3 py-2 rounded-r-lg bg-gradient-to-r from-amber-500 to-amber-600 text-emerald-950 font-semibold text-xs hover:shadow-lg transition-all">
                    Subscribe
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Social Icons Section */}
          <div className="flex flex-col md:flex-row justify-between items-center mt-12 pt-8 border-t border-emerald-800/30">
            <div className="flex gap-4 mb-4 md:mb-0">
              {socialIcons.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  aria-label={social.label}
                  className={`w-9 h-9 rounded-xl bg-emerald-900/30 flex items-center justify-center text-gray-400 transition-all duration-300 hover:scale-110 ${social.color} hover:text-white`}
                >
                  <social.icon className="w-4 h-4" />
                </a>
              ))}
            </div>

            {/* Language Selector */}
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-gray-500" />
              <select className="bg-transparent text-gray-400 text-sm border border-emerald-700/50 rounded-lg px-2 py-1.5 focus:outline-none focus:border-amber-500/50 cursor-pointer hover:text-amber-400 transition-colors">
                <option value="en">English</option>
                <option value="hi">हिंदी</option>
                <option value="mr">मराठी</option>
                <option value="te">తెలుగు</option>
                <option value="ta">தமிழ்</option>
              </select>
            </div>
          </div>

          {/* Bottom Text */}
          <div className="text-center mt-8 pt-4 border-t border-emerald-800/20">
            <p className="text-gray-500 text-xs">
              © {currentYear} BimaSetu. AI-Assisted Crop Assessment Platform.
            </p>
            <div className="flex flex-wrap justify-center gap-4 mt-3 text-xs">
              <a href="#" className="text-gray-500 hover:text-amber-400 transition-colors">Privacy Policy</a>
              <span className="text-gray-600">•</span>
              <a href="#" className="text-gray-500 hover:text-amber-400 transition-colors">Terms of Service</a>
              <span className="text-gray-600">•</span>
              <a href="#" className="text-gray-500 hover:text-amber-400 transition-colors">Cookie Policy</a>
              <span className="text-gray-600">•</span>
              <a href="#" className="text-gray-500 hover:text-amber-400 transition-colors">GDPR Compliance</a>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll to Top Button */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed bottom-6 right-6 w-10 h-10 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-emerald-950 flex items-center justify-center shadow-lg hover:scale-110 transition-all duration-300 z-50 opacity-0 group-hover:opacity-100"
        style={{ opacity: 0.8 }}
        aria-label="Scroll to top"
      >
        <ChevronRight className="w-5 h-5 rotate-[-90deg]" />
      </button>
    </footer>
  );
};

export default BimaSetuFooter;