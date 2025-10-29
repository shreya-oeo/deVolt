"use client";

import { cn } from "@/ui/cn";
import { DetailedHTMLProps, HTMLAttributes, useRef, useState, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { usePathname } from "next/navigation";
import { useCursorStore } from "@/store/cursor";
import Link from "next/link";
import Image from "next/image";

gsap.registerPlugin(ScrollTrigger);

const Header = ({ dark = false, setContacting, ...props }: { dark?: boolean, setContacting?: Function } & DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>) => {
  const headerRef = useRef<HTMLElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const navItemsRef = useRef<HTMLDivElement>(null);
  const path = usePathname();
  const { setScale, reset } = useCursorStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Smooth entry animation
    const tl = gsap.timeline();
    
    tl.fromTo(headerRef.current, 
      { y: -20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, ease: "power2.out", delay: 0.1 }
    ).fromTo(logoRef.current,
      { x: -10, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.5, ease: "power2.out" },
      0.2
    ).fromTo(navItemsRef.current,
      { x: 10, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.5, ease: "power2.out" },
      0.3
    );

    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, []);

  return (
    <>
      {/* Premium Glassmorphic Navbar */}
      <header 
        ref={headerRef} 
        className={cn(
          "fixed top-6 left-1/2 transform -translate-x-1/2 z-50",
          "bg-black/20 backdrop-blur-2xl rounded-full",
          "border border-white/10 shadow-2xl shadow-black/20",
          "px-8 py-4 h-16 transition-all duration-300",
          props.className
        )}
        style={{
          backdropFilter: 'blur(32px) saturate(180%)',
          WebkitBackdropFilter: 'blur(32px) saturate(180%)',
        }}
        {...props}
      >
        <div className="flex items-center justify-center space-x-8 h-full">
          
          {/* Logo Section */}
          <div ref={logoRef} className="flex items-center">
            <Link href="/" className="flex items-center group">
              <div className="relative w-8 h-8 group-hover:scale-105 transition-all duration-300">
                <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-600/20 backdrop-blur-sm border border-blue-400/30" />
                <Image
                  src="https://decharge.network/favicon.png"
                  alt="DeVolt"
                  fill
                  className="object-contain relative z-10 rounded-lg p-1.5"
                />
              </div>
              <span className="ml-3 text-xl font-bold text-white">
                DeVolt
              </span>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav ref={navItemsRef} className="hidden md:flex items-center space-x-8">
            <Link 
              href="/" 
              className="relative group text-white hover:text-white transition-all duration-300 text-sm font-medium"
              onMouseEnter={() => setScale(0.8)}
              onMouseLeave={reset}
            >
              <span className="relative z-10">Home</span>
              <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-400 to-blue-600 group-hover:w-full transition-all duration-300" />
            </Link>
            
            <Link 
              href="#ourgoal" 
              className="relative group text-white hover:text-white transition-all duration-300 text-sm font-medium"
              onMouseEnter={() => setScale(0.8)}
              onMouseLeave={reset}
            >
              <span className="relative z-10">Our Goal</span>
              <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-400 to-blue-600 group-hover:w-full transition-all duration-300" />
            </Link>

            <Link 
              href="#howitworks" 
              className="relative group text-white hover:text-white transition-all duration-300 text-sm font-medium"
              onMouseEnter={() => setScale(0.8)}
              onMouseLeave={reset}
            >
              <span className="relative z-10">How it works</span>
              <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-400 to-blue-600 group-hover:w-full transition-all duration-300" />
            </Link>

            {/* Transactions link removed - transactions are now in dashboard logs */}
          </nav>

          {/* Language Selector */}
          <div className="hidden md:flex items-center">
            <button className="flex items-center space-x-1 text-white hover:text-white transition-colors duration-200 text-sm">
              <span>EN</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {/* Log in Button */}
          <Link
            href="/auth"
            onMouseEnter={() => setScale(0.8)}
            onMouseLeave={reset}
            className="hidden md:block text-white hover:text-white transition-all duration-300 text-sm font-medium"
          >
            Log in
          </Link>

          {/* Get Started Button */}
          <Link
            href="/auth"
            onMouseEnter={() => setScale(0.8)}
            onMouseLeave={reset}
            className="group relative overflow-hidden rounded-full transition-all duration-300"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-600" />
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-500 opacity-0 group-hover:opacity-100 transition-all duration-300" />
            <div className="relative text-white font-semibold group-hover:scale-105 transition-all duration-300 px-6 py-2.5 text-sm">
              Get started
            </div>
          </Link>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-white/60 hover:text-white transition-all duration-300 rounded-lg hover:bg-white/10"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </header>

      {/* Premium Mobile Menu */}
      <div className={cn(
        "fixed inset-0 z-40 md:hidden transition-all duration-500 ease-out",
        isMobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      )}>
        {/* Backdrop */}
        <div 
          className={cn(
            "fixed inset-0 bg-black/80 backdrop-blur-xl transition-all duration-500",
            isMobileMenuOpen ? "opacity-100" : "opacity-0"
          )} 
          onClick={() => setIsMobileMenuOpen(false)} 
        />
        
        {/* Mobile Menu Container */}
        <div className={cn(
          "fixed top-20 right-4 left-4 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]",
          isMobileMenuOpen 
            ? "translate-y-0 opacity-100 scale-100" 
            : "-translate-y-8 opacity-0 scale-95"
        )}>
          <div 
            className="bg-black/90 backdrop-blur-2xl rounded-2xl border border-white/20 p-6 shadow-2xl shadow-black/50"
            style={{
              backdropFilter: 'blur(32px) saturate(180%)',
              WebkitBackdropFilter: 'blur(32px) saturate(180%)',
            }}
          >
            <nav className="flex flex-col space-y-2">
              <Link 
                href="/"
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-white hover:text-white transition-all duration-300 text-lg font-medium py-4 px-4 rounded-xl hover:bg-white/10"
              >
                Home
              </Link>
              
              <Link 
                href="#ourgoal"
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-white hover:text-white transition-all duration-300 text-lg font-medium py-4 px-4 rounded-xl hover:bg-white/10"
              >
                Our Goal
              </Link>

              <Link 
                href="#howitworks"
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-white hover:text-white transition-all duration-300 text-lg font-medium py-4 px-4 rounded-xl hover:bg-white/10"
              >
                How it works
              </Link>

              {/* Transactions link removed from mobile menu - transactions available in dashboard logs */}
              
              <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent my-4" />
              
              <Link
                href="/auth"
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-white hover:text-white transition-all duration-300 text-lg font-medium py-4 px-4 rounded-xl hover:bg-white/10"
              >
                Log in
              </Link>
              
              <Link
                href="/auth"
                onClick={() => setIsMobileMenuOpen(false)}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white font-semibold text-center py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105"
              >
                Get started
              </Link>
            </nav>
          </div>
        </div>
      </div>
    </>
  );
};

export default Header;
