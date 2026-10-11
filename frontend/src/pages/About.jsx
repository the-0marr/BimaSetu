import React, { useEffect, useRef, useState } from 'react';
import {
  Target,
  Eye,
  Shield,
  Brain,
  Cloud,
  Lock,
  Microchip,
  Globe,
  Rocket,
  Leaf,
  BarChart3,
  CheckCircle,
  TrendingUp,
  Users,
  Award,
  Zap,
  Database,
  MapPin,
  Camera,
  FileText,
  ChevronRight
} from 'lucide-react';

const BimaSetuAbout = () => {
  const [isVisible, setIsVisible] = useState({});
  const sectionRefs = useRef({});

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible((prev) => ({ ...prev, [entry.target.id]: true }));
          }
        });
      },
      { threshold: 0.1 }
    );

    Object.keys(sectionRefs.current).forEach((key) => {
      if (sectionRefs.current[key]) {
        observer.observe(sectionRefs.current[key]);
      }
    });

    return () => observer.disconnect();
  }, []);

  const stats = [
    { number: '2.5M+', label: 'Farmers Empowered', icon: Users },
    { number: '96%', label: 'Detection Accuracy', icon: Brain },
    { number: '28', label: 'States Covered', icon: MapPin },
    { number: '340Cr+', label: 'Claims Processed', icon: TrendingUp },
  ];

  const whyBimaSetuPoints = [
    {
      title: 'AI-Powered Accuracy',
      description: 'State-of-the-art deep learning models detect crop damage with 96% accuracy, reducing human error and bias.',
      icon: Brain
    },
    {
      title: 'Blockchain Security',
      description: 'Every assessment report is secured with blockchain technology, ensuring tamper-proof evidence for claims.',
      icon: Lock
    },
    {
      title: 'Fast Turnaround',
      description: 'Get assessment results in under 2 minutes, enabling faster insurance claim settlements.',
      icon: Zap
    },
    {
      title: 'Farmer-First Approach',
      description: 'Built with direct farmer feedback, our platform prioritizes ease of use and accessibility.',
      icon: Users
    }
  ];

  const technologies = [
    { name: 'Computer Vision', icon: Camera, description: 'Advanced image recognition for crop health analysis' },
    { name: 'Deep Learning', icon: Brain, description: 'Neural networks trained on millions of crop images' },
    { name: 'Blockchain', icon: Lock, description: 'Immutable record keeping for assessment transparency' },
    { name: 'Cloud Infrastructure', icon: Cloud, description: 'Scalable platform serving millions of farmers' },
    { name: 'Geospatial AI', icon: MapPin, description: 'Satellite integration for large-scale monitoring' },
    { name: 'Edge Computing', icon: Microchip, description: 'On-device processing for offline capabilities' }
  ];

  const futureScope = [
    {
      title: 'Real-time Weather Integration',
      description: 'Combine satellite weather data with AI predictions for proactive crop management.',
      icon: Cloud,
      year: '2025'
    },
    {
      title: 'Multi-Language Support',
      description: 'Extend platform accessibility across 15+ regional Indian languages.',
      icon: Globe,
      year: '2024'
    },
    {
      title: 'Drone Integration',
      description: 'Automated drone surveillance for large farmlands with instant AI analysis.',
      icon: Camera,
      year: '2025'
    },
    {
      title: 'Predictive Analytics',
      description: 'Forecast crop yield and damage risks before they occur using historical data.',
      icon: BarChart3,
      year: '2026'
    }
  ];

  const milestones = [
    { year: '2023', event: 'Platform Launched', status: 'completed' },
    { year: '2024', event: '1M+ Farmers Onboarded', status: 'completed' },
    { year: '2025', event: 'Pan-India Coverage', status: 'in-progress' },
    { year: '2026', event: 'Global Expansion', status: 'upcoming' }
  ];

  return (
    <div className="min-h-screen bg-[#FCFAF5] text-gray-800 font-sans selection:bg-[#E88125]/20">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-24 pb-32 md:pt-32 md:pb-44 bg-[#10261C] text-white">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#E88125]/10 rounded-full blur-3xl delay-1000" />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-6 border border-[#E88125]/30 bg-[#E88125]/10 text-[#E88125] text-xs font-semibold uppercase tracking-wider">
              <Leaf className="w-4 h-4" />
              <span>Our Story</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 leading-tight">
              Transforming Agriculture
              <span className="text-[#E88125] block mt-2">Through AI & Innovation</span>
            </h1>
            <p className="text-gray-300 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
              BimaSetu is on a mission to revolutionize crop damage assessment, making it transparent, 
              fast, and fair for millions of farmers across India.
            </p>
          </div>
        </div>

        {/* Curved wave transition at the bottom */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-[0]">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-[60px] fill-[#FCFAF5]">
            <path d="M0,0 C150,90 350,120 600,100 C850,80 1050,90 1200,120 L1200,120 L0,120 Z"></path>
          </svg>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 relative -mt-16 z-20">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="rounded-2xl p-6 text-center transition-all duration-300 hover:-translate-y-1.5 bg-white border border-[#E6E1D5] shadow-md hover:shadow-lg animate-fade-up"
                style={{
                  animationDelay: `${index * 100}ms`,
                }}
              >
                <div className="w-12 h-12 rounded-xl bg-[#E88125]/10 flex items-center justify-center mx-auto mb-4">
                  <stat.icon className="w-6 h-6 text-[#E88125]" />
                </div>
                <p className="text-2xl md:text-3xl font-bold text-[#10261C]">{stat.number}</p>
                <p className="text-gray-500 text-sm mt-1 font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission & Vision Section */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Mission Card */}
            <div
              ref={(el) => (sectionRefs.current['mission'] = el)}
              id="mission"
              className={`rounded-3xl p-8 md:p-10 transition-all duration-700 transform bg-white border border-[#E6DCC9] shadow-sm hover:shadow-md ${
                isVisible['mission'] ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
              }`}
            >
              <div className="w-16 h-16 rounded-2xl bg-[#10261C]/10 flex items-center justify-center mb-6">
                <Target className="w-8 h-8 text-[#10261C]" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-[#10261C] mb-4">Our Mission</h2>
              <p className="text-gray-600 text-base md:text-lg leading-relaxed">
                Improve crop damage assessment transparency using AI, ensuring every farmer receives 
                fair and timely compensation for their losses. We're building trust between farmers, 
                insurers, and government through verifiable, data-driven assessments.
              </p>
              <div className="mt-6 flex items-center gap-2 text-[#E88125] font-bold hover:text-[#cf6f1b] cursor-pointer">
                <span className="text-sm">Learn more</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>

            {/* Vision Card */}
            <div
              ref={(el) => (sectionRefs.current['vision'] = el)}
              id="vision"
              className={`rounded-3xl p-8 md:p-10 transition-all duration-700 delay-200 transform bg-white border border-[#E6DCC9] shadow-sm hover:shadow-md ${
                isVisible['vision'] ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
              }`}
            >
              <div className="w-16 h-16 rounded-2xl bg-[#E88125]/10 flex items-center justify-center mb-6">
                <Eye className="w-8 h-8 text-[#E88125]" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-[#10261C] mb-4">Our Vision</h2>
              <p className="text-gray-600 text-base md:text-lg leading-relaxed">
                Empower farmers through technology, creating an ecosystem where every farmer has 
                access to transparent, real-time crop assessment tools. We envision a future where 
                technology bridges the gap between farmers and fair agricultural insurance.
              </p>
              <div className="mt-6 flex items-center gap-2 text-[#E88125] font-bold hover:text-[#cf6f1b] cursor-pointer">
                <span className="text-sm">Read our manifesto</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why BimaSetu Section */}
      <section className="py-16 md:py-24 bg-[#FAF6EE] border-y border-[#E6DCC9]">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-[#10261C] mb-4">Why BimaSetu</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Discover what makes BimaSetu the trusted choice for farmers and insurers across India
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {whyBimaSetuPoints.map((point, index) => (
              <div
                key={index}
                className="rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-md bg-white border border-[#E6E1D5]"
              >
                <div className="w-14 h-14 rounded-xl bg-[#E88125]/10 flex items-center justify-center mb-4">
                  <point.icon className="w-7 h-7 text-[#E88125]" />
                </div>
                <h3 className="text-lg font-bold text-[#10261C] mb-2">{point.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{point.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technology Used Section */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-4 border border-[#E88125]/20 bg-[#E88125]/5 text-[#E88125] text-xs font-semibold uppercase tracking-wider">
              <Database className="w-4 h-4" />
              <span>Cutting-Edge Tech Stack</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-[#10261C] mb-4">Technology Used</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              We leverage the most advanced technologies to deliver accurate, fast, and reliable crop assessments
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {technologies.map((tech, index) => (
              <div
                key={index}
                className="rounded-2xl p-6 transition-all duration-300 hover:border-[#E88125] border border-[#E6E1D5] bg-white group shadow-sm hover:shadow-md"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#10261C]/5 flex items-center justify-center flex-shrink-0 group-hover:bg-[#E88125]/10 transition-colors">
                    <tech.icon className="w-6 h-6 text-[#10261C] group-hover:text-[#E88125] transition-colors" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[#10261C] mb-1">{tech.name}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">{tech.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Future Scope Section */}
      <section className="py-16 md:py-24 bg-[#FAF6EE] border-y border-[#E6DCC9]">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-[#10261C] mb-4">Future Scope</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              What's next for BimaSetu? Here's our roadmap for the coming years
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {futureScope.map((item, index) => (
              <div
                key={index}
                className="rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1.5 bg-white border border-[#E6E1D5] shadow-sm hover:shadow-md"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-[#E88125]/10 flex items-center justify-center">
                    <item.icon className="w-6 h-6 text-[#E88125]" />
                  </div>
                  <span className="text-xs font-mono font-bold text-[#E88125] bg-[#E88125]/10 px-2.5 py-1 rounded-full">
                    {item.year}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-[#10261C] mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Journey Milestones */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-[#10261C] mb-4">Our Journey</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              From inception to becoming India's leading agri-tech platform
            </p>
          </div>

          <div className="relative">
            <div className="absolute left-1/2 transform -translate-x-1/2 w-0.5 h-full bg-[#E6DCC9] hidden md:block" />
            
            <div className="space-y-8">
              {milestones.map((milestone, index) => (
                <div key={index} className={`flex flex-col md:flex-row items-center gap-6 ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                  <div className="flex-1 w-full">
                    <div className="rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 bg-white border border-[#E6E1D5] shadow-md">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-2xl font-black text-[#E88125]">{milestone.year}</span>
                        {milestone.status === 'completed' && <CheckCircle className="w-5 h-5 text-emerald-600" />}
                        {milestone.status === 'in-progress' && <Zap className="w-5 h-5 text-[#E88125] animate-pulse" />}
                      </div>
                      <p className="text-[#10261C] font-semibold">{milestone.event}</p>
                    </div>
                  </div>
                  <div className="hidden md:block w-4 h-4 rounded-full bg-[#E88125] relative z-10" />
                  <div className="flex-1" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4 md:px-6">
          <div className="rounded-[2.5rem] p-10 md:p-16 text-center bg-[#10261C] text-white border border-emerald-950/20 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            <Rocket className="w-12 h-12 text-[#E88125] mx-auto mb-4" />
            <h2 className="text-2xl md:text-4xl font-black mb-4">Join Us in Transforming Agriculture</h2>
            <p className="text-gray-300 mb-8 max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
              Whether you're a farmer, insurer, or technology partner, BimaSetu welcomes you to be part of the agricultural revolution.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <button className="px-8 py-3.5 rounded-full bg-[#E88125] text-white font-bold transition-all duration-300 hover:bg-[#cf6f1b] hover:scale-[1.02] shadow-lg">
                Get Started Today
              </button>
              <button className="px-8 py-3.5 rounded-full border border-white/25 text-white font-semibold transition-all duration-300 hover:border-[#E88125] hover:text-[#E88125] hover:bg-white/5">
                Contact Our Team
              </button>
            </div>
          </div>
        </div>
      </section>

      <style jsx>{`
        @keyframes fade-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-up {
          animation: fade-up 0.6s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  );
};

export default BimaSetuAbout;