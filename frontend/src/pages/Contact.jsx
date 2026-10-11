import React, { useState } from 'react';
import {
  Mail,
  Phone,
  MapPin,
  Send,
  MessageCircle,
  Clock,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Headphones,
  Globe,
  Twitter,
  Linkedin,
  Instagram,
  Facebook
} from 'lucide-react';

const BimaSetuContact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [openFaq, setOpenFaq] = useState(null);

  // FAQ Data
  const faqs = [
    {
      id: 1,
      question: "How does BimaSetu's AI crop damage assessment work?",
      answer: "BimaSetu uses advanced computer vision and deep learning models trained on millions of crop images. When you upload a field image, our AI analyzes crop health, identifies damage patterns, and provides an accurate damage percentage along with a detailed report. The entire process takes less than 2 minutes."
    },
    {
      id: 2,
      question: 'Is BimaSetu free for farmers?',
      answer: 'Yes! BimaSetu offers free basic crop damage assessment for all farmers. We believe in democratizing access to technology. Premium features like detailed analytics and priority support are available for insurance partners and enterprise users.'
    },
    {
      id: 3,
      question: 'How accurate is the AI damage detection?',
      answer: 'Our AI models achieve 96% accuracy in controlled testing and 91-94% accuracy in real-world field conditions. We continuously train our models with new data to improve accuracy across different crop types, regions, and damage patterns.'
    },
    {
      id: 4,
      question: 'Is my data secure on BimaSetu?',
      answer: 'Absolutely. We use bank-grade encryption for all data transmission and storage. Assessment reports are secured with blockchain technology, ensuring tamper-proof evidence. We never share your personal data without explicit consent.'
    },
    {
      id: 5,
      question: 'Which crops does BimaSetu support?',
      answer: "Currently, we support over 25 major crops including wheat, rice, corn, soybean, sugarcane, cotton, and various vegetables. We're continuously expanding our crop database and adding support for more regional crops."
    },
    {
      id: 6,
      question: 'How can insurance companies integrate with BimaSetu?',
      answer: 'We offer API integration for insurance companies and government agencies. Contact our enterprise team at enterprise@bimasetu.com for custom integration solutions, white-label options, and volume pricing.'
    }
  ];

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (formData.message.length < 10) {
      newErrors.message = 'Message must be at least 10 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    setSubmitStatus(null);
    
    setTimeout(() => {
      console.log('Contact form submitted:', formData);
      setSubmitStatus('success');
      setFormData({ name: '', email: '', message: '' });
      setIsSubmitting(false);
      
      setTimeout(() => setSubmitStatus(null), 5000);
    }, 1500);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const toggleFaq = (id) => {
    setOpenFaq(openFaq === id ? null : id);
  };

  const supportOptions = [
    {
      icon: Mail,
      title: 'Email Support',
      description: 'Get response within 24 hours',
      contact: 'support@bimasetu.com',
      action: 'mailto:support@bimasetu.com',
    },
    {
      icon: Headphones,
      title: 'Phone Support',
      description: 'Mon-Fri, 9 AM - 6 PM IST',
      contact: '+91-80-4709 2110',
      action: 'tel:+918047092110',
    },
    {
      icon: MessageCircle,
      title: 'Live Chat',
      description: 'Instant response',
      contact: 'Chat with our team',
      action: '#',
    }
  ];

  const officeLocations = [
    {
      city: 'Mumbai',
      address: 'BimaSetu Tower, Andheri East, Mumbai - 400093',
      phone: '+91-22-4567 8901'
    },
    {
      city: 'Delhi NCR',
      address: 'Sector 62, Noida, Uttar Pradesh - 201301',
      phone: '+91-120-4567 890'
    },
    {
      city: 'Bengaluru',
      address: 'HSR Layout, Bengaluru - 560102',
      phone: '+91-80-4709 2110'
    }
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
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-6 border border-[#E88125]/30 bg-[#E88125]/10 text-[#E88125] text-xs font-semibold uppercase tracking-wider">
              <MessageCircle className="w-4 h-4" />
              <span>Get in Touch</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
              Let's Connect
            </h1>
            <p className="text-gray-300 text-lg leading-relaxed">
              Have questions about our AI-powered crop assessment platform? We're here to help.
              Reach out to our team for support, partnerships, or general inquiries.
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

      {/* Contact Form & Info Section */}
      <section className="py-12 md:py-16 relative -mt-16 z-20">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="grid lg:grid-cols-12 gap-8">
            
            {/* Contact Form */}
            <div className="lg:col-span-7 rounded-3xl p-6 md:p-8 bg-white border border-[#E6DCC9] shadow-md">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-[#10261C] mb-2">Send us a Message</h2>
                <p className="text-gray-500 text-sm">We'll get back to you as soon as possible</p>
              </div>

              {/* Success Message */}
              {submitStatus === 'success' && (
                <div className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/30 flex items-center gap-3 animate-slide-down">
                  <CheckCircle className="w-5 h-5 text-green-700 flex-shrink-0" />
                  <div>
                    <p className="text-green-800 text-sm font-semibold">Message Sent Successfully!</p>
                    <p className="text-green-700/80 text-xs mt-0.5">Our team will respond within 24 hours.</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Name Field */}
                <div>
                  <label className="block text-sm font-bold text-[#10261C] mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <div className={`relative transition-all duration-300 ${errors.name ? 'ring-2 ring-red-500/50 rounded-xl' : ''}`}>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl bg-white border border-[#DDD9CE] text-[#10261C] placeholder-gray-400 focus:outline-none focus:border-[#E88125] focus:ring-1 focus:ring-[#E88125] transition-all duration-300"
                      placeholder="e.g., Ramesh Kumar"
                      disabled={isSubmitting}
                    />
                  </div>
                  {errors.name && (
                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.name}
                    </p>
                  )}
                </div>

                {/* Email Field */}
                <div>
                  <label className="block text-sm font-bold text-[#10261C] mb-2">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <div className={`relative transition-all duration-300 ${errors.email ? 'ring-2 ring-red-500/50 rounded-xl' : ''}`}>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl bg-white border border-[#DDD9CE] text-[#10261C] placeholder-gray-400 focus:outline-none focus:border-[#E88125] focus:ring-1 focus:ring-[#E88125] transition-all duration-300"
                      placeholder="farmer@example.com"
                      disabled={isSubmitting}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.email}
                    </p>
                  )}
                </div>

                {/* Message Field */}
                <div>
                  <label className="block text-sm font-bold text-[#10261C] mb-2">
                    Message <span className="text-red-500">*</span>
                  </label>
                  <div className={`relative transition-all duration-300 ${errors.message ? 'ring-2 ring-red-500/50 rounded-xl' : ''}`}>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      rows="5"
                      className="w-full px-4 py-3 rounded-xl bg-white border border-[#DDD9CE] text-[#10261C] placeholder-gray-400 focus:outline-none focus:border-[#E88125] focus:ring-1 focus:ring-[#E88125] transition-all duration-300 resize-none"
                      placeholder="Tell us how we can help you..."
                      disabled={isSubmitting}
                    />
                  </div>
                  {errors.message && (
                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.message}
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 rounded-xl bg-[#E88125] text-white font-bold text-base transition-all duration-300 hover:bg-[#cf6f1b] hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Send Message
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Support Options & Office Info */}
            <div className="lg:col-span-5 space-y-6">
              <h2 className="text-2xl font-bold text-[#10261C] mb-2">Support Options</h2>
              
              {/* Support Cards */}
              {supportOptions.map((option, index) => (
                <a
                  key={index}
                  href={option.action}
                  className="block rounded-2xl p-5 transition-all duration-300 hover:translate-x-1 group bg-white border border-[#E6E1D5] shadow-sm hover:shadow-md"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#E88125]/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                      <option.icon className="w-6 h-6 text-[#E88125]" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-[#10261C] font-bold">{option.title}</h3>
                      <p className="text-gray-500 text-xs mt-0.5">{option.description}</p>
                      <p className="text-[#E88125] text-sm font-extrabold mt-1">{option.contact}</p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-[#E88125] transition-colors" />
                  </div>
                </a>
              ))}

              {/* Office Hours */}
              <div className="rounded-2xl p-5 bg-white border border-[#E6E1D5] shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <Clock className="w-5 h-5 text-[#E88125]" />
                  <h3 className="text-[#10261C] font-bold">Office Hours</h3>
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span className="font-medium">Monday - Friday</span>
                    <span className="text-[#10261C] font-bold">9:00 AM - 6:00 PM IST</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Saturday</span>
                    <span className="text-[#10261C] font-bold">10:00 AM - 4:00 PM IST</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Sunday</span>
                    <span className="text-gray-400 font-bold">Closed</span>
                  </div>
                </div>
              </div>

              {/* Social Links */}
              <div className="rounded-2xl p-5 bg-white border border-[#E6E1D5] shadow-sm">
                <h3 className="text-[#10261C] font-bold mb-3">Follow Us</h3>
                <div className="flex gap-4">
                  <a href="#" className="w-10 h-10 rounded-xl bg-[#10261C]/5 flex items-center justify-center hover:bg-[#E88125]/15 transition-colors group">
                    <Twitter className="w-5 h-5 text-gray-500 group-hover:text-[#E88125] transition-colors" />
                  </a>
                  <a href="#" className="w-10 h-10 rounded-xl bg-[#10261C]/5 flex items-center justify-center hover:bg-[#E88125]/15 transition-colors group">
                    <Linkedin className="w-5 h-5 text-gray-500 group-hover:text-[#E88125] transition-colors" />
                  </a>
                  <a href="#" className="w-10 h-10 rounded-xl bg-[#10261C]/5 flex items-center justify-center hover:bg-[#E88125]/15 transition-colors group">
                    <Instagram className="w-5 h-5 text-gray-500 group-hover:text-[#E88125] transition-colors" />
                  </a>
                  <a href="#" className="w-10 h-10 rounded-xl bg-[#10261C]/5 flex items-center justify-center hover:bg-[#E88125]/15 transition-colors group">
                    <Facebook className="w-5 h-5 text-gray-500 group-hover:text-[#E88125] transition-colors" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Office Locations */}
      <section className="py-12 bg-[#FCFAF5]">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <h2 className="text-2xl md:text-3xl font-black text-[#10261C] text-center mb-8">Our Offices</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {officeLocations.map((location, index) => (
              <div
                key={index}
                className="rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 bg-white border border-[#E6E1D5] shadow-sm hover:shadow-md"
              >
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-[#E88125] flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-[#10261C] font-bold mb-1">{location.city}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">{location.address}</p>
                    <p className="text-[#E88125] text-sm font-bold mt-2">{location.phone}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 md:py-20 bg-[#FAF6EE] border-y border-[#E6DCC9]">
        <div className="max-w-4xl mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-[#10261C] mb-4">Frequently Asked Questions</h2>
            <p className="text-gray-600">Find answers to common questions about BimaSetu</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq) => (
              <div
                key={faq.id}
                className="rounded-2xl bg-white border border-[#E6E1D5] shadow-sm transition-all duration-300"
              >
                <button
                  onClick={() => toggleFaq(faq.id)}
                  className="w-full flex items-center justify-between p-5 text-left"
                >
                  <span className="text-[#10261C] font-bold pr-4">{faq.question}</span>
                  {openFaq === faq.id ? (
                    <ChevronUp className="w-5 h-5 text-[#E88125] flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  )}
                </button>
                {openFaq === faq.id && (
                  <div className="px-5 pb-5">
                    <p className="text-gray-600 text-sm leading-relaxed border-t border-[#F2EDE2] pt-4">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Still have questions */}
          <div className="mt-8 text-center">
            <p className="text-gray-500">Still have questions?</p>
            <button
              onClick={() => window.scrollTo({ top: 400, behavior: 'smooth' })}
              className="mt-2 text-[#E88125] hover:text-[#cf6f1b] font-bold transition-colors inline-flex items-center gap-1"
            >
              Contact our support team
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Map / Location Banner */}
      <section className="py-12 bg-[#FCFAF5]">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="rounded-[2rem] p-8 text-center relative overflow-hidden bg-[#10261C] text-white shadow-xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            <Globe className="w-12 h-12 text-[#E88125] mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-2">Serving Farmers Across India</h3>
            <p className="text-gray-300 max-w-2xl mx-auto text-sm leading-relaxed">
              BimaSetu is proud to serve over 2.5 million farmers across 28 states, 
              helping them get fair and transparent crop damage assessments.
            </p>
            <div className="mt-6 flex flex-wrap gap-3 justify-center">
              {['Maharashtra', 'Uttar Pradesh', 'Punjab', 'Karnataka', 'West Bengal', 'Andhra Pradesh'].map((state, i) => (
                <span key={i} className="px-3.5 py-1 rounded-full bg-[#E88125]/10 text-white border border-[#E88125]/20 text-xs font-semibold">
                  {state}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <style jsx>{`
        @keyframes slide-down {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-down {
          animation: slide-down 0.4s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default BimaSetuContact;