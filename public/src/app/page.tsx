"use client";

import Footer from "@/components/footer";
import Header from "@/components/header";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef } from "react";
import { useCursorStore } from "@/store/cursor";
import ResetScroll from "@/components/resetscroll";
import Link from "next/link";

gsap.registerPlugin(ScrollTrigger);

export default function Home() {
  const mainRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const cursor = useCursorStore();

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    
    // Hero section animations
    const heroTl = gsap.timeline();
    
    heroTl
      .fromTo(".hero-title", 
        { y: 80, opacity: 0 },
        { y: 0, opacity: 1, duration: 1.2, ease: "power3.out", delay: 0.8 }
      )
      .fromTo(".hero-subtitle", 
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.9, ease: "power2.out" }, 
        "-=0.6"
      )
      .fromTo(".hero-mission", 
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: "power2.out" }, 
        "-=0.4"
      )
      .fromTo(".hero-cta", 
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7, ease: "power2.out" }, 
        "-=0.3"
      );

    // Subtle floating animation for hero elements
    gsap.to(".floating-element", {
      y: -10,
      duration: 4,
      ease: "power1.inOut",
      repeat: -1,
      yoyo: true,
      stagger: 1
    });

    // Subtle parallax scrolling effects
    gsap.to(".parallax-bg", {
      y: -50,
      scrollTrigger: {
        trigger: ".hero-section",
        start: "top top",
        end: "bottom top",
        scrub: 1
      }
    });

    // Feature cards animation
    gsap.fromTo(".feature-card", 
      { y: 100, opacity: 0, scale: 0.8 },
      {
        y: 0,
        opacity: 1,
        scale: 1,
        duration: 0.8,
        ease: "power3.out",
        stagger: 0.2,
        scrollTrigger: {
          trigger: ".features-section",
          start: "top 80%",
          end: "bottom 60%",
        }
      }
    );

    // Removed distracting glow effects for premium look

    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, []);

  return (
    <main ref={mainRef} className="min-h-screen bg-black text-white overflow-hidden scroll-smooth">
      <Header />
      <ResetScroll />
      
      {/* Hero Section */}
      <section className="hero-section relative min-h-screen flex items-center">
        {/* Pure Black Background */}
        <div className="parallax-bg absolute inset-0 z-0 bg-black"></div>

        {/* Subtle floating elements */}
        <div className="floating-element absolute top-20 left-10 w-2 h-2 bg-white/20 rounded-full animate-pulse"></div>
        <div className="floating-element absolute top-40 right-20 w-1 h-1 bg-white/30 rounded-full animate-pulse"></div>
        <div className="floating-element absolute bottom-40 left-20 w-3 h-3 bg-white/10 rounded-full"></div>
        <div className="floating-element absolute bottom-20 right-10 w-2 h-2 bg-white/20 rounded-full"></div>

        {/* Hero Content - Strong Left Aligned */}
        <div ref={heroRef} className="relative z-10 pl-4 md:pl-8 lg:pl-16 pr-8 w-full overflow-visible">
          <h1 className="hero-title text-6xl md:text-8xl lg:text-9xl font-black leading-[1.1] mb-12 tracking-tight overflow-visible" style={{ lineHeight: '1.1' }}>
            <span className="block text-white mb-4 pb-4 overflow-visible">
              Revolutionizing
            </span>
            <span className="block bg-gradient-to-r from-white via-gray-200 to-white bg-clip-text text-transparent pb-4 overflow-visible">
              Decentralized Energy
            </span>
          </h1>
          
          <div className="max-w-3xl mb-12">
          </div>

          <div className="hero-cta">
            <Link
              href="/auth"
              onMouseEnter={() => cursor.setScale(0.6)}
              onMouseLeave={() => cursor.reset()}
              className="group relative px-8 py-4 bg-white hover:bg-gray-50 rounded-full text-black font-semibold text-lg transition-all duration-500 ease-out hover:scale-105 hover:shadow-2xl hover:shadow-white/20"
            >
              <span className="relative z-10">Get Started</span>
              <div className="absolute inset-0 bg-gradient-to-r from-white to-gray-100 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            </Link>
          </div>
        </div>

        {/* Centered Scroll indicator */}
        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-gray-400 rounded-full flex justify-center hover:border-white transition-colors duration-300">
            <div className="w-1 h-3 bg-gray-400 rounded-full mt-2 animate-pulse"></div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="relative py-32 px-6 border-t border-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-7xl font-black mb-8 bg-gradient-to-r from-white via-gray-100 to-white bg-clip-text text-transparent tracking-tight leading-[0.9]">
              Transforming Energy
            </h2>
            <p className="text-2xl md:text-3xl text-gray-400 max-w-4xl mx-auto font-light leading-relaxed">
              Real numbers from our global decentralized energy network
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
            <div className="text-center p-8 bg-gradient-to-br from-gray-900/40 to-black/80 rounded-3xl border border-gray-700/50 backdrop-blur-lg">
              <div className="text-4xl lg:text-5xl font-black text-white mb-2">12,470</div>
              <div className="text-gray-400 font-medium">Active Users</div>
              <div className="text-sm text-green-400 mt-1">+25% this month</div>
            </div>
            
            <div className="text-center p-8 bg-gradient-to-br from-gray-900/40 to-black/80 rounded-3xl border border-gray-700/50 backdrop-blur-lg">
              <div className="text-4xl lg:text-5xl font-black text-white mb-2">847</div>
              <div className="text-gray-400 font-medium">Charging Stations</div>
              <div className="text-sm text-blue-400 mt-1">Across 23 cities</div>
            </div>
            
            <div className="text-center p-8 bg-gradient-to-br from-gray-900/40 to-black/80 rounded-3xl border border-gray-700/50 backdrop-blur-lg">
              <div className="text-4xl lg:text-5xl font-black text-white mb-2">2.4M</div>
              <div className="text-gray-400 font-medium">kWh Delivered</div>
              <div className="text-sm text-green-400 mt-1">100% clean energy</div>
            </div>
            
            <div className="text-center p-8 bg-gradient-to-br from-gray-900/40 to-black/80 rounded-3xl border border-gray-700/50 backdrop-blur-lg">
              <div className="text-4xl lg:text-5xl font-black text-white mb-2">1.2M</div>
              <div className="text-gray-400 font-medium">CO₂ Saved</div>
              <div className="text-sm text-green-400 mt-1">kg prevented</div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section id="ourgoal" className="relative py-32 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-5xl md:text-7xl font-black mb-12 bg-gradient-to-r from-white via-gray-100 to-white bg-clip-text text-transparent tracking-tight leading-[0.9]">
            Our Mission
          </h2>
          <div className="grid md:grid-cols-3 gap-12 mb-20">
            <div className="text-center p-8 bg-gradient-to-br from-gray-900/20 to-black/40 rounded-3xl border border-gray-800/50">
              <div className="text-5xl mb-6">🌍</div>
              <h3 className="text-2xl font-bold text-white mb-4">Global Impact</h3>
              <p className="text-gray-400 leading-relaxed font-light">
                Creating a sustainable energy ecosystem that benefits communities worldwide through decentralized solutions and blockchain innovation.
              </p>
            </div>
            <div className="text-center p-8 bg-gradient-to-br from-gray-900/20 to-black/40 rounded-3xl border border-gray-800/50">
              <div className="text-5xl mb-6">💡</div>
              <h3 className="text-2xl font-bold text-white mb-4">Innovation</h3>
              <p className="text-gray-400 leading-relaxed font-light">
                Pioneering breakthrough technologies that revolutionize how we generate, store, and distribute clean energy across smart cities.
              </p>
            </div>
            <div className="text-center p-8 bg-gradient-to-br from-gray-900/20 to-black/40 rounded-3xl border border-gray-800/50">
              <div className="text-5xl mb-6">🚀</div>
              <h3 className="text-2xl font-bold text-white mb-4">Future Ready</h3>
              <p className="text-gray-400 leading-relaxed font-light">
                Building scalable infrastructure that adapts to tomorrow's energy needs and emerging technologies in the Web3 ecosystem.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section className="relative py-32 px-6 border-t border-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-7xl font-black mb-8 bg-gradient-to-r from-white via-gray-100 to-white bg-clip-text text-transparent tracking-tight leading-[0.9]">
              Powered by Blockchain
            </h2>
            <p className="text-2xl md:text-3xl text-gray-400 max-w-4xl mx-auto font-light leading-relaxed">
              Built on Solana for lightning-fast, cost-effective energy transactions
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-16 items-center mb-20">
            <div className="space-y-8">
              <div className="flex items-start gap-6">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-3">Solana Integration</h3>
                  <p className="text-gray-400 text-lg leading-relaxed">
                    Lightning-fast transactions with minimal fees. Process thousands of energy transactions per second with sub-second finality.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-6">
                <div className="w-16 h-16 bg-gradient-to-br from-green-600 to-teal-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-3">Smart Contracts</h3>
                  <p className="text-gray-400 text-lg leading-relaxed">
                    Automated energy distribution and payment processing through battle-tested smart contracts ensuring transparency and trust.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-6">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-600 to-red-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-3">Secure Wallet Integration</h3>
                  <p className="text-gray-400 text-lg leading-relaxed">
                    Seamless integration with popular crypto wallets. Your keys, your energy, your control over every transaction.
                  </p>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="aspect-square bg-gradient-to-br from-gray-900/40 to-black/80 rounded-3xl border border-gray-700/50 backdrop-blur-lg p-8 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl mb-6">⚡</div>
                  <div className="text-3xl font-black text-white mb-4">DECH Protocol</div>
                  <div className="text-gray-400 text-lg">Decentralized Energy Charging Hub</div>
                  <div className="mt-8 grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-gray-800/50 rounded-lg p-3">
                      <div className="text-green-400 font-bold">99.9%</div>
                      <div className="text-gray-400">Uptime</div>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-3">
                      <div className="text-blue-400 font-bold">&lt;1s</div>
                      <div className="text-gray-400">Transaction</div>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-3">
                      <div className="text-purple-400 font-bold">$0.002</div>
                      <div className="text-gray-400">Avg Fee</div>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-3">
                      <div className="text-yellow-400 font-bold">24/7</div>
                      <div className="text-gray-400">Support</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" ref={featuresRef} className="features-section relative py-40 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24">
            <h2 className="text-6xl md:text-8xl font-black mb-8 bg-gradient-to-r from-white via-gray-100 to-white bg-clip-text text-transparent tracking-tight leading-[0.9]">
              Powering Tomorrow
            </h2>
            <p className="text-2xl md:text-3xl text-gray-400 max-w-4xl mx-auto font-light leading-relaxed">
              Experience the next generation of energy management with our revolutionary platform
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {[
              {
                icon: "⚡",
                title: "Instant Charging",
                description: "Lightning-fast charging solutions powered by advanced energy management systems and real-time optimization algorithms",
                stats: "3-5 min average"
              },
              {
                icon: "🔗",
                title: "Blockchain Security",
                description: "Secure, transparent, and decentralized energy transactions on Solana with military-grade encryption",
                stats: "99.99% secure"
              },
              {
                icon: "🌱",
                title: "Eco-Friendly",
                description: "100% renewable energy sources with verified carbon credits and environmental impact tracking",
                stats: "Zero emissions"
              },
              {
                icon: "💰",
                title: "Cost Effective",
                description: "Reduce energy costs by up to 40% with smart pricing algorithms and peer-to-peer energy trading",
                stats: "40% savings"
              },
              {
                icon: "📱",
                title: "Smart Integration",
                description: "Seamlessly integrate with 50+ EV models and IoT ecosystems through our universal API",
                stats: "50+ EV models"
              },
              {
                icon: "🚀",
                title: "Future Ready",
                description: "Built for the future with scalable infrastructure supporting autonomous vehicles and smart cities",
                stats: "Infinite scale"
              }
            ].map((feature, index) => (
              <div
                key={index}
                className="feature-card group relative p-10 rounded-3xl bg-gradient-to-br from-gray-900/40 to-black/80 
                           border border-gray-700/50 hover:border-gray-500/80 
                           backdrop-blur-lg transition-all duration-700 ease-out
                           hover:transform hover:scale-[1.02] hover:shadow-2xl hover:shadow-white/5"
                onMouseEnter={() => cursor.setScale(0.8)}
                onMouseLeave={() => cursor.reset()}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <div className="relative z-10">
                  <div className="text-5xl mb-8 filter group-hover:scale-110 transition-all duration-500 origin-left">
                    {feature.icon}
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-white group-hover:text-gray-100 transition-colors duration-500 leading-tight">
                    {feature.title}
                  </h3>
                  <div className="text-sm font-bold text-green-400 mb-4">{feature.stats}</div>
                  <p className="text-gray-500 group-hover:text-gray-400 transition-colors duration-500 leading-relaxed text-lg font-light">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="relative py-32 px-6 border-t border-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-7xl font-black mb-8 bg-gradient-to-r from-white via-gray-100 to-white bg-clip-text text-transparent tracking-tight leading-[0.9]">
              Trusted by Thousands
            </h2>
            <p className="text-2xl md:text-3xl text-gray-400 max-w-4xl mx-auto font-light leading-relaxed">
              Real experiences from our global community of energy pioneers
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 mb-16">
            <div className="bg-gradient-to-br from-gray-900/40 to-black/80 rounded-3xl border border-gray-700/50 backdrop-blur-lg p-8 hover:border-gray-500/50 transition-all duration-500">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">AS</span>
                </div>
                <div>
                  <div className="font-bold text-white">Arjun Sharma</div>
                  <div className="text-sm text-gray-400">Tesla Model 3 Owner • Bangalore</div>
                </div>
              </div>
              <p className="text-gray-300 leading-relaxed mb-6">
                "DeVolt revolutionized my EV experience. The charging is incredibly fast, and earning DECH tokens while helping the environment feels amazing. The app is intuitive and the network is everywhere I need it."
              </p>
              <div className="flex text-yellow-400">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-gray-900/40 to-black/80 rounded-3xl border border-gray-700/50 backdrop-blur-lg p-8 hover:border-gray-500/50 transition-all duration-500">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-teal-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">PM</span>
                </div>
                <div>
                  <div className="font-bold text-white">Priya Mehta</div>
                  <div className="text-sm text-gray-400">Fleet Manager • Mumbai</div>
                </div>
              </div>
              <p className="text-gray-300 leading-relaxed mb-6">
                "Managing 50+ EVs was a nightmare until DeVolt. Their smart routing finds the best stations, payments are instant, and the analytics help us optimize routes. Cut our charging costs by 35%!"
              </p>
              <div className="flex text-yellow-400">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-gray-900/40 to-black/80 rounded-3xl border border-gray-700/50 backdrop-blur-lg p-8 hover:border-gray-500/50 transition-all duration-500">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-600 to-red-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">RK</span>
                </div>
                <div>
                  <div className="font-bold text-white">Rahul Kumar</div>
                  <div className="text-sm text-gray-400">Tech Entrepreneur • Hyderabad</div>
                </div>
              </div>
              <p className="text-gray-300 leading-relaxed mb-6">
                "As a blockchain enthusiast, DeVolt's Solana integration impressed me. Lightning-fast transactions, minimal fees, and earning rewards while supporting clean energy? It's the future we've been waiting for."
              </p>
              <div className="flex text-yellow-400">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
            </div>
          </div>

          <div className="text-center">
            <div className="text-4xl font-black text-white mb-4">Join 12,470+ Happy Users</div>
            <div className="text-gray-400">Average rating: 4.9/5 ⭐ from 8,200+ reviews</div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="relative py-40 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-7xl md:text-9xl font-black mb-12 bg-gradient-to-r from-white via-gray-100 to-white bg-clip-text text-transparent tracking-tight leading-[0.85]">
            Ready to Charge?
          </h2>
          <p className="text-2xl md:text-3xl text-gray-400 mb-8 leading-relaxed font-light max-w-3xl mx-auto">
            Join thousands of users already experiencing the future of energy
          </p>
          <div className="text-lg text-gray-500 mb-16 max-w-2xl mx-auto">
            🚀 Get started in under 2 minutes • 💰 Earn rewards from day one • 🌱 Make a positive environmental impact
          </div>
          <Link
            href="/auth"
            className="group inline-flex items-center justify-center px-12 py-5 bg-white hover:bg-gray-50 
                       rounded-full text-black font-semibold text-xl transition-all duration-700 ease-out transform 
                       hover:scale-105 hover:shadow-2xl hover:shadow-white/20"
            onMouseEnter={() => cursor.setScale(0.6)}
            onMouseLeave={() => cursor.reset()}
          >
            <span className="mr-3">Start Your Journey</span>
            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </Link>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="relative py-32 px-6 border-t border-gray-800">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-7xl font-black mb-8 bg-gradient-to-r from-white via-gray-100 to-white bg-clip-text text-transparent tracking-tight leading-[0.9]">
              Frequently Asked Questions
            </h2>
            <p className="text-2xl md:text-3xl text-gray-400 max-w-3xl mx-auto font-light leading-relaxed">
              Everything you need to know about DeVolt
            </p>
          </div>

          <div className="space-y-6">
            {[
              {
                question: "What is DeVolt and how does it work?",
                answer: "DeVolt is a decentralized energy platform built on Solana blockchain that connects EV owners with charging stations. Users can find, reserve, and pay for charging sessions while earning DECH tokens through our reward system."
              },
              {
                question: "How do I earn DECH tokens?",
                answer: "You earn DECH tokens by charging your vehicle at our partner stations, referring friends, participating in community governance, and contributing to network growth. Tokens can be used for charging discounts or traded on exchanges."
              },
              {
                question: "Is DeVolt available in my area?",
                answer: "We're rapidly expanding across major cities in India, with over 2,500+ charging stations live. Check our app to see real-time availability in your area and get notified when we launch new locations."
              },
              {
                question: "What wallets does DeVolt support?",
                answer: "DeVolt supports all major Solana wallets including Phantom, Solflare, and Ledger hardware wallets. You can also use our built-in wallet for seamless transactions without needing external apps."
              },
              {
                question: "How fast are the charging speeds?",
                answer: "Our network features ultra-fast DC chargers (150kW+) that can charge most EVs to 80% in under 30 minutes. We also have standard AC chargers for overnight charging at residential locations."
              },
              {
                question: "What are the fees for using DeVolt?",
                answer: "Charging fees vary by location and speed, typically 15-30% lower than traditional networks. Blockchain transactions cost less than $0.002 on Solana. DECH token holders get additional discounts up to 25%."
              }
            ].map((faq, index) => (
              <div 
                key={index} 
                className="group bg-gradient-to-br from-gray-900/20 to-black/40 rounded-2xl border border-gray-800/50 hover:border-gray-600/50 transition-all duration-500 overflow-hidden"
              >
                <details className="w-full faq-details">
                  <summary className="flex items-center justify-between p-8 cursor-pointer list-none transition-all duration-300 hover:bg-white/5">
                    <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors duration-300 pr-4">
                      {faq.question}
                    </h3>
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-800 group-hover:bg-blue-600 flex items-center justify-center transition-all duration-500 faq-icon">
                      <svg className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                  </summary>
                  <div className="faq-content overflow-hidden">
                    <div className="px-8 pb-8 pt-0">
                      <div className="border-t border-gray-700/50 pt-6">
                        <p className="text-gray-400 text-lg leading-relaxed">
                          {faq.answer}
                        </p>
                      </div>
                    </div>
                  </div>
                </details>
              </div>
            ))}
          </div>

          {/* Additional Help Section */}
          <div className="mt-16 text-center">
            <div className="bg-gradient-to-br from-gray-900/40 to-black/80 rounded-3xl border border-gray-700/50 p-12 backdrop-blur-lg">
              <div className="text-5xl mb-6">💬</div>
              <h3 className="text-3xl font-bold text-white mb-4">Still have questions?</h3>
              <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
                Our support team is available 24/7 to help you get started with DeVolt
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/support"
                  className="group inline-flex items-center justify-center px-8 py-3 bg-blue-600 hover:bg-blue-500 rounded-full text-white font-semibold transition-all duration-300 transform hover:scale-105"
                  onMouseEnter={() => cursor.setScale(0.8)}
                  onMouseLeave={() => cursor.reset()}
                >
                  <span className="mr-2">Contact Support</span>
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </Link>
                <Link
                  href="/docs"
                  className="group inline-flex items-center justify-center px-8 py-3 border border-gray-600 hover:border-gray-500 rounded-full text-gray-300 hover:text-white font-semibold transition-all duration-300 transform hover:scale-105"
                  onMouseEnter={() => cursor.setScale(0.8)}
                  onMouseLeave={() => cursor.reset()}
                >
                  <span className="mr-2">View Documentation</span>
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
