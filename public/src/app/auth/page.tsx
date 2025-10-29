"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCursorStore } from "@/store/cursor";
import gsap from "gsap";
import { useRef } from "react";

export default function AuthPage() {
  const { login, logout, ready, authenticated, user } = usePrivy();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const cursor = useCursorStore();
  const contentRef = useRef<HTMLDivElement>(null);
  const walletCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ready && authenticated) {
      router.push("/dashboard");
    }
  }, [ready, authenticated, router]);

  useEffect(() => {
    // Entrance animations
    const tl = gsap.timeline();
    
    tl.fromTo(contentRef.current, 
      { opacity: 0, y: 50 },
      { opacity: 1, y: 0, duration: 1.2, ease: "power3.out", delay: 0.3 }
    )
    .fromTo(walletCardRef.current, 
      { opacity: 0, y: 30, scale: 0.95 },
      { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: "power2.out" }, 
      "-=0.6"
    );

    // Floating animation for decorative elements
    gsap.to(".floating-orb", {
      y: -20,
      duration: 4,
      ease: "power1.inOut",
      repeat: -1,
      yoyo: true,
      stagger: 1.5
    });
  }, []);

  const handleAuth = async () => {
    setIsLoading(true);
    try {
      await login();
    } catch (error) {
      console.error("Authentication error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!ready) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="relative mb-8">
            <div className="w-20 h-20 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-b-white/40 rounded-full animate-spin mx-auto" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          <p className="text-2xl font-light text-white/80 mb-2">Initializing DeVolt</p>
          <p className="text-gray-400">Connecting to the decentralized future...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-950 to-black text-white relative overflow-hidden">
      {/* Enhanced Background with Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-950 to-black"></div>
      
      {/* Premium Floating Elements */}
      <div className="floating-orb absolute top-20 right-20 w-32 h-32 bg-gradient-to-br from-white/5 to-white/10 rounded-full blur-xl"></div>
      <div className="floating-orb absolute top-1/3 right-1/4 w-24 h-24 bg-gradient-to-br from-gray-400/5 to-gray-300/10 rounded-full blur-2xl"></div>
      <div className="floating-orb absolute bottom-20 left-20 w-40 h-40 bg-gradient-to-br from-white/3 to-white/8 rounded-full blur-2xl"></div>
      <div className="floating-orb absolute bottom-1/3 left-1/3 w-16 h-16 bg-white/10 rounded-full blur-lg"></div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
        backgroundSize: '50px 50px'
      }}></div>

      <div className="relative z-10 min-h-screen flex flex-col lg:flex-row lg:gap-8">
        {/* Left Side - Hero Content */}
        <div className="flex-1 flex items-center px-4 md:px-8 lg:px-8 xl:px-12 py-8 lg:py-16">
          <div ref={contentRef} className="max-w-3xl w-full mx-auto lg:mx-0 lg:mr-8">
            {/* Logo Section */}
            <div className="mb-16">
              <div className="flex items-center mb-12">
                <div className="relative w-16 h-16 mr-6">
                  <Image
                    src="https://decharge.network/favicon.png"
                    alt="DeVolt"
                    fill
                    className="object-contain"
                  />
                </div>
                <span className="text-3xl font-black text-white tracking-tight">DeVolt</span>
              </div>
              
              <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-black mb-8 lg:mb-12 leading-[0.9] tracking-tight overflow-visible">
                <span className="block text-white mb-2 lg:mb-3">Enter the</span>
                <span className="bg-gradient-to-r from-white via-gray-200 to-white bg-clip-text text-transparent md:whitespace-nowrap inline-block overflow-visible">
                  {'Energy\u00A0Future'}
                </span>
              </h1>
              
              <div className="max-w-2xl space-y-4 lg:space-y-6">
                <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-gray-300 leading-[1.4] font-light">
                  Connect your wallet to unlock the power of decentralized energy networks.
                </p>
                <p className="text-base sm:text-lg lg:text-xl text-gray-500 leading-relaxed font-light">
                  Experience seamless transactions, peer-to-peer energy trading, and 
                  revolutionary blockchain technology that's reshaping how we power the world.
                </p>
                
                {/* Feature Highlights */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-white font-semibold mb-1">Secure & Verified</h3>
                      <p className="text-gray-500 text-sm">Bank-level security</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-white font-semibold mb-1">Join 50K+ Users</h3>
                      <p className="text-gray-500 text-sm">Growing community</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Premium Wallet Connection */}
        <div className="w-full lg:w-auto lg:min-w-[420px] lg:max-w-[460px] flex items-center justify-start px-6 sm:px-8 lg:pl-8 lg:pr-12 py-8 sm:py-12 lg:py-16">
  <div ref={walletCardRef} className="w-full max-w-md lg:max-w-md ml-0 lg:-ml-24">
            {!authenticated ? (
              <div className="relative lg:-ml-4">
                {/* Premium Wallet Card */}
                <div className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl">
                  {/* Glow Effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-2xl sm:rounded-3xl opacity-50"></div>
                  
                  <div className="relative z-10 space-y-6 sm:space-y-8">
                    {/* Header */}
                    <div className="text-center">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 bg-gradient-to-br from-white/20 to-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
                        <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M21 18v1a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v13z" />
                          <path d="M21 18H3" />
                        </svg>
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-black text-white mb-2 sm:mb-3 tracking-tight">
                        Connect Wallet
                      </h2>
                      <p className="text-gray-400 text-sm sm:text-base leading-relaxed">
                        Connect securely to get started with DeVolt
                      </p>
                    </div>

                    {/* Connect Button */}
                    <button
                      onClick={handleAuth}
                      disabled={isLoading}
                      onMouseEnter={() => {
                        cursor.setScale(0.8);
                        setIsHovered(true);
                      }}
                      onMouseLeave={() => {
                        cursor.reset();
                        setIsHovered(false);
                      }}
                      className="group relative w-full bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold py-4 sm:py-5 px-6 sm:px-8 rounded-xl sm:rounded-2xl transition-all duration-500 ease-out hover:scale-[1.02] hover:shadow-2xl hover:shadow-white/20 text-sm sm:text-base"
                    >
                      <div className="flex items-center justify-center gap-3 sm:gap-4">
                        {isLoading ? (
                          <>
                            <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 sm:border-3 border-black/20 border-t-black rounded-full animate-spin"></div>
                            <span className="text-base sm:text-lg">Connecting...</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5 sm:w-6 sm:h-6 group-hover:scale-110 transition-transform duration-300" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M21 18v1a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v13z" />
                              <path d="M7 14l3-3 3 3" />
                            </svg>
                            <span className="text-base sm:text-lg">Connect Wallet</span>
                            <svg className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform duration-300" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </>
                        )}
                      </div>
                      
                      {/* Gradient Overlay */}
                      <div className={`absolute inset-0 bg-gradient-to-r from-gray-50 to-white rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${isHovered ? 'opacity-100' : ''}`}></div>
                    </button>

                    {/* Powered by Privy */}
                    <div className="space-y-3">
                      <p className="text-center text-xs sm:text-sm text-gray-500 font-medium">Powered by Privy</p>
                      <div className="flex items-center justify-center">
                        <div className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white/5 rounded-full">
                          <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                            <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <span className="text-xs text-gray-400 font-medium">Secure Authentication</span>
                        </div>
                      </div>
                    </div>

                    {/* Terms */}
                    <div className="text-center text-xs sm:text-sm text-gray-500 leading-relaxed px-2">
                      By connecting, learn more on our{" "}
                      <Link href="/how-it-works" className="text-gray-300 hover:text-white underline transition-colors duration-200">
                        How it works
                      </Link>{" "}
                      page or read about our{" "}
                      <Link href="/ourgoal" className="text-gray-300 hover:text-white underline transition-colors duration-200">
                        goals
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative bg-gradient-to-br from-green-500/10 to-green-400/5 backdrop-blur-xl border border-green-400/30 rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl lg:-ml-4">
                <div className="relative z-10 space-y-5 sm:space-y-6">
                  {/* Success Header */}
                  <div className="text-center">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 bg-green-400/20 rounded-full flex items-center justify-center">
                      <svg className="w-7 h-7 sm:w-8 sm:h-8 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold mb-2 text-white">Successfully Connected!</h2>
                    <p className="text-gray-400 text-xs sm:text-sm px-2">
                      {user?.wallet?.address ? 
                        `${user.wallet.address.slice(0, 8)}...${user.wallet.address.slice(-6)}` : 
                        user?.email?.address || "Welcome back!"}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3 sm:space-y-4">
                    <Link
                      href="/dashboard"
                      className="group w-full bg-white hover:bg-gray-50 text-black font-bold py-3.5 sm:py-4 px-5 sm:px-6 rounded-xl sm:rounded-2xl transition-all duration-300 hover:scale-[1.02] flex items-center justify-center gap-2.5 sm:gap-3 hover:shadow-xl text-sm sm:text-base"
                    >
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                      </svg>
                      Enter Dashboard
                      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform duration-300" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </Link>
                    
                    <button
                      onClick={handleLogout}
                      disabled={isLoading}
                      className="w-full text-gray-400 hover:text-white transition-colors duration-300 py-2 font-medium text-sm sm:text-base"
                    >
                      {isLoading ? "Disconnecting..." : "Disconnect Wallet"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Back to Home */}
            <div className="mt-6 sm:mt-8 text-center">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-gray-500 hover:text-white transition-colors duration-300 font-medium text-sm sm:text-base"
                onMouseEnter={() => cursor.setScale(0.8)}
                onMouseLeave={() => cursor.reset()}
              >
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}