"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef, useState, useEffect } from "react";
import { useCursorStore } from "@/store/cursor";
import Link from "next/link";
import BrandIcon from '@/components/icons/brand';

gsap.registerPlugin(ScrollTrigger);

const Footer = () => {
  const footerRef = useRef<HTMLElement>(null);
  const devoltTextRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const cursor = useCursorStore();

  useEffect(() => {
    // Simple hover effect only
    const hoverTl = gsap.timeline({ paused: true });
    
    if (isHovered) {
      gsap.to(devoltTextRef.current, {
        textShadow: "0 0 30px #ffffff, 0 0 60px #ffffff",
        scale: 1.02,
        duration: 0.3,
        ease: "power2.out"
      });
    } else {
      gsap.to(devoltTextRef.current, {
        textShadow: "none",
        scale: 1,
        duration: 0.3,
        ease: "power2.out"
      });
    }

    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
      hoverTl.kill();
    };
  }, [isHovered]);

  return (
    <footer 
      ref={footerRef}
      className="relative bg-black py-10 md:py-20 px-4 md:px-6 overflow-hidden border-t border-gray-800"
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-gray-900/20 to-transparent"></div>
      {/* Main content */}
      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Navigation Links */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mb-10 md:mb-16">
          <div>
            <h3 className="text-blue-400 font-bold text-lg mb-4">Platform</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/real-web" className="text-gray-400 hover:text-white transition-colors duration-200">
                  Real-Web
                </Link>
              </li>
              <li>
                <Link href="/goal" className="text-gray-400 hover:text-white transition-colors duration-200">
                  Goal
                </Link>
              </li>
              <li>
                <Link href="/features" className="text-gray-400 hover:text-white transition-colors duration-200">
                  Features
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-blue-400 font-bold text-lg mb-4">Company</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="text-gray-400 hover:text-white transition-colors duration-200">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/careers" className="text-gray-400 hover:text-white transition-colors duration-200">
                  Careers
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-400 hover:text-white transition-colors duration-200">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-blue-400 font-bold text-lg mb-4">Resources</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/docs" className="text-gray-400 hover:text-white transition-colors duration-200">
                  Documentation
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-gray-400 hover:text-white transition-colors duration-200">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/support" className="text-gray-400 hover:text-white transition-colors duration-200">
                  Support
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-blue-400 font-bold text-lg mb-4">Learn</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/ourgoal" className="text-gray-400 hover:text-white transition-colors duration-200">
                  Our Goal
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className="text-gray-400 hover:text-white transition-colors duration-200">
                  How it works
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="text-gray-400 hover:text-white transition-colors duration-200">
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Main DeVolt text with glow effect */}
        <div className="text-center mb-8 md:mb-12 relative">
          <div 
            ref={devoltTextRef}
            className="relative inline-block cursor-pointer"
            onMouseEnter={() => {
              setIsHovered(true);
              cursor.setScale(0.8);
            }}
            onMouseLeave={() => {
              setIsHovered(false);
              cursor.reset();
            }}
          >
            <div className="flex items-center justify-center space-x-4">
              <BrandIcon className="w-14 h-14" />
              <h2 className="text-5xl sm:text-6xl md:text-9xl lg:text-[12rem] leading-[0.86] font-black text-gray-500 select-none transition-all duration-300 hover:text-white">
                DeVolt
              </h2>
            </div>
          </div>
        </div>

  {/* Separator line */}
  <div className="w-full h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent mb-6 md:mb-8"></div>

        {/* Bottom section */}
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <p className="text-gray-500 text-xs sm:text-sm text-center md:text-left">
            © 2025 DeVolt. All rights reserved.
          </p>
          <div className="flex space-x-4 md:space-x-6 justify-center md:justify-end">
            <a 
              href="https://twitter.com/decharge" 
              className="text-gray-500 hover:text-blue-400 transition-colors duration-200 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Twitter"
            >
              <svg className="w-7 h-7 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
              </svg>
            </a>
            
            <a 
              href="https://github.com/decharge" 
              className="text-gray-500 hover:text-blue-400 transition-colors duration-200 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
            >
              <svg className="w-7 h-7 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
            </a>
            
            <a 
              href="https://discord.gg/decharge" 
              className="text-gray-500 hover:text-blue-400 transition-colors duration-200 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Discord"
            >
              <svg className="w-7 h-7 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
            </a>
          </div>
        </div>
      </div>

      {/* Background particles effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-600 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse"></div>
      </div>
    </footer>
  );
};

export default Footer;
