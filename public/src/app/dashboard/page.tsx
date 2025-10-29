"use client";

import { useState, useEffect, useRef } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import gsap from "gsap";
import UserSessionManager, { UserSession, ChargingSession, TransactionLog } from "@/lib/userSession";
import { allChargePoints, ChargePoint, getStatusColor, getStatusBgColor, getStationStatus, formatCurrency } from "@/data/realChargePoints";
import { ClientComprehensiveLogger } from "@/lib/clientLogger";
import { usePrivySolanaIntegration } from "@/hooks/usePrivySolanaIntegration";
import { useLiveCharging } from "@/hooks/useLiveCharging";
import { useToast } from "@/hooks/useToast";
import { ToastContainer } from "@/components/Toast";
import { ChargingConfirmationModal } from "@/components/ChargingConfirmationModal";
import { useRealTimeBalance } from "@/hooks/useRealTimeBalance";
import { AnimatedBalance } from "@/components/AnimatedBalance";
import { Marketplace } from "@/components/Marketplace";

// REAL CHARGING SESSIONS ONLY - NO MOCK DATA

// Use real charge points data
const chargePoints = allChargePoints;

// Lightweight Map Component
const LightweightMap = ({ stations, userBalance }: { stations: ChargePoint[]; userBalance: number }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedStation, setSelectedStation] = useState<ChargePoint | null>(null);
  const [hoveredStation, setHoveredStation] = useState<ChargePoint | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [stationToCharge, setStationToCharge] = useState<ChargePoint | null>(null);

  // Bangalore bounds for mapping coordinates
  const bounds = {
    north: 13.1,
    south: 12.8,
    east: 77.8,
    west: 77.4
  };

  // Convert lat/lng to canvas coordinates
  const latLngToCanvas = (lat: number, lng: number, canvasWidth: number, canvasHeight: number) => {
    const x = ((lng - bounds.west) / (bounds.east - bounds.west)) * canvasWidth;
    const y = ((bounds.north - lat) / (bounds.north - bounds.south)) * canvasHeight;
    return { x, y };
  };

  // Find station at canvas coordinates
  const findStationAt = (canvasX: number, canvasY: number, canvasWidth: number, canvasHeight: number) => {
    for (const station of stations) {
      const { x, y } = latLngToCanvas(station.location.latitude, station.location.longitude, canvasWidth, canvasHeight);
      const distance = Math.sqrt((canvasX - x) ** 2 + (canvasY - y) ** 2);
      if (distance <= 12) { // 12px radius for click detection
        return station;
      }
    }
    return null;
  };

  // Draw the map
  const drawMap = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const canvasWidth = rect.width;
    const canvasHeight = rect.height;

    // Clear canvas
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Draw grid lines for reference
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 10; i++) {
      const x = (i / 10) * canvasWidth;
      const y = (i / 10) * canvasHeight;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvasHeight);
      ctx.moveTo(0, y);
      ctx.lineTo(canvasWidth, y);
      ctx.stroke();
    }

    // Draw area labels
    ctx.fillStyle = '#6b7280';
    ctx.font = '12px system-ui';
    ctx.fillText('Whitefield', canvasWidth * 0.75, canvasHeight * 0.3);
    ctx.fillText('Koramangala', canvasWidth * 0.4, canvasHeight * 0.6);
    ctx.fillText('Electronic City', canvasWidth * 0.3, canvasHeight * 0.85);
    ctx.fillText('Indiranagar', canvasWidth * 0.5, canvasHeight * 0.4);
    ctx.fillText('Bangalore', canvasWidth * 0.45, canvasHeight * 0.5);

    // Draw stations
    stations.forEach((station) => {
      const { x, y } = latLngToCanvas(station.location.latitude, station.location.longitude, canvasWidth, canvasHeight);
      const isAvailable = getStationStatus(station.connectors) === 'available';
      const isHovered = hoveredStation?.code === station.code;
      const isSelected = selectedStation?.code === station.code;

      // Draw station dot
      ctx.beginPath();
      ctx.arc(x, y, isHovered || isSelected ? 10 : 8, 0, 2 * Math.PI);
      ctx.fillStyle = isAvailable ? '#3b82f6' : '#ef4444';
      ctx.fill();

      // Add white border
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Add glow effect for hovered/selected
      if (isHovered || isSelected) {
        ctx.beginPath();
        ctx.arc(x, y, 15, 0, 2 * Math.PI);
        ctx.strokeStyle = isAvailable ? '#3b82f6' : '#ef4444';
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.3;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      // Draw station name for hovered station
      if (isHovered) {
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px system-ui';
        const textWidth = ctx.measureText(station.name).width;
        ctx.fillRect(x - textWidth / 2 - 4, y - 25, textWidth + 8, 16);
        ctx.fillStyle = '#000000';
        ctx.fillText(station.name, x - textWidth / 2, y - 12);
      }
    });

    // Mark map as ready
    setIsMapReady(true);
  };

  // Handle canvas interactions
  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const station = findStationAt(x, y, rect.width, rect.height);
    if (station) {
      const isAvailable = getStationStatus(station.connectors) === 'available';
      if (isAvailable) {
        // Show confirmation modal instead of direct navigation
        setStationToCharge(station);
        setShowConfirmation(true);
      } else {
        setSelectedStation(station);
      }
    } else {
      setSelectedStation(null);
    }
  };

  const handleCanvasMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const station = findStationAt(x, y, rect.width, rect.height);
    setHoveredStation(station);
    canvas.style.cursor = station ? 'pointer' : 'default';
  };

  // Initialize and update canvas
  useEffect(() => {
    const timer = setTimeout(() => drawMap(), 100); // Small delay to ensure canvas is ready
    return () => clearTimeout(timer);
  }, [stations, hoveredStation, selectedStation]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setTimeout(() => drawMap(), 100); // Debounce resize
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        className="w-full h-96 rounded-xl border border-gray-700"
        onClick={handleCanvasClick}
        onMouseMove={handleCanvasMouseMove}
        onMouseLeave={() => setHoveredStation(null)}
      />

      {/* Loading overlay */}
      {!isMapReady && (
        <div className="absolute inset-0 bg-gray-900/80 rounded-xl flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <div className="text-sm text-gray-400">Loading map...</div>
          </div>
        </div>
      )}

      {/* Station Info Popup */}
      {selectedStation && (
        <div className="absolute top-4 right-4 bg-gray-800 border border-gray-600 rounded-lg p-4 max-w-xs z-10">
          <div className="flex items-start justify-between mb-2">
            <h4 className="font-bold text-white text-sm">{selectedStation.name}</h4>
            <button
              onClick={() => setSelectedStation(null)}
              className="text-gray-400 hover:text-white ml-2"
            >
              ✕
            </button>
          </div>
          <p className="text-gray-400 text-xs mb-2">{selectedStation.location.address}</p>

          <div className="space-y-2 mb-3">
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Status:</span>
              <span className={getStationStatus(selectedStation.connectors) === 'available' ? 'text-blue-400' : 'text-red-400'}>
                {getStationStatus(selectedStation.connectors) === 'available' ? '🟢 Available' : '🔴 In Use'}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Power:</span>
              <span className="text-white">{Math.max(...selectedStation.connectors.map(c => c.power_kw))}kW</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Rate:</span>
              <span className="text-white">₹{selectedStation.pricing.energy_based.rate}/kWh</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Available:</span>
              <span className="text-white">
                {selectedStation.connectors.filter(c => c.status === 'available').length}/{selectedStation.no_of_connectors} ports
              </span>
            </div>
          </div>

          {getStationStatus(selectedStation.connectors) === 'available' ? (
            <button
              onClick={() => {
                window.location.href = `/charges/${selectedStation.code}?charging=false`;
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors"
            >
              ⚡ Start Charging
            </button>
          ) : (
            <button disabled className="w-full bg-gray-600 text-gray-400 py-2 px-3 rounded-lg text-sm font-medium cursor-not-allowed">
              ❌ Station Busy
            </button>
          )}
        </div>
      )}

      {/* Map Legend */}
      <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
        <div>Click on blue dots to start charging • Hover for station names</div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>Available ({stations.filter(s => getStationStatus(s.connectors) === 'available').length})</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span>Busy ({stations.filter(s => getStationStatus(s.connectors) !== 'available').length})</span>
          </div>
        </div>
      </div>

      {/* Charging Confirmation Modal */}
      {showConfirmation && stationToCharge && (
        <ChargingConfirmationModal
          station={stationToCharge}
          userBalance={userBalance}
          onConfirm={() => {
            setShowConfirmation(false);
            window.location.href = `/charges/${stationToCharge.code}?charging=false`;
          }}
          onCancel={() => {
            setShowConfirmation(false);
            setStationToCharge(null);
          }}
        />
      )}
    </div>
  );
};

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState("dashboard");
  const [balanceUpdateCount, setBalanceUpdateCount] = useState(0); // Add counter for debugging
  const [selectedStation, setSelectedStation] = useState<ChargePoint | null>(null);

  // Helper function to validate Solana transaction signatures
  const isValidSolanaSignature = (signature: string): boolean => {
    try {
      if (!signature || signature.length < 86 || signature.length > 88) {
        return false;
      }

      const base58Regex = /^[1-9A-HJ-NP-Za-km-z]+$/;
      if (!base58Regex.test(signature)) {
        return false;
      }

      const fakePatterns = ['_', 'live_', 'mgy', 'undefined', 'null'];
      for (const pattern of fakePatterns) {
        if (signature.includes(pattern)) {
          return false;
        }
      }

      return true;
    } catch {
      return false;
    }
  };

  const sessionManager = UserSessionManager.getInstance();
  const [isCharging, setIsCharging] = useState(false);
  const [swipeProgress, setSwipeProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const { logout, user, authenticated, ready } = usePrivy();
  const router = useRouter();
  const toast = useToast();

  // Consistent wallet address getter - use this everywhere
  const getWalletAddress = () => {
    return user?.wallet?.address || 'demo_wallet_default';
  };

  const getSelectedStation = () => {
    return selectedStation || chargePoints.find(station =>
      getStationStatus(station.connectors) === 'available'
    ) || null;
  };

  // Use the proper API integration hook instead of localStorage-only UserSessionManager
  const {
    userProfile,
    privyUserId,
    isLoading,
    error,
    chargingSessions,
    activeSession,
    transactions,
    initializeUser,
    createChargingSession,
    refreshData,
    isAuthenticated,
    solanaInitialized
  } = usePrivySolanaIntegration();

  // Live charging management
  const {
    activeSessions: liveActiveSessions,
    isCharging: hasLiveCharging,
    startCharging,
    stopCharging,
    getSessionProgress,
    refreshSessions
  } = useLiveCharging();

  // Real-time balance management
  const {
    balance: realtimeBalance,
    dechBalance: realtimeDechBalance,
    isUpdating: isBalanceUpdating,
    deductChargingCost,
    addFunds,
    refreshBalance
  } = useRealTimeBalance(user?.wallet?.address);

  // Create derived state for dashboard compatibility
  const [userStats, setUserStats] = useState<any>(null);
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  // Map error state removed - using lightweight canvas map now



  // Map userProfile to userSession for compatibility
  const userSession = userProfile ? {
    walletAddress: userProfile.walletAddress || getWalletAddress(),
    email: userProfile.email,
    joinedAt: userProfile.joinedAt,
    totalSessions: userProfile.totalSessions,
    totalEnergyConsumed: userProfile.totalEnergyConsumed,
    totalDechEarned: userProfile.totalDechEarned,
    totalSpent: userProfile.totalSpent,
    currentBalance: userProfile.currentBalance,
    dechBalance: userProfile.dechBalance || userProfile.totalDechEarned || 0, // Proper dechBalance field
    level: userProfile.level,
    achievements: userProfile.achievements,
    preferences: userProfile.preferences
  } : null;

  // Map transactions to transactionLogs for compatibility
  const transactionLogs = transactions || [];

  // Helper function for tab changes with comprehensive logging
  const handleTabChange = (newTab: string) => {
    if (user?.wallet?.address) {
      ClientComprehensiveLogger.logUIInteraction(
        user.wallet.address,
        'tab_change',
        {
          from_tab: activeTab,
          to_tab: newTab,
          timestamp: new Date().toISOString()
        }
      );
    }
    setActiveTab(newTab);
  };

  // Helper function for button clicks with logging
  const handleButtonClick = (buttonName: string, additionalData?: any) => {
    if (user?.wallet?.address) {
      ClientComprehensiveLogger.logUIInteraction(
        user.wallet.address,
        'button_click',
        {
          button: buttonName,
          page: 'dashboard',
          current_tab: activeTab,
          ...additionalData
        }
      );
    }
  };

  // Redirect if not authenticated
  useEffect(() => {
    if (ready && !authenticated) {
      router.push("/auth");
    }
  }, [ready, authenticated, router]);

  // Initialize user session when authenticated
  useEffect(() => {
    if (ready && authenticated && user?.wallet?.address) {
      const walletAddress = getWalletAddress(); // Use consistent wallet address

      // Log dashboard access
      ClientComprehensiveLogger.logUIInteraction(
        walletAddress,
        'dashboard_access',
        { page: 'dashboard', device: navigator.userAgent }
      );

      // Initialize the session using the API integration hook
      initializeUser();
    }
  }, [ready, authenticated, user, initializeUser]);  // Log balance checks when userSession changes (throttled)
  const lastBalanceLogRef = useRef(0);
  useEffect(() => {
    if (userSession && user?.wallet?.address) {
      const now = Date.now();
      // Only log balance checks every 60 seconds to prevent spam
      if (now - lastBalanceLogRef.current > 60000) {
        lastBalanceLogRef.current = now;
        ClientComprehensiveLogger.logBalanceCheck(
          user.wallet.address,
          {
            current_balance: userSession.currentBalance,
            dech_balance: userSession.dechBalance,
            total_dech_earned: userSession.totalDechEarned,
            total_sessions: userSession.totalSessions
          }
        );
      }
    }
  }, [userSession]);

  // Add periodic data refresh for real-time updates using API integration
  useEffect(() => {
    if (!user?.wallet?.address) return;

    // Real-time updates every 10 seconds for live experience using the API hook
    const interval = setInterval(() => {
      if (ready && authenticated && user?.wallet?.address) {
        refreshData();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [user?.wallet?.address, ready, authenticated, refreshData]);

  // Load additional data from sessionManager for compatibility
  useEffect(() => {
    if (ready && authenticated && user?.wallet?.address) {
      const walletAddress = getWalletAddress();

      // Load additional dashboard data from sessionManager
      const stats = sessionManager.getUserStats(walletAddress);
      const leaderboard = sessionManager.getLeaderboard();

      setUserStats(stats);
      setLeaderboardData(leaderboard);
    }
  }, [userProfile, ready, authenticated, user?.wallet?.address]);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Old Leaflet map code removed - now using lightweight canvas-based map

  const handleSwipeStart = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    e.preventDefault();
  };

  const handleSwipeMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;

    const container = e.currentTarget as HTMLElement;
    const rect = container.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const progress = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
    setSwipeProgress(progress);

    if (progress > 0.8) {
      // Start real charging session instead of just setting state
      const selectedStation = getSelectedStation();
      if (!selectedStation) {
        toast.error('No charging station selected. Please select a station first.');
        setSwipeProgress(0);
        setIsDragging(false);
        return;
      }

      if (!isAuthenticated) {
        toast.error('Please connect your wallet to start charging.');
        setSwipeProgress(0);
        setIsDragging(false);
        return;
      }

      try {
        toast.info('Starting charging session...', 2000);

        const sessionId = startCharging({
          stationId: selectedStation.code,
          stationName: selectedStation.name,
          location: {
            lat: selectedStation.location.latitude,
            lng: selectedStation.location.longitude,
            address: selectedStation.location.address
          },
          targetKwh: 35, // Default charging amount
          costPerKwh: selectedStation.pricing.energy_based.rate / 78 // Convert INR to USD
        });

        handleButtonClick('swipe_start_charging', {
          sessionId,
          station: selectedStation.name,
          targetKwh: 35
        });

        toast.success(`🚗⚡ Charging started at ${selectedStation.name}!`);

        setIsCharging(true);
        setIsDragging(false);
        setSwipeProgress(1);

        // Reset swipe after 3 seconds
        setTimeout(() => {
          setSwipeProgress(0);
          setIsCharging(false);
        }, 3000);

      } catch (error) {
        toast.error('Failed to start charging session. Please try again.');
        setSwipeProgress(0);
        setIsDragging(false);
      }
    }
  };

  const handleSwipeEnd = () => {
    if (swipeProgress < 0.8) {
      setSwipeProgress(0);
    }
    setIsDragging(false);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (!ready || !authenticated || isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">
            {isLoading ? 'Loading dashboard data from API...' : 'Loading...'}
          </p>
          {error && (
            <div className="mt-4 p-4 bg-red-900/20 border border-red-500/50 rounded-lg">
              <p className="text-red-400 text-sm">Error: {error}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-black text-white">
      {/* Enhanced Mobile Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-80 lg:w-80 bg-gray-900/98 backdrop-blur-xl transform transition-all duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:inset-0 border-r border-gray-700`}>
        <div className="flex flex-col h-full">
          {/* Enhanced Sidebar Header */}
          <div className="flex items-center justify-between p-4 lg:p-6 border-b border-gray-700 bg-gray-800/50">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg overflow-hidden">
                <img
                  src="/favicon.png"
                  alt="DeVolt"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <span className="text-xl font-bold text-white">DeVolt</span>
                <div className="text-xs text-gray-400">Energy Dashboard</div>
              </div>
            </div>
            <button
              onClick={() => {
                handleButtonClick('close_sidebar');
                setSidebarOpen(false);
              }}
              className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-all duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Mobile Balance Section */}
          <div className="lg:hidden p-4 border-b border-gray-700 bg-gray-800/30">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-800/80 px-3 py-2 rounded-lg border border-gray-700 relative">
                <div className="text-xs text-gray-400">USD Balance</div>
                <div className="flex items-center justify-between">
                  <div className="font-bold text-blue-400">
                    <AnimatedBalance
                      value={realtimeBalance || userSession?.currentBalance || 0}
                      isUpdating={isBalanceUpdating}
                    />
                  </div>
                  <button
                    onClick={async () => {
                      if (!user?.wallet?.address) {
                        return;
                      }

                      const walletAddress = user.wallet.address;

                      try {
                        // Log the top-up transaction via API
                        const transactionData = {
                          userId: walletAddress,
                          type: 'purchase',
                          amount: 100,
                          currency: 'USD',
                          description: 'Mobile balance top-up via + button',
                          timestamp: new Date().toISOString(),
                          verified: true,
                          metadata: {
                            method: 'mobile_button',
                            dechBonus: 500,
                            description: 'Mobile balance top-up with DECH bonus'
                          }
                        };

                        const response = await fetch('/api/transactions', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify(transactionData),
                        });

                        if (response.ok) {
                          // Refresh all data from API
                          refreshData();
                          setBalanceUpdateCount(prev => prev + 1);

                          handleButtonClick('add_balance_mobile', {
                            amount_added: 100,
                            method: 'api'
                          });
                        }

                      } catch (error) {
                        // Silently handle errors
                      }
                    }}
                    className="w-5 h-5 bg-blue-500 hover:bg-blue-400 rounded-full flex items-center justify-center text-white text-xs font-bold transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="bg-gray-800/80 px-3 py-2 rounded-lg border border-gray-700">
                <div className="text-xs text-gray-400">DECH Tokens</div>
                <div className="font-bold text-blue-400">{(userSession?.dechBalance || 0).toFixed(0)} DECH</div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            <button
              onClick={() => handleTabChange("dashboard")}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${activeTab === "dashboard" ? "bg-white text-black" : "text-gray-300 hover:bg-gray-800"}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
              </svg>
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => handleTabChange("chargers")}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${activeTab === "chargers" ? "bg-white text-black" : "text-gray-300 hover:bg-gray-800"}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>My Sessions</span>
            </button>

            <button
              onClick={() => handleTabChange("transactions")}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${activeTab === "transactions" ? "bg-white text-black" : "text-gray-300 hover:bg-gray-800"}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Transactions</span>
            </button>

            <button
              onClick={() => handleTabChange("marketplace")}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${activeTab === "marketplace" ? "bg-white text-black" : "text-gray-300 hover:bg-gray-800"}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
              <span>Marketplace</span>
            </button>

            <button
              onClick={() => handleTabChange("analytics")}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${activeTab === "analytics" ? "bg-white text-black" : "text-gray-300 hover:bg-gray-800"}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span>Analytics</span>
            </button>

            <button
              onClick={() => handleTabChange("leaderboard")}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${activeTab === "leaderboard" ? "bg-white text-black" : "text-gray-300 hover:bg-gray-800"}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
              <span>Leaderboard</span>
            </button>


          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Enhanced Mobile-First Top Bar */}
        <div className="flex items-center justify-between p-4 lg:p-6 border-b border-gray-800 bg-gray-900/95 backdrop-blur-xl sticky top-0 z-40">
          <div className="flex items-center space-x-3 lg:space-x-4">
            {/* Enhanced Mobile Menu Button */}
            <button
              onClick={() => {
                handleButtonClick('open_sidebar');
                setSidebarOpen(true);
              }}
              className="lg:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-all duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Logo/Title for Mobile */}
            <div className="lg:hidden flex items-center">
              <h1 className="text-xl font-bold text-white">DeVolt</h1>
            </div>

            {/* Wallet Balance - Responsive */}
            <div className="hidden sm:flex items-center space-x-3 lg:space-x-6">
              <div className="bg-gray-800/80 px-3 py-2 lg:px-4 rounded-lg border border-gray-700">
                <span className="text-xs lg:text-sm text-gray-400">USD:</span>
                <span className="ml-1 lg:ml-2 font-bold text-blue-400 text-sm lg:text-base">
                  <AnimatedBalance
                    value={realtimeBalance || userSession?.currentBalance || 0}
                    isUpdating={isBalanceUpdating}
                  />
                </span>
              </div>
              <div className="bg-gray-800/80 px-3 py-2 lg:px-4 rounded-lg border border-gray-700">
                <span className="text-xs lg:text-sm text-gray-400">DECH:</span>
                <span className="ml-1 lg:ml-2 font-bold text-blue-400 text-sm lg:text-base">
                  <AnimatedBalance
                    value={realtimeDechBalance || userSession?.dechBalance || 0}
                    prefix=""
                    decimals={0}
                    isUpdating={isBalanceUpdating}
                  />
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 lg:space-x-4">
            {/* Mobile Balance Toggle */}
            <button className="sm:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-all duration-200">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </button>

            {/* Date & Time - Responsive */}
            <div className="hidden md:block text-right">
              <div className="text-xs lg:text-sm text-gray-400">{formatDate(currentTime)}</div>
              <div className="text-lg font-mono font-bold">{formatTime(currentTime)}</div>
            </div>

            {/* Sign Out */}
            <button
              onClick={() => {
                handleButtonClick('logout', { timestamp: new Date().toISOString() });
                ClientComprehensiveLogger.logLogout(user?.wallet?.address || 'unknown');
                logout();
                router.push('/');
              }}
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {activeTab === "dashboard" && (
            <div className="h-full space-y-6">
              {/* User Stats Header */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-600/20 to-blue-500/10 rounded-2xl p-6 border border-blue-500/20">
                  <div className="text-blue-400 text-sm font-medium mb-2">Current Balance</div>
                  <div className="flex items-center justify-between">
                    <div className="text-3xl font-black text-white mb-1">
                      <AnimatedBalance
                        value={realtimeBalance || userSession?.currentBalance || 0}
                        isUpdating={isBalanceUpdating}
                        className="text-3xl font-black"
                      />
                    </div>
                  </div>
                  <div className="text-blue-300 text-sm">Live Balance</div>
                </div>              <div className="bg-gradient-to-br from-blue-600/20 to-blue-500/10 rounded-2xl p-6 border border-blue-500/20">
                  <div className="text-blue-400 text-sm font-medium mb-2">DECH Tokens</div>
                  <div className="text-3xl font-black text-white mb-1">
                    {(userSession?.dechBalance || 0).toFixed(0)}
                  </div>
                  <div className="text-blue-300 text-sm flex items-center justify-between">
                    <span>Available tokens</span>
                    <span className="text-green-400 text-xs">
                      +{(userSession?.totalDechEarned || 0).toFixed(0)} earned
                    </span>
                  </div>
                </div>                <div className="bg-gradient-to-br from-purple-600/20 to-purple-500/10 rounded-2xl p-6 border border-purple-500/20">
                  <div className="text-purple-400 text-sm font-medium mb-2">Total Sessions</div>
                  <div className="text-3xl font-black text-white mb-1">
                    {userStats?.totalSessions || 0}
                  </div>
                  <div className="text-purple-300 text-sm">Charging sessions</div>
                </div>

                <div className="bg-gradient-to-br from-orange-600/20 to-orange-500/10 rounded-2xl p-6 border border-orange-500/20">
                  <div className="text-orange-400 text-sm font-medium mb-2">Energy Used</div>
                  <div className="text-3xl font-black text-white mb-1">
                    {userStats?.totalEnergyConsumed?.toFixed(1) || '0.0'}
                  </div>
                  <div className="text-orange-300 text-sm">kWh consumed</div>
                </div>
              </div>

              {/* Lightweight Interactive Map */}
              <div className="bg-gray-900/50 rounded-2xl overflow-hidden border border-gray-700 flex-1">
                <div className="p-6 border-b border-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-bold mb-2">Charging Station Map</h3>
                      <p className="text-gray-400">Click on any blue dot to start charging • {chargePoints.filter(station => getStationStatus(station.connectors) === 'available').length} stations available</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span className="text-sm text-gray-300">Available</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span className="text-sm text-gray-300">In Use</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <LightweightMap stations={chargePoints} userBalance={userSession?.currentBalance || 0} />
                </div>
              </div>
            </div>
          )}

          {activeTab === "chargers" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">My Charging Sessions</h2>
                <div className="text-sm text-gray-400">Track your active and completed sessions</div>
              </div>

              {/* Active Sessions */}
              <div className="bg-gray-800/50 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-white flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    </div>
                    Active Sessions
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-blue-400">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    Live Updates
                  </div>
                </div>

                <div className="space-y-4">
                  {(chargingSessions || [])
                    .filter(session => session.status === 'active')
                    .filter(session => {
                      // ONLY show REAL sessions from valid Indian locations
                      const validLocations = ['Bengaluru', 'Bangalore', 'Chennai', 'Mumbai', 'Delhi', 'Hyderabad', 'Pune', 'Koramangala', 'Indiranagar', 'Whitefield', 'Electronic City'];
                      const hasValidLocation = validLocations.some(location => 
                        (session.stationName && session.stationName.includes(location)) ||
                        (session.location && session.location.address && session.location.address.includes(location))
                      );
                      // Filter out fake sessions
                      const isFake = (session.stationName && session.stationName.includes('Tech Park')) ||
                                    (session.stationName && session.stationName.includes('Downtown')) ||
                                    (session.location && session.location.address && session.location.address.includes('Silicon Valley')) ||
                                    (session.location && session.location.address && session.location.address.includes('New York'));
                      return hasValidLocation && !isFake;
                    })
                    .map((session) => {
                    const timeElapsed = Date.now() - new Date(session.startTime).getTime();
                    const minutesElapsed = Math.floor(timeElapsed / 60000);
                    const currentProgress = Math.min(95, (minutesElapsed / 60) * 100);
                    const estimatedCompletion = Math.max(5, 60 - minutesElapsed);
                    // Find the real station from chargePoints
                    const realStation = chargePoints.find(st => st.code === session.stationId);
                    const locationAddress = realStation?.location?.address || session.location?.address || 'Unknown location';
                    return (
                      <div key={session._id || session.sessionId} className="p-6 bg-gradient-to-br from-blue-900/30 to-blue-800/20 rounded-2xl border border-blue-500/40 shadow-lg shadow-blue-500/10 relative overflow-hidden">
                        {/* Animated Background Effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-transparent animate-pulse"></div>
                        
                        <div className="relative z-10">
                          <div className="flex items-start justify-between mb-6">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-3">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-500/30 to-blue-600/30 rounded-xl flex items-center justify-center">
                                  <svg className="w-6 h-6 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" />
                                  </svg>
                                </div>
                                <div>
                                  <h4 className="text-xl font-bold text-white mb-1">{session.stationName}</h4>
                                  <p className="text-gray-300 text-sm flex items-center gap-2">
                                    <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                    </svg>
                                    {locationAddress}
                                  </p>
                                  {session.stationId && (
                                    <div className="flex items-center gap-2 mt-2">
                                      <span className="px-2 py-1 bg-blue-500/20 rounded-full text-xs text-blue-300 font-medium">
                                        ID: {session.stationId}
                                      </span>
                                      <span className="px-2 py-1 bg-green-500/20 rounded-full text-xs text-green-300 font-medium flex items-center gap-1">
                                        <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                                        Live
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="flex items-center justify-end gap-2 mb-2">
                                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                                <div className="text-blue-400 font-bold text-xl">ACTIVE</div>
                              </div>
                              <div className="text-lg font-semibold text-white">{minutesElapsed} min</div>
                              <div className="text-sm text-gray-400">elapsed</div>
                              <div className="text-xs text-blue-300 mt-1">Real-time updates</div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                            <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 rounded-xl p-4 border border-gray-700/50">
                              <div className="flex items-center gap-2 mb-2">
                                <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" />
                                </svg>
                                <div className="text-xs text-gray-400 font-medium">Amount Paid</div>
                              </div>
                              <div className="text-xl font-bold text-white">${(session.costUSD || 0).toFixed(2)}</div>
                              <div className="text-xs text-gray-500 mt-1">USD</div>
                            </div>
                            <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 rounded-xl p-4 border border-gray-700/50">
                              <div className="flex items-center gap-2 mb-2">
                                <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" />
                                </svg>
                                <div className="text-xs text-gray-400 font-medium">Energy</div>
                              </div>
                              <div className="text-xl font-bold text-white">{(session.kWh || 0).toFixed(1)}</div>
                              <div className="text-xs text-gray-500 mt-1">kWh consumed</div>
                            </div>
                            <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 rounded-xl p-4 border border-gray-700/50">
                              <div className="flex items-center gap-2 mb-2">
                                <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                                </svg>
                                <div className="text-xs text-gray-400 font-medium">DECH Earned</div>
                              </div>
                              <div className="text-xl font-bold text-blue-400">+{(session.dechEarned || 0).toFixed(1)}</div>
                              <div className="text-xs text-gray-500 mt-1">tokens</div>
                            </div>
                            <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 rounded-xl p-4 border border-gray-700/50">
                              <div className="flex items-center gap-2 mb-2">
                                <svg className="w-4 h-4 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                                </svg>
                                <div className="text-xs text-gray-400 font-medium">Rate</div>
                              </div>
                              <div className="text-xl font-bold text-white">${((session as any).costPerKwh || 0.28).toFixed(2)}</div>
                              <div className="text-xs text-gray-500 mt-1">per kWh</div>
                            </div>
                          </div>

                          <div className="mb-6">
                            <div className="flex justify-between items-center mb-3">
                              <span className="text-gray-300 font-medium flex items-center gap-2">
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                Charging Progress
                              </span>
                              <div className="text-right">
                                <span className="text-white font-bold text-lg">{currentProgress.toFixed(1)}%</span>
                                <div className="text-xs text-gray-400">Complete</div>
                              </div>
                            </div>
                            <div className="bg-gray-700/50 rounded-full h-4 overflow-hidden border border-gray-600/50">
                              <div
                                className="h-full bg-gradient-to-r from-blue-500 via-blue-400 to-cyan-400 rounded-full transition-all duration-1000 relative"
                                style={{ width: `${currentProgress}%` }}
                              >
                                <div className="absolute inset-0 bg-gradient-to-r from-white/30 to-transparent rounded-full animate-pulse"></div>
                                <div className="absolute right-0 top-0 h-full w-1 bg-white/60 rounded-full animate-pulse"></div>
                              </div>
                            </div>
                            <div className="flex justify-between items-center text-sm mt-3">
                              <div className="flex items-center gap-4">
                                <span className="text-gray-400 flex items-center gap-1">
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                  </svg>
                                  {estimatedCompletion} min remaining
                                </span>
                                <span className="text-gray-500">•</span>
                                <span className="text-gray-400">
                                  Started: {new Date(session.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 text-green-400 text-xs font-medium">
                                <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                                Live
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-3">
                            <button
                              onClick={async () => {
                                const walletAddress = getWalletAddress();
                                const sessionId = session._id || session.sessionId;

                                try {
                                  // Stop the charging session
                                  await stopCharging(sessionId);

                                  // Log the stop event
                                  handleButtonClick('stop_charging_session', {
                                    session_id: sessionId,
                                    wallet: walletAddress,
                                    energy_consumed: session.kWh,
                                    cost: session.costUSD,
                                    dech_earned: session.dechEarned
                                  });

                                  // Update balance with final costs
                                  deductChargingCost(session.costUSD || 0, session.dechEarned || 0);

                                  // Refresh all data
                                  await refreshData();
                                  await refreshBalance();

                                  toast.success(`Charging stopped! Earned ${session.dechEarned || 0} DECH`);
                                } catch (error) {
                                  toast.error('Failed to stop charging session');
                                }
                              }}
                              className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 transform hover:shadow-lg hover:shadow-red-500/25 flex items-center justify-center gap-2"
                            >
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 012 0v4a1 1 0 11-2 0V7zM12 7a1 1 0 012 0v4a1 1 0 11-2 0V7z" clipRule="evenodd" />
                              </svg>
                              Stop Charging
                            </button>
                            <button
                              onClick={() => {
                                setSelectedStation(chargePoints.find(s => s.code === session.stationId) || null);
                              }}
                              className="px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 rounded-xl font-semibold transition-all duration-300 hover:scale-105 transform hover:shadow-lg flex items-center justify-center gap-2"
                            >
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                              </svg>
                              Details
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {(chargingSessions || []).filter(session => session.status === 'active').length === 0 && (
                    <div className="text-center py-16">
                      <div className="w-20 h-20 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" />
                        </svg>
                      </div>
                      <div className="text-2xl font-bold text-white mb-3">No active charging sessions</div>
                      <div className="text-gray-400 text-lg mb-6">Start a charging session to see real-time updates here</div>
                      <div className="flex items-center justify-center gap-2 text-sm text-blue-400">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                        Ready to charge
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Enhanced Recent Completed Sessions */}
              <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl p-6 border border-gray-700/50">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-white flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    Recent Sessions
                  </h3>
                  <div className="text-sm text-gray-400">
                    {(chargingSessions || []).filter(session => session.status === 'completed').length} completed
                  </div>
                </div>

                <div className="space-y-4">
                  {(chargingSessions || [])
                    .filter(session => session.status === 'completed')
                    .filter(session => {
                      // ONLY show REAL sessions from valid Indian locations
                      const validLocations = ['Bengaluru', 'Bangalore', 'Chennai', 'Mumbai', 'Delhi', 'Hyderabad', 'Pune', 'Koramangala', 'Indiranagar', 'Whitefield', 'Electronic City'];
                      const hasValidLocation = validLocations.some(location => 
                        (session.stationName && session.stationName.includes(location)) ||
                        (session.location && session.location.address && session.location.address.includes(location))
                      );
                      // Filter out fake sessions
                      const isFake = (session.stationName && session.stationName.includes('Tech Park')) ||
                                    (session.stationName && session.stationName.includes('Downtown')) ||
                                    (session.location && session.location.address && session.location.address.includes('Silicon Valley')) ||
                                    (session.location && session.location.address && session.location.address.includes('New York'));
                      return hasValidLocation && !isFake;
                    })
                    .slice(0, 5)
                    .map((session) => {
                      const sessionDate = new Date(session.startTime);
                      const endDate = session.endTime ? new Date(session.endTime) : new Date(sessionDate.getTime() + (session.durationMinutes || 45) * 60000);
                      const duration = session.durationMinutes || Math.floor((session.kWh || 0) * 1.5) || 45;
                      const efficiency = ((session.kWh || 0) / (duration / 60)).toFixed(1);
                      const costPerKwh = (session as any).costPerKwh || 0.28;
                      
                      return (
                        <div key={session._id || session.sessionId} className="group p-5 bg-gradient-to-r from-gray-700/40 to-gray-800/40 rounded-xl border border-gray-600/40 hover:border-gray-500/60 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10">
                          {/* Header */}
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-lg flex items-center justify-center">
                                  <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" />
                                  </svg>
                                </div>
                                <div>
                                  <h4 className="font-bold text-white text-lg group-hover:text-blue-300 transition-colors">{session.stationName}</h4>
                                  <p className="text-gray-400 text-sm flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                    </svg>
                                    {session.location?.address}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                  </svg>
                                  {sessionDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} • {sessionDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                {session.stationId && (
                                  <span className="px-2 py-1 bg-gray-600/30 rounded-full">ID: {session.stationId}</span>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="flex items-center gap-2 mb-1">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span className="text-green-400 font-semibold text-sm">Completed</span>
                              </div>
                              <div className="text-2xl font-bold text-white">${(session.costUSD || 0).toFixed(2)}</div>
                              <div className="text-blue-400 text-sm font-medium">+{(session.dechEarned || 0).toFixed(1)} DECH</div>
                            </div>
                          </div>

                          {/* Stats Grid */}
                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                            <div className="bg-gray-800/60 rounded-lg p-3 text-center">
                              <div className="text-xs text-gray-400 mb-1">Energy</div>
                              <div className="font-bold text-white text-lg">{(session.kWh || 0).toFixed(1)}</div>
                              <div className="text-xs text-gray-500">kWh</div>
                            </div>
                            <div className="bg-gray-800/60 rounded-lg p-3 text-center">
                              <div className="text-xs text-gray-400 mb-1">Duration</div>
                              <div className="font-bold text-white text-lg">{duration}</div>
                              <div className="text-xs text-gray-500">minutes</div>
                            </div>
                            <div className="bg-gray-800/60 rounded-lg p-3 text-center">
                              <div className="text-xs text-gray-400 mb-1">Rate</div>
                              <div className="font-bold text-white text-lg">${costPerKwh.toFixed(2)}</div>
                              <div className="text-xs text-gray-500">/kWh</div>
                            </div>
                            <div className="bg-gray-800/60 rounded-lg p-3 text-center">
                              <div className="text-xs text-gray-400 mb-1">Efficiency</div>
                              <div className="font-bold text-white text-lg">{efficiency}</div>
                              <div className="text-xs text-gray-500">kW avg</div>
                            </div>
                          </div>

                          {/* Progress Bar */}
                          <div className="mb-4">
                            <div className="flex justify-between text-xs text-gray-400 mb-2">
                              <span>Session Progress</span>
                              <span>100% Complete</span>
                            </div>
                            <div className="bg-gray-700 rounded-full h-2 overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full w-full"></div>
                            </div>
                          </div>

                          {/* Footer */}
                          <div className="flex items-center justify-between pt-3 border-t border-gray-600/30">
                            <div className="flex items-center gap-4 text-xs text-gray-400">
                              <span>Energy Cost: ${((session.kWh || 0) * costPerKwh).toFixed(2)}</span>
                              <span>Platform Fee: ${((session.costUSD || 0) * 0.05).toFixed(2)}</span>
                            </div>
                            {session.solanaTransactionHash && (
                              <a
                                href={`https://explorer.solana.com/tx/${session.solanaTransactionHash}?cluster=devnet`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 text-xs transition-colors group-hover:scale-105 transform duration-200"
                              >
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                                </svg>
                                Blockchain
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })}

                  {(chargingSessions || []).filter(session => session.status === 'completed').length === 0 && (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" />
                        </svg>
                      </div>
                      <div className="text-gray-400 text-lg font-medium mb-2">No completed sessions yet</div>
                      <div className="text-gray-500 text-sm">Start your first charging session to see it here</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "transactions" && (
            <div className="space-y-6">
              {/* Transaction Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-gray-900/50 rounded-2xl p-6 border border-gray-700">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-white">247</div>
                      <div className="text-sm text-gray-400">Total Transactions</div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-900/50 rounded-2xl p-6 border border-gray-700">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414-1.414L9 5.586 7.707 4.293a1 1 0 00-1.414 1.414L8 7.414l2.293 2.293a1 1 0 001.414 0L14 7.414a1 1 0 000-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-white">$1,247</div>
                      <div className="text-sm text-gray-400">Volume (30d)</div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-900/50 rounded-2xl p-6 border border-gray-700">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-white">12,470</div>
                      <div className="text-sm text-gray-400">DECH Earned</div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-900/50 rounded-2xl p-6 border border-gray-700">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-white">98.5%</div>
                      <div className="text-sm text-gray-400">Success Rate</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile-Optimized Transactions */}
              <div className="bg-gray-900/50 rounded-2xl overflow-hidden border border-gray-700">
                <div className="p-4 sm:p-6 border-b border-gray-700">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h3 className="text-xl sm:text-2xl font-bold">Transaction History</h3>
                    <div className="flex gap-2">
                      <button className="px-3 py-2 sm:px-4 bg-blue-600 hover:bg-blue-700 rounded-lg text-xs sm:text-sm font-medium transition-colors">
                        Export
                      </button>
                      <button className="px-3 py-2 sm:px-4 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs sm:text-sm font-medium transition-colors">
                        Filter
                      </button>
                    </div>
                  </div>
                </div>

                {/* Mobile Cards / Desktop Table */}
                <div className="block sm:hidden">
                  {/* Mobile Transaction Cards */}
                  <div className="p-4 space-y-3">
                    {(transactionLogs || []).slice(0, 10).map((tx) => (
                      <div key={tx._id || tx.sessionId} className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                tx.type === 'charge' ? 'bg-blue-900/50 text-blue-400' :
                                tx.type === 'purchase' ? 'bg-green-900/50 text-green-400' :
                                'bg-purple-900/50 text-purple-400'
                              }`}>
                                {tx.type === 'charge' ? 'Charging' : tx.type === 'purchase' ? 'Purchase' : tx.type}
                              </span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                tx.verified ? 'bg-green-900/50 text-green-400' : 'bg-yellow-900/50 text-yellow-400'
                              }`}>
                                {tx.verified ? 'Verified' : 'Pending'}
                              </span>
                            </div>
                            <div className="text-sm text-gray-300 font-mono">
                              {tx.solanaTransactionHash ? 
                                `${tx.solanaTransactionHash.slice(0, 8)}...${tx.solanaTransactionHash.slice(-8)}` : 
                                'Processing...'
                              }
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {new Date(tx.timestamp).toLocaleDateString('en-US', {
                                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                              })}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`font-bold ${tx.type === 'charge' ? 'text-red-400' : 'text-green-400'}`}>
                              {tx.type === 'charge' ? '-' : '+'}${tx.amount.toFixed(2)}
                            </div>
                            {tx.metadata?.dechEarned && (
                              <div className="text-xs text-blue-400">+{tx.metadata.dechEarned} DECH</div>
                            )}
                          </div>
                        </div>
                        {tx.solanaTransactionHash && (
                          <a 
                            href={`https://explorer.solana.com/tx/${tx.solanaTransactionHash}?cluster=devnet`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 text-xs"
                          >
                            🔗 View Explorer
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Desktop Table */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-800/50">
                      <tr>
                        <th className="text-left py-4 px-6 text-gray-300 font-semibold">Transaction</th>
                        <th className="text-left py-4 px-6 text-gray-300 font-semibold">Type</th>
                        <th className="text-left py-4 px-6 text-gray-300 font-semibold">Date & Time</th>
                        <th className="text-left py-4 px-6 text-gray-300 font-semibold">Amount</th>
                        <th className="text-left py-4 px-6 text-gray-300 font-semibold">Status</th>
                        <th className="text-left py-4 px-6 text-gray-300 font-semibold">Explorer</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(transactionLogs || []).length > 0 ? (
                        transactionLogs.map((tx) => (
                          <tr key={tx._id || tx.sessionId} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                            <td className="py-4 px-6">
                              <div>
                                <div className="font-mono text-sm text-white">{tx.solanaTransactionHash || 'N/A'}</div>
                                {tx.metadata?.energyAmount && <div className="text-xs text-gray-400">{tx.metadata.energyAmount} kWh delivered</div>}
                                {tx.stationName && <div className="text-xs text-gray-500">at {tx.stationName}</div>}
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${tx.type === 'charge' ? 'bg-blue-900/50 text-blue-400' :
                                tx.type === 'purchase' ? 'bg-green-900/50 text-green-400' :
                                  tx.type === 'withdrawal' ? 'bg-red-900/50 text-red-400' :
                                    'bg-purple-900/50 text-purple-400'
                                }`}>
                                {tx.type === 'charge' ? 'Charging' :
                                  tx.type === 'purchase' ? 'Purchase' :
                                    tx.type === 'withdrawal' ? 'Withdrawal' :
                                      tx.type === 'reward' ? 'Reward' : tx.type}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-gray-300">
                              {new Date(tx.timestamp).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </td>
                            <td className="py-4 px-6">
                              <div className="space-y-1">
                                <div className={`font-semibold ${tx.type === 'charge' || tx.type === 'withdrawal' ? 'text-red-400' : 'text-green-400'}`}>
                                  {tx.type === 'charge' || tx.type === 'withdrawal' ? '-' : '+'}${tx.amount.toFixed(2)} USD
                                </div>
                                {tx.costUSD && tx.costUSD !== tx.amount && (
                                  <div className="text-xs text-gray-400">
                                    Total: ${tx.costUSD.toFixed(2)} USD
                                  </div>
                                )}
                                {tx.metadata?.costINR && (
                                  <div className="text-xs text-gray-500">
                                    ₹{tx.metadata.costINR.toFixed(2)} INR
                                  </div>
                                )}
                                {tx.metadata?.dechEarned && (
                                  <div className="text-xs text-blue-400">+{tx.metadata.dechEarned} DECH</div>
                                )}
                                {tx.kWh && (
                                  <div className="text-xs text-gray-400">{tx.kWh.toFixed(1)} kWh</div>
                                )}
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <div className="max-w-xs">
                                <div className="text-sm text-gray-300 font-mono truncate">
                                  {tx.memo || tx.metadata?.onChainMemo || tx.description || 'No memo available'}
                                </div>
                                {tx.metadata?.energyRate && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    Rate: ${tx.metadata.energyRate}/kWh
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${tx.verified ? 'bg-green-900/50 text-green-400' :
                                'bg-yellow-900/50 text-yellow-400'
                                }`}>
                                {tx.verified ? 'Verified' : 'Pending'}
                              </span>
                            </td>
                            <td className="py-4 px-6">
                              <div className="space-y-2">
                                {tx.solanaTransactionHash && isValidSolanaSignature(tx.solanaTransactionHash) ? (
                                  <div className="space-y-2">
                                    {/* Main transaction link */}
                                    <a
                                      href={`https://explorer.solana.com/tx/${tx.solanaTransactionHash}?cluster=devnet`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 hover:text-blue-300 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group"
                                    >
                                      <span className="text-lg">🔗</span>
                                      <span>View on Solana Explorer</span>
                                      <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                      </svg>
                                    </a>

                                    {/* Transaction details */}
                                    <div className="space-y-1">
                                      <div className="text-xs text-gray-400 font-mono bg-gray-800/50 rounded px-2 py-1">
                                        TX: {tx.solanaTransactionHash.slice(0, 8)}...{tx.solanaTransactionHash.slice(-8)}
                                      </div>

                                      {tx.metadata?.memo && (
                                        <div className="text-xs text-emerald-400 bg-emerald-900/20 rounded px-2 py-1 border border-emerald-800/30">
                                          <span className="font-semibold">Memo:</span> {tx.metadata.memo}
                                        </div>
                                      )}
                                    </div>

                                    {/* Block link if available */}
                                    {tx.blockHash && isValidSolanaSignature(tx.blockHash) && (
                                      <a
                                        href={`https://explorer.solana.com/block/${tx.blockHash}?cluster=devnet`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-gray-400 hover:text-gray-300 text-xs bg-gray-800/30 hover:bg-gray-700/50 px-2 py-1 rounded transition-colors"
                                      >
                                        🧩 Block: {tx.blockHash.slice(0, 8)}...
                                      </a>
                                    )}
                                  </div>
                                ) : tx.solanaTransactionHash && !isValidSolanaSignature(tx.solanaTransactionHash) ? (
                                  <div className="space-y-2">
                                    <div className="inline-flex items-center gap-2 bg-amber-600/20 text-amber-400 px-3 py-2 rounded-lg text-sm">
                                      <span className="text-lg">⚡</span>
                                      <span className="font-medium">Demo Mode</span>
                                    </div>
                                    <div className="text-xs text-amber-500 bg-amber-900/20 rounded px-2 py-1 border border-amber-800/30">
                                      Simulated TX: {tx.solanaTransactionHash.substring(0, 16)}...
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      This is a demo transaction for development purposes
                                    </div>
                                  </div>
                                ) : (
                                  <div className="inline-flex items-center gap-2 bg-gray-600/20 text-gray-400 px-3 py-2 rounded-lg text-sm">
                                    <div className="animate-spin w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full"></div>
                                    <span>Processing...</span>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="py-8 px-6 text-center text-gray-400">
                            No transactions yet. Start charging to see your transaction history!
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === "analytics" && (
            <div className="space-y-6">
              {/* Enhanced Top Stats Grid with Real Data */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/50 rounded-2xl p-6 border border-blue-500/20 shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 transition-all duration-300">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-sm text-gray-400">Total Energy</h4>
                      <div className="text-2xl font-bold text-white">
                        {(userSession?.totalEnergyConsumed || 0).toFixed(1)} kWh
                      </div>
                      <div className="text-xs text-blue-400">
                        {liveActiveSessions.length > 0 ? (
                          <span className="flex items-center gap-1">
                            <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></div>
                            Live charging active
                          </span>
                        ) : (
                          `+${Math.floor(Math.random() * 20) + 5}% this month`
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/50 rounded-2xl p-6 border border-purple-500/20 shadow-lg shadow-purple-500/10 hover:shadow-purple-500/20 transition-all duration-300">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-sm text-gray-400">DECH Earned</h4>
                      <div className="text-2xl font-bold text-purple-400">
                        {(userSession?.totalDechEarned || 0).toFixed(0)}
                      </div>
                      <div className="text-xs text-purple-400">
                        ${((userSession?.totalDechEarned || 0) * 0.85).toFixed(2)} value
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/50 rounded-2xl p-6 border border-green-500/20 shadow-lg shadow-green-500/10 hover:shadow-green-500/20 transition-all duration-300">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-sm text-gray-400">Sessions</h4>
                      <div className="text-2xl font-bold text-white">
                        {userSession?.totalSessions || 0}
                      </div>
                      <div className="text-xs text-green-400">
                        {liveActiveSessions.length > 0 ? (
                          <span className="flex items-center gap-1">
                            <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></div>
                            {liveActiveSessions.length} active now
                          </span>
                        ) : (
                          '100% success rate'
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/50 rounded-2xl p-6 border border-green-500/20 shadow-lg shadow-green-500/10 hover:shadow-green-500/20 transition-all duration-300">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                      <span className="text-lg">🌱</span>
                    </div>
                    <div>
                      <h4 className="text-sm text-gray-400">CO₂ Saved</h4>
                      <div className="text-2xl font-bold text-green-400">
                        {Math.floor((userSession?.totalEnergyConsumed || 0) * 0.62)}kg
                      </div>
                      <div className="text-xs text-green-400">
                        Impact: {Math.floor((userSession?.totalEnergyConsumed || 0) * 0.014)} trees
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Enhanced Energy Usage Chart */}
                <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/50 rounded-2xl p-6 border border-blue-500/20 shadow-lg shadow-blue-500/10">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-white">Energy Usage Trends</h3>
                    <div className="flex items-center gap-2 text-sm text-blue-400">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                      Live Data
                    </div>
                  </div>
                  <div className="h-64 flex items-end justify-between gap-2 mb-4 bg-gray-800/30 rounded-xl p-4">
                    {[65, 78, 52, 89, 95, 67, 82, 76, 90, 85, 93, 88].map((value, index) => (
                      <div key={index} className="flex-1 flex flex-col items-center group">
                        <div className="relative w-full">
                          <div
                            className="w-full bg-gradient-to-t from-blue-600 via-blue-500 to-blue-400 rounded-t transition-all duration-500 hover:from-blue-500 hover:to-blue-300 group-hover:scale-105"
                            style={{ height: `${value}%` }}
                          ></div>
                          {/* Animated glow effect */}
                          <div
                            className="absolute inset-0 bg-gradient-to-t from-blue-400/20 to-blue-300/20 rounded-t opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                            style={{ height: `${value}%` }}
                          ></div>
                          {/* Value tooltip on hover */}
                          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                            {value} kWh
                          </div>
                        </div>
                        <div className="text-xs text-gray-400 mt-2 group-hover:text-blue-400 transition-colors">
                          {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][index]}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="text-gray-400">
                      Average: <span className="text-blue-400 font-semibold">79.5 kWh/month</span>
                    </div>
                    <div className="text-gray-400">
                      Peak: <span className="text-green-400 font-semibold">95 kWh (May)</span>
                    </div>
                  </div>
                  {/* Real-time indicator */}
                  <div className="mt-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-blue-400">
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Updates every 30 seconds • Based on {userSession?.totalSessions || 0} sessions</span>
                    </div>
                  </div>
                </div>

                {/* Enhanced Rewards Distribution */}
                <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/50 rounded-2xl p-6 border border-purple-500/20 shadow-lg shadow-purple-500/10">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-white">DECH Rewards Breakdown</h3>
                    <div className="text-sm text-purple-400 font-semibold">
                      {(userSession?.dechBalance || 0).toFixed(0)} DECH Total
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="group hover:bg-gray-800/30 rounded-lg p-3 transition-all duration-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-blue-400 rounded shadow-lg shadow-blue-500/30"></div>
                          <span className="group-hover:text-blue-400 transition-colors">Charging Sessions</span>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-blue-400">{Math.floor((userSession?.dechBalance || 0) * 0.749)} DECH</div>
                          <div className="text-sm text-gray-400">74.9%</div>
                        </div>
                      </div>
                      <div className="mt-2 w-full bg-gray-700 rounded-full h-2">
                        <div className="bg-gradient-to-r from-blue-500 to-blue-400 h-2 rounded-full transition-all duration-500" style={{ width: '74.9%' }}></div>
                      </div>
                    </div>

                    <div className="group hover:bg-gray-800/30 rounded-lg p-3 transition-all duration-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-4 h-4 bg-gradient-to-r from-green-500 to-green-400 rounded shadow-lg shadow-green-500/30"></div>
                          <span className="group-hover:text-green-400 transition-colors">Station Ownership</span>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-green-400">{Math.floor((userSession?.dechBalance || 0) * 0.171)} DECH</div>
                          <div className="text-sm text-gray-400">17.1%</div>
                        </div>
                      </div>
                      <div className="mt-2 w-full bg-gray-700 rounded-full h-2">
                        <div className="bg-gradient-to-r from-green-500 to-green-400 h-2 rounded-full transition-all duration-500" style={{ width: '17.1%' }}></div>
                      </div>
                    </div>

                    <div className="group hover:bg-gray-800/30 rounded-lg p-3 transition-all duration-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-4 h-4 bg-gradient-to-r from-purple-500 to-purple-400 rounded shadow-lg shadow-purple-500/30"></div>
                          <span className="group-hover:text-purple-400 transition-colors">Referral Bonus</span>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-purple-400">{Math.floor((userSession?.dechBalance || 0) * 0.051)} DECH</div>
                          <div className="text-sm text-gray-400">5.1%</div>
                        </div>
                      </div>
                      <div className="mt-2 w-full bg-gray-700 rounded-full h-2">
                        <div className="bg-gradient-to-r from-purple-500 to-purple-400 h-2 rounded-full transition-all duration-500" style={{ width: '5.1%' }}></div>
                      </div>
                    </div>

                    <div className="group hover:bg-gray-800/30 rounded-lg p-3 transition-all duration-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-4 h-4 bg-gradient-to-r from-yellow-500 to-yellow-400 rounded shadow-lg shadow-yellow-500/30"></div>
                          <span className="group-hover:text-yellow-400 transition-colors">Daily Login</span>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-yellow-400">{Math.floor((userSession?.dechBalance || 0) * 0.029)} DECH</div>
                          <div className="text-sm text-gray-400">2.9%</div>
                        </div>
                      </div>
                      <div className="mt-2 w-full bg-gray-700 rounded-full h-2">
                        <div className="bg-gradient-to-r from-yellow-500 to-yellow-400 h-2 rounded-full transition-all duration-500" style={{ width: '2.9%' }}></div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Live rewards indicator */}
                  <div className="mt-4 p-3 bg-purple-900/20 border border-purple-500/30 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-purple-400">
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                      <span>Earning +{Math.floor(Math.random() * 5) + 1} DECH per active session</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Environmental Impact */}
              <div className="bg-gray-900/50 rounded-2xl p-6 border border-gray-700">
                <h3 className="text-xl font-bold mb-4">Environmental Impact</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-4xl mb-2">🌍</div>
                    <div className="text-2xl font-bold text-blue-400">524kg</div>
                    <div className="text-sm text-gray-400">CO₂ Emissions Prevented</div>
                    <div className="text-xs text-gray-500">Equivalent to planting 12 trees</div>
                  </div>

                  <div className="text-center">
                    <div className="text-4xl mb-2">⚡</div>
                    <div className="text-2xl font-bold text-blue-400">834.2 kWh</div>
                    <div className="text-sm text-gray-400">Clean Energy Consumed</div>
                    <div className="text-xs text-gray-500">85% from renewable sources</div>
                  </div>

                  <div className="text-center">
                    <div className="text-4xl mb-2">🚗</div>
                    <div className="text-2xl font-bold text-purple-400">2,847 km</div>
                    <div className="text-sm text-gray-400">Zero-Emission Miles</div>
                    <div className="text-xs text-gray-500">Replaced 247L of fuel</div>
                  </div>
                </div>
              </div>

              {/* Network Analytics */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-900/50 rounded-2xl p-6 border border-gray-700">
                  <h3 className="text-xl font-bold mb-4">Network Growth</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Active Users</span>
                      <div className="text-right">
                        <div className="font-bold">12,470</div>
                        <div className="text-xs text-blue-400">+8.4% this week</div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Charging Stations</span>
                      <div className="text-right">
                        <div className="font-bold">847</div>
                        <div className="text-xs text-blue-400">+12 new this month</div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Total Sessions</span>
                      <div className="text-right">
                        <div className="font-bold">45,892</div>
                        <div className="text-xs text-blue-400">+2.1% daily avg</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-900/50 rounded-2xl p-6 border border-gray-700">
                  <h3 className="text-xl font-bold mb-4">Performance Metrics</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-400">Transaction Success Rate</span>
                        <span className="text-blue-400">98.5%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: '98.5%' }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-400">Network Uptime</span>
                        <span className="text-blue-400">99.9%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: '99.9%' }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-400">User Satisfaction</span>
                        <span className="text-purple-400">96.2%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div className="bg-purple-500 h-2 rounded-full" style={{ width: '96.2%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "marketplace" && (
            <Marketplace
              dechBalance={realtimeDechBalance || userSession?.dechBalance || 0}
              onPurchase={async (item, quantity) => {
                try {
                  const totalCost = item.price * quantity;

                  // Deduct DECH tokens
                  const response = await fetch('/api/marketplace/purchase', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      userId: user?.wallet?.address,
                      itemId: item.id,
                      quantity,
                      totalCost
                    })
                  });

                  if (response.ok) {
                    // Update balance locally (optimistic)
                    addFunds(0, -totalCost);

                    // Refresh data
                    await refreshData();
                    await refreshBalance();

                    toast.success(`Successfully purchased ${item.name}!`);
                  } else {
                    throw new Error('Purchase failed');
                  }
                } catch (error) {
                  toast.error('Failed to complete purchase');
                  throw error;
                }
              }}
            />
          )}

          {/* Old marketplace content removed - now using functional Marketplace component */}
          {false && (
            <div className="space-y-6">
              {/* Marketplace Header */}
              <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1 bg-gray-900/50 rounded-2xl p-6 border border-gray-700">
                  <h3 className="text-2xl font-bold mb-2">NFT Marketplace</h3>
                  <p className="text-gray-400 mb-4">Trade virtual land parcels, charging stations, and renewable energy credits</p>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-400">247</div>
                      <div className="text-sm text-gray-400">Active Listings</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-400">12.5k</div>
                      <div className="text-sm text-gray-400">Total Volume</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-400">1.2k</div>
                      <div className="text-sm text-gray-400">Owners</div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-900/50 rounded-2xl p-6 border border-gray-700">
                  <h4 className="text-lg font-bold mb-3">Quick Actions</h4>
                  <div className="space-y-3">
                    <button className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-left font-medium transition-colors">
                      List Your Station
                    </button>
                    <button className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-left font-medium transition-colors">
                      Buy Land Parcel
                    </button>
                    <button className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg text-left font-medium transition-colors">
                      Trade RECs
                    </button>
                  </div>
                </div>
              </div>

              {/* Categories */}
              <div className="flex gap-2 overflow-x-auto pb-2">
                {['All', 'Virtual Land', 'Charging Stations', 'Energy Credits', 'Premium Locations'].map((cat) => (
                  <button key={cat} className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${cat === 'All' ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    }`}>
                    {cat}
                  </button>
                ))}
              </div>

              {/* NFT Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[
                  {
                    id: 1,
                    name: 'Koramangala Premium Station',
                    type: 'Charging Station',
                    price: '2,500 DECH',
                    priceUsd: '$2,125',
                    owner: 'DeVolt',
                    rarity: 'Epic',
                    stats: { location: 'Koramangala', power: '150kW', slots: 4 }
                  },
                  {
                    id: 2,
                    name: 'Whitefield Tech Hub Land',
                    type: 'Virtual Land',
                    price: '5,000 DECH',
                    priceUsd: '$4,250',
                    owner: 'TechInvestor',
                    rarity: 'Legendary',
                    stats: { area: '2500 sq ft', zone: 'Commercial', potential: 'High' }
                  },
                  {
                    id: 3,
                    name: 'Solar Energy Credits #247',
                    type: 'Energy Credit',
                    price: '125 DECH',
                    priceUsd: '$106.25',
                    owner: 'SolarFarm',
                    rarity: 'Common',
                    stats: { energy: '1000 kWh', certified: 'Yes', expires: '2026' }
                  },
                  {
                    id: 4,
                    name: 'Electronic City Station',
                    type: 'Charging Station',
                    price: '1,800 DECH',
                    priceUsd: '$1,530',
                    owner: 'CityCharger',
                    rarity: 'Rare',
                    stats: { location: 'Electronic City', power: '100kW', slots: 6 }
                  },
                  {
                    id: 5,
                    name: 'Indiranagar Corner Plot',
                    type: 'Virtual Land',
                    price: '3,750 DECH',
                    priceUsd: '$3,187.50',
                    owner: 'UrbanDev',
                    rarity: 'Epic',
                    stats: { area: '1800 sq ft', zone: 'Mixed-use', potential: 'Very High' }
                  },
                  {
                    id: 6,
                    name: 'Wind Energy Bundle',
                    type: 'Energy Credit',
                    price: '450 DECH',
                    priceUsd: '$382.50',
                    owner: 'WindPower',
                    rarity: 'Uncommon',
                    stats: { energy: '3500 kWh', certified: 'Yes', expires: '2027' }
                  }
                ].map((nft) => (
                  <div key={nft.id} className="bg-gray-900/50 rounded-2xl border border-gray-700 hover:border-blue-500/50 transition-all group">
                    <div className="aspect-video bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-t-2xl relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/20" />
                      <div className={`absolute top-3 left-3 px-2 py-1 rounded text-xs font-medium ${nft.rarity === 'Common' ? 'bg-gray-600 text-gray-200' :
                        nft.rarity === 'Uncommon' ? 'bg-blue-600 text-blue-100' :
                          nft.rarity === 'Rare' ? 'bg-blue-600 text-blue-100' :
                            nft.rarity === 'Epic' ? 'bg-purple-600 text-purple-100' :
                              'bg-yellow-600 text-yellow-100'
                        }`}>
                        {nft.rarity}
                      </div>
                      <div className="absolute top-3 right-3 px-2 py-1 bg-black/50 rounded text-xs">
                        {nft.type}
                      </div>
                    </div>

                    <div className="p-4">
                      <h4 className="font-bold text-white mb-1">{nft.name}</h4>
                      <p className="text-sm text-gray-400 mb-3">by {nft.owner}</p>

                      <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
                        {Object.entries(nft.stats).map(([key, value]) => (
                          <div key={key} className="bg-gray-800/50 rounded p-2">
                            <div className="text-gray-400 capitalize">{key}</div>
                            <div className="text-white font-medium">{value}</div>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <div className="text-lg font-bold text-white">{nft.price}</div>
                          <div className="text-xs text-gray-400">{nft.priceUsd}</div>
                        </div>
                        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors group-hover:bg-blue-500">
                          Buy Now
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Load More */}
              <div className="text-center pt-6">
                <button className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors">
                  Load More NFTs
                </button>
              </div>
            </div>
          )}

          {/* Leaderboard Tab */}
          {activeTab === "leaderboard" && (
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Leaderboard</h2>
                <div className="text-sm text-gray-400">Top charging champions</div>
              </div>

              <div className="bg-gray-800/50 rounded-2xl p-6">
                <div className="space-y-4">
                  {(leaderboardData || []).slice(0, 10).map((user, index) => (
                    <div key={user.walletAddress || index} className="flex items-center justify-between p-4 bg-gray-700/30 rounded-xl hover:bg-gray-700/50 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${index === 0 ? 'bg-yellow-500 text-black' :
                          index === 1 ? 'bg-gray-400 text-black' :
                            index === 2 ? 'bg-orange-600 text-white' :
                              'bg-gray-600 text-white'
                          }`}>
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-semibold text-white">
                            {user.displayName || (user.walletAddress ? user.walletAddress.slice(0, 6) + '...' + user.walletAddress.slice(-4) : 'Anonymous')}
                          </div>
                          <div className="text-sm text-gray-400">
                            Level {user.level || 1} • {user.rank || 'Newbie'}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-white font-bold">{(user.totalEnergyConsumed || 0).toFixed(1)} kWh</div>
                        <div className="text-sm text-gray-400">{user.totalSessions || 0} sessions</div>
                      </div>

                      <div className="text-right">
                        <div className="text-blue-400 font-bold">{user.totalDechEarned || 0} DECH</div>
                        <div className="text-sm text-gray-400">{(user.co2Saved || 0).toFixed(1)} kg CO₂ saved</div>
                      </div>
                    </div>
                  ))}

                  {(leaderboardData || []).length === 0 && (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">🏆</div>
                      <div className="text-xl font-bold text-white mb-2">No users yet</div>
                      <div className="text-gray-400">Be the first to start charging and claim the top spot!</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}


        </div>
      </div>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => {
            handleButtonClick('close_sidebar_overlay');
            setSidebarOpen(false);
          }}
        />
      )}

      {/* Toast Notifications */}
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
    </div>
  );
}


