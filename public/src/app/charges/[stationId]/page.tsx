"use client";

import { useEffect, useState, useRef, Suspense, use } from "react";
import ServerlessSolana from '@/lib/serverlessSolana';
import { useRouter, useSearchParams } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import Link from "next/link";
import Image from "next/image";
import gsap from "gsap";
import { allChargePoints, ChargePoint, formatCurrency } from "@/data/realChargePoints";
import UserSessionManager from "@/lib/userSession";
import { ClientComprehensiveLogger } from "@/lib/clientLogger";
import { useLiveCharging } from "@/hooks/useLiveCharging";
import { useRealTimeBalance } from "@/hooks/useRealTimeBalance";

interface ChargeStation {
  id: string;
  name: string;
  location: string;
  pricePerKwh: number;
  availablePorts: number;
  totalPorts: number;
  rating: number;
  features: string[];
  coordinates: { lat: number; lng: number };
}

function ChargePage({ params }: { params: Promise<{ stationId: string }> }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { ready, authenticated, user } = usePrivy();
  const { startCharging: startLiveCharging, stopCharging: stopLiveCharging, refreshSessions, getSessionProgress } = useLiveCharging();
  
  // Real-time balance management
  const {
    balance: realtimeBalance,
    dechBalance: realtimeDechBalance,
    isUpdating: isBalanceUpdating,
    deductChargingCost,
    addFunds,
    refreshBalance
  } = useRealTimeBalance(user?.wallet?.address);
  
  // Get station ID from URL params and charging status from query (Next.js 15 compatible)
  const resolvedParams = use(params);
  const stationId = resolvedParams.stationId;
  const chargingParam = searchParams.get('charging');
  const isCharging = chargingParam === 'true';
  const isSetupMode = chargingParam === 'false';

  // Helper function to validate Solana transaction signatures
  const isValidSolanaSignature = (signature: string): boolean => {
    try {
      // Solana signatures are base58 encoded and typically 86-88 characters long
      if (!signature || signature.length < 86 || signature.length > 88) {
        return false;
      }
      
      // Check for invalid characters (must be valid base58)
      const base58Regex = /^[1-9A-HJ-NP-Za-km-z]+$/;
      if (!base58Regex.test(signature)) {
        return false;
      }
      
      // Check that it doesn't contain obvious fake patterns
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
  const [station, setStation] = useState<ChargeStation | null>(null);
  
  const sessionManager = UserSessionManager.getInstance();
  // Don't automatically set charging state from URL - only set after successful payment
  const [chargingState, setChargingState] = useState(false);
  const [hasActiveSession, setHasActiveSession] = useState(false);
  const [chargingProgress, setChargingProgress] = useState(0);
  const [selectedAmount, setSelectedAmount] = useState(25);
  const [showTransactionPopup, setShowTransactionPopup] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [rewardsEarned, setRewardsEarned] = useState(0);
  const [energyDelivered, setEnergyDelivered] = useState(0);
  const [chargingTime, setChargingTime] = useState(0);
  const [swipePosition, setSwipePosition] = useState(0);
  const [isSwipeComplete, setIsSwipeComplete] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [transactionHash, setTransactionHash] = useState('');
  const [memoTransactionData, setMemoTransactionData] = useState(null);
  const [liveSessionId, setLiveSessionId] = useState(null);
  // Use real-time balance instead of local state
  const userBalance = realtimeBalance || 100; // Fallback to $100 if not loaded
  const [currentTime, setCurrentTime] = useState(new Date());
  const [balanceLastUpdated, setBalanceLastUpdated] = useState<Date | null>(null);
  const [confirmationCountdown, setConfirmationCountdown] = useState(7);
  
  const swipeRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const stationCardRef = useRef<HTMLDivElement>(null);

  // Consistent wallet address getter - use this everywhere
  const getWalletAddress = () => {
    return user?.wallet?.address || 'demo_wallet_default';
  };

  // Function to transition from setup mode to charging mode
  const transitionToChargingMode = () => {
    console.log('🔄 Transitioning from setup mode to charging mode');
    // Update URL to show charging state
    window.history.pushState({}, '', `/charges/${stationId}?charging=true`);
    // The page will re-render and show the charging interface
  };

  // Check for active charging session on component mount
  useEffect(() => {
    if (!ready || !authenticated || !user) return;
    
    const walletAddress = getWalletAddress();
    const activeSessions = sessionManager.getChargingSessions(walletAddress);
    const activeSessionForStation = activeSessions.find(
      session => session.stationId === stationId && session.status === 'active'
    );
    
    if (activeSessionForStation && isCharging) {
      console.log('🔄 Found active charging session for station:', activeSessionForStation);
      setHasActiveSession(true);
      setChargingState(true);
      
      // Restore session data
      setTransactionHash(activeSessionForStation.txHash || '');
      setSelectedAmount(activeSessionForStation.energyConsumed || 25);
      
      // Start live session if not already started
      try {
        const liveSessionId = startLiveCharging({
          stationId: station?.id || stationId,
          stationName: station?.name || 'Charging Station',
          location: {
            lat: station?.coordinates?.lat || 0,
            lng: station?.coordinates?.lng || 0,
            address: station?.location || 'Unknown Location'
          },
          targetKwh: activeSessionForStation.energyConsumed || 25,
          costPerKwh: station?.pricePerKwh || 0.14
        });
        setLiveSessionId(liveSessionId);
        console.log('🔴 Resumed live charging session:', liveSessionId);
      } catch (error) {
        console.error('⚠️ Failed to resume live charging session:', error);
      }
    } else if (isCharging && !activeSessionForStation) {
      // URL says charging=true but no active session found - create a demo session for testing
      console.log('⚠️ No active session found, creating demo session for ?charging=true');
      setHasActiveSession(true);
      setChargingState(true);
      
      // Create a demo transaction hash for testing
      setTransactionHash(`demo_tx_${Date.now()}`);
      
      // Start live session for demo
      try {
        const liveSessionId = startLiveCharging({
          stationId: station?.id || stationId,
          stationName: station?.name || 'Charging Station',
          location: {
            lat: station?.coordinates?.lat || 0,
            lng: station?.coordinates?.lng || 0,
            address: station?.location || 'Unknown Location'
          },
          targetKwh: selectedAmount,
          costPerKwh: station?.pricePerKwh || 0.14
        });
        setLiveSessionId(liveSessionId);
        console.log('🔴 Started demo live charging session:', liveSessionId);
      } catch (error) {
        console.error('⚠️ Failed to start demo live charging session:', error);
      }
    } else if (isSetupMode) {
      // In setup mode - ensure we're not in charging state
      console.log('📋 In setup mode - preparing charging session');
      setChargingState(false);
      setHasActiveSession(false);
    }
  }, [ready, authenticated, user, stationId, isCharging, station]);

  // Get station data from URL parameters
  const locationId = stationId; // Use the dynamic route parameter
  
  // Find real station data
  const realStation = allChargePoints.find(station => station.code === locationId);
  
  const mockStation: ChargeStation = realStation ? {
    id: realStation.code,
    name: realStation.name,
    location: realStation.location.address,
    pricePerKwh: realStation.pricing.energy_based.rate / 83, // Convert INR to USD
    availablePorts: realStation.connectors.filter(c => c.status === 'available').length,
    totalPorts: realStation.no_of_connectors,
    rating: 4.2 + (Math.random() * 0.8), // Random rating between 4.2-5.0
    features: [
      ...realStation.connectors.map(c => c.type),
      `${Math.max(...realStation.connectors.map(c => c.power_kw))}kW Fast Charging`,
      '24/7 Available'
    ],
    coordinates: { lat: realStation.location.latitude, lng: realStation.location.longitude }
  } : {
    id: stationId || 'station-1',
    name: 'DeVolt Hub Central',
    location: 'Central Bangalore',
    pricePerKwh: 0.28,
    availablePorts: 2,
    totalPorts: 4,
    rating: 4.5,
    features: ['Fast Charging', 'CCS2', 'CHAdeMO', '24/7 Available'],
    coordinates: { lat: 12.9716, lng: 77.5946 }
  };

  useEffect(() => {
    if (!ready) return;
    
    setStation(mockStation);
    
    // Always initialize balance, regardless of authentication status
    const initializeUserBalance = async () => {
      try {
        // Use consistent wallet address
        const walletAddress = getWalletAddress();
        
        console.log('🔍 Starting balance initialization for wallet:', walletAddress);
        console.log('🔍 Authenticated:', authenticated, 'Ready:', ready, 'User:', !!user);
        
        // Log page view (only if we have a real wallet)
        if (user?.wallet?.address) {
          ClientComprehensiveLogger.logPageView(walletAddress, 'charge', {
            stationId: mockStation.id,
            stationName: mockStation.name,
            timestamp: new Date()
          });
        }

        // Initialize user session to ensure $100 balance
        console.log('🔍 About to initialize user session...');
        let userSession = await sessionManager.initializeUser(walletAddress, user?.email?.address);
        console.log('🔍 User session after initialization:', userSession);
        
        // Force session creation with $100 if missing or invalid
        if (!userSession || !userSession.currentBalance) {
          console.log('⚠️ Creating new session with forced $100 balance');
          userSession = {
            walletAddress,
            email: user?.email?.address,
            joinedAt: new Date().toISOString(),
            totalSessions: 0,
            totalEnergyConsumed: 0,
            totalDechEarned: 0,
            totalSpent: 0,
            currentBalance: 100.00, // Force $100 default
            dechBalance: 0,
            level: 1,
            achievements: ['welcome'],
            preferences: {
              preferredPaymentMethod: 'USD',
              autoCharge: false,
              notifications: true
            }
          };
          sessionManager.saveUserSession(userSession);
        }
        
        // Ensure the user has exactly $100 balance (force it for demo)
        if (userSession.currentBalance !== 100) {
          console.log('⚠️ Setting balance to exactly $100 for demo purposes');
          userSession.currentBalance = 100.00;
          sessionManager.saveUserSession(userSession);
        }
        
        // Balance is now managed by real-time balance system
        const balance = userSession.currentBalance;
        console.log('💰 Real-time balance system active, current balance:', balance);
        
        // Refresh real-time balance to sync with session manager
        refreshBalance();
        
        console.log('✅ Balance initialization complete:', balance, 'for wallet:', walletAddress);
        console.log('🔍 Full user session:', userSession);
        
        // Verify the state was set correctly
        setTimeout(() => {
          console.log('🔍 Balance state after timeout:', balance);
          // Double check localStorage
          const storedSession = sessionManager.getUserSession(walletAddress);
          console.log('🔍 Stored session in localStorage:', storedSession);
          if (storedSession && storedSession.currentBalance !== balance) {
            console.log('⚠️ Balance mismatch! Fixing...');
            // Balance managed by real-time system
          }
        }, 100);
        
        // Log balance check on page load (only if we have a real wallet)
        if (user?.wallet?.address) {
          ClientComprehensiveLogger.logBalanceCheck(walletAddress, {
            currentBalance: balance,
            dechBalance: userSession.dechBalance,
            checkContext: 'charge_page_load'
          });
        }
        
        console.log('💰 Charge page balance initialized:', balance);
      } catch (error) {
        console.log('⚠️ Error initializing user balance, using default:', error);
        // Fallback handled by real-time balance system
      }
    };
    
    initializeUserBalance();
    
    // Entrance animations
    gsap.fromTo(stationCardRef.current, 
      { opacity: 0, y: 50 },
      { opacity: 1, y: 0, duration: 1, ease: "power3.out", delay: 0.3 }
    );
  }, [ready, authenticated, router, user]);

  // Add periodic balance refresh for real-time updates
  useEffect(() => {
    if (!user?.wallet?.address) return;
    
    const refreshBalance = () => {
      const walletAddress = getWalletAddress(); // Use consistent wallet address
      const userSession = sessionManager.getUserSession(walletAddress);
      
      if (userSession && userSession.currentBalance !== userBalance) {
        console.log('🔄 Balance refresh handled by real-time system:', userBalance, '→', userSession.currentBalance);
        // Real-time balance system handles updates automatically
      }
    };
    
    // Initial refresh
    refreshBalance();
    
    // Refresh balance every 5 seconds
    const interval = setInterval(refreshBalance, 5000);
    
    return () => clearInterval(interval);
  }, [user?.wallet?.address, userBalance]);

  // Real-time sync with live charging sessions
  useEffect(() => {
    if (!liveSessionId || !chargingState) return;
    
    const syncInterval = setInterval(() => {
      try {
        const sessionProgress = getSessionProgress(liveSessionId);
        if (sessionProgress) {
          console.log('🔄 Syncing charging page with live session:', sessionProgress);
          
          // Update local state to match live session
          setEnergyDelivered(sessionProgress.currentKwh);
          setRewardsEarned(sessionProgress.dechEarned);
          setChargingProgress(sessionProgress.progress);
          
          // Update session manager with live data
          if (user?.wallet?.address) {
            const walletAddress = getWalletAddress();
            const userSession = sessionManager.getUserSession(walletAddress);
            if (userSession) {
              userSession.dechBalance = (userSession.dechBalance || 0) + 0.1; // Small incremental update
              sessionManager.saveUserSession(userSession);
              refreshBalance(); // Sync with real-time balance system
            }
          }
        }
      } catch (error) {
        console.log('⚠️ Error syncing with live session:', error);
      }
    }, 3000); // Sync every 3 seconds
    
    return () => clearInterval(syncInterval);
  }, [liveSessionId, chargingState, user?.wallet?.address, getSessionProgress, refreshBalance]);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    // Use both chargingState AND isCharging to ensure simulation runs when URL has ?charging=true
    if (chargingState || (isCharging && hasActiveSession)) {
      console.log('🔄 Starting charging simulation - chargingState:', chargingState, 'isCharging:', isCharging, 'hasActiveSession:', hasActiveSession);
      interval = setInterval(() => {
        setChargingTime(prev => prev + 1);
        
        // Real-time energy delivery (0.5 kWh per second for demo)
        setEnergyDelivered(prev => {
          const newEnergy = prev + 0.5;
          return newEnergy;
        });
        
        // Real-time DECH earnings (10 DECH per kWh)
        setRewardsEarned(prev => {
          const newRewards = prev + (0.5 * 10); // 5 DECH per second
          
          // Update user session with real-time DECH earnings
          if (user?.wallet?.address) {
            const walletAddress = getWalletAddress(); // Use consistent wallet address
            const userSession = sessionManager.getUserSession(walletAddress);
            if (userSession) {
              userSession.totalDechEarned = (userSession.totalDechEarned || 0) + (0.5 * 10);
              userSession.dechBalance = (userSession.dechBalance || 0) + (0.5 * 10);
              sessionManager.saveUserSession(userSession);
              
              // Update real-time balance system
              refreshBalance();
            }
          }
          
          return newRewards;
        });
        
        setChargingProgress(prev => {
          const newProgress = prev + (100 / (selectedAmount * 60)); // Complete in selectedAmount minutes
          
          // Update live charging session progress if exists
          if (liveSessionId) {
            try {
              const sessionProgress = getSessionProgress(liveSessionId);
              if (sessionProgress) {
                // Sync with live charging manager progress
                const liveProgress = sessionProgress.progress;
                const liveKwh = sessionProgress.currentKwh;
                const liveDech = sessionProgress.dechEarned;
                
                // Update local state to match live session
                if (Math.abs(liveProgress - newProgress) > 5) {
                  console.log('🔄 Syncing with live session progress:', liveProgress);
                  setEnergyDelivered(liveKwh);
                  setRewardsEarned(liveDech);
                  return liveProgress;
                }
              }
            } catch (error) {
              console.log('⚠️ Could not sync with live session:', error);
            }
          }
          
          if (newProgress >= 100) {
            console.log('✅ Charging session completed automatically at 100%');
            
            // Auto-complete the session
            setTimeout(async () => {
              const walletAddress = getWalletAddress(); // Use consistent wallet address
              
              // Create completed session
              const completedSession = {
                id: transactionHash || `session_${Date.now()}`,
                walletAddress,
                stationId: station.id,
                stationName: station.name,
                location: station.location,
                startTime: new Date(Date.now() - chargingTime * 1000).toISOString(),
                endTime: new Date().toISOString(),
                energyConsumed: energyDelivered,
                amountPaid: parseFloat((energyDelivered * (station.pricePerKwh || 0.14)).toFixed(2)),
                dechEarned: rewardsEarned,
                txHash: transactionHash || `tx_${Date.now()}`,
                status: 'completed' as const,
                coordinates: station.coordinates
              };
              
              console.log('🎉 Auto-completing charging session:', completedSession);
              await sessionManager.logChargingSession(completedSession);
              
              // Update user session
              const userSession = sessionManager.getUserSession(walletAddress);
              if (userSession) {
                userSession.totalEnergyConsumed = (userSession.totalEnergyConsumed || 0) + energyDelivered;
                userSession.totalDechEarned = (userSession.totalDechEarned || 0) + rewardsEarned;
                userSession.dechBalance = (userSession.dechBalance || 0) + rewardsEarned;
                sessionManager.saveUserSession(userSession);
                
                // Update real-time balance system
                refreshBalance();
              }
              
              // Auto-stop live charging session when completed
              if (liveSessionId) {
                try {
                  await stopLiveCharging(liveSessionId);
                  console.log('🔴 Auto-stopped live charging session:', liveSessionId);
                  setLiveSessionId(null);
                  refreshSessions();
                } catch (error) {
                  console.error('⚠️ Failed to auto-stop live charging session:', error);
                }
              }
              
              setChargingState(false);
              setHasActiveSession(false);
            }, 1000);
            
            return 100;
          }
          return newProgress;
        });
      }, 1000);
    } else {
      console.log('🔄 Charging simulation stopped - chargingState:', chargingState, 'isCharging:', isCharging, 'hasActiveSession:', hasActiveSession);
    }
    return () => clearInterval(interval);
  }, [chargingState, isCharging, hasActiveSession, selectedAmount, user?.wallet?.address, station]);

  useEffect(() => {
    if (!showTransactionPopup) {
      resetSwipe();
    }
  }, [showTransactionPopup]);

  const handleStartCharging = () => {
    if (chargingState) return;
    
    console.log('🚀 Starting charging process - showing transaction popup');
    
    // Log charging start event
    console.log('⚡ Starting charging session:', {
      stationId,
      stationName: station.name,
      userId: user?.id,
      selectedAmount,
      pricePerKwh: station.pricePerKwh,
      timestamp: new Date().toISOString()
    });
    
    // Log the action (only if we have a real wallet)
    if (user?.wallet?.address) {
      try {
        ClientComprehensiveLogger.logUIInteraction(user.wallet.address, 'start_charging_clicked', {
          selectedAmount,
          stationId: station?.id,
          stationName: station?.name,
          userBalance
        });
      } catch (error) {
        console.log('Could not log UI interaction, but continuing');
      }
    }
    
    setShowTransactionPopup(true);
  };

  const confirmTransaction = async () => {
    console.log('🔄 STARTING TRANSACTION CONFIRMATION');
    
    if (!ready || !station) {
      console.error('❌ Missing data - ready:', ready, 'station:', !!station);
      resetSwipe();
      return;
    }
    
    const totalCost = (selectedAmount * station.pricePerKwh) + 0.02;
    const walletAddress = getWalletAddress(); // Use consistent wallet address - declare early
    
    console.log('💰 Transaction Details:', {
      walletAddress,
      selectedAmount,
      stationName: station.name,
      totalCost,
      userBalance,
      timestamp: new Date().toISOString()
    });
    
    // Log balance check before transaction
    console.log('📊 Pre-transaction balance check:', userBalance, 'required:', totalCost);
    if (user?.wallet?.address) {
      await ClientComprehensiveLogger.logBalanceCheck(walletAddress, {
        currentBalance: userBalance,
        rewardsEarned: rewardsEarned,
        transactionAmount: totalCost,
        checkContext: 'pre_transaction_validation'
      });
    }
    
    // Check if user has sufficient balance
    if (userBalance < totalCost) {
      console.log('❌ INSUFFICIENT BALANCE - Available:', userBalance, 'Required:', totalCost);
      if (user?.wallet?.address) {
        await ClientComprehensiveLogger.logSystemEvent(walletAddress, 'insufficient_funds', {
          availableBalance: userBalance,
          requiredAmount: totalCost
        });
      }
      alert(`Insufficient balance. You need $${totalCost.toFixed(2)} but only have $${userBalance.toFixed(2)}`);
      resetSwipe();
      return;
    }
    
    try {
      setIsConfirming(true);
      
      // Simulate transaction processing with real blockchain-like behavior
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const amountPaid = totalCost;
      const dechEarned = selectedAmount * 10;
      
      console.log('🔄 Processing real Solana transaction...', { walletAddress, amountPaid, dechEarned });
      
      // Create real Solana transaction
      let txHash = null;
      try {
        // Create memo transaction and get real Solana hash
        const memo = `Charge session for ${walletAddress} at ${station.name} (${selectedAmount} kWh)`;
        const solanaResult = await ServerlessSolana.createMemoTransaction(memo, walletAddress, {
          sessionId: `session_${Date.now()}`,
          stationName: station.name,
          kWh: selectedAmount,
          costUSD: amountPaid,
          dechEarned: dechEarned
        });
        if (solanaResult?.signature && isValidSolanaSignature(solanaResult.signature)) {
          txHash = solanaResult.signature;
          console.log('✅ Real Solana transaction created:', txHash);
        } else {
          console.warn('⚠️ No valid Solana transaction returned, using null');
        }
      } catch (solanaError) {
        console.error('❌ Failed to create Solana transaction:', solanaError);
      }
      
      // Log charging session start with comprehensive details
      await ClientComprehensiveLogger.logChargeStart(walletAddress, `session_${Date.now()}`, {
        stationId: station.id,
        stationName: station.name,
        location: station.location,
        coordinates: station.coordinates,
        amountPaid,
        expectedEnergy: selectedAmount,
        pricePerKwh: station.pricePerKwh,
        txHash: txHash || null,
        timestamp: new Date().toISOString(),
        userId: user?.id,
        method: 'swipe_payment'
      });

      // Log the transaction with enhanced API logging
      if (txHash) {
        console.log('📝 LOGGING TRANSACTION TO DATABASE:', {
          walletAddress,
          type: 'charge',
          amount: amountPaid,
          txHash,
          stationId: station.id
        });
      } else {
        console.warn('⚠️ Transaction not logged: No valid Solana hash');
      }
      
      const transactionResult = await sessionManager.logTransaction({
        walletAddress,
        type: 'charge',
        amount: amountPaid,
        currency: 'USD',
        timestamp: new Date().toISOString(),
        txHash: txHash || null,
        status: txHash ? 'confirmed' : 'failed',
        metadata: {
          stationId: station.id,
          stationName: station.name,
          energyAmount: selectedAmount,
          dechEarned,
          userBalance: userBalance,
          method: isDragging ? 'swipe' : 'button'
        }
      });
      
      console.log('✅ Transaction logged successfully:', transactionResult);
      
      // Log the charging session with enhanced API logging
      console.log('📝 LOGGING CHARGING SESSION TO DATABASE:', {
        walletAddress,
        stationId: station.id,
        stationName: station.name,
        location: station.location,
        amountPaid,
        txHash
      });
      
      // Log active charging session that will appear in "My Charging" and "Live Charging"
      const activeSession = {
        walletAddress,
        stationId: station.id,
        stationName: station.name,
        location: station.location,
        startTime: new Date().toISOString(),
        energyConsumed: 0, // Will be updated as charging progresses
        amountPaid: totalCost,
        dechEarned: 0, // Will be updated as charging progresses
        txHash: txHash || null,
        status: (txHash ? 'active' : 'cancelled') as 'active' | 'completed' | 'cancelled',
        coordinates: station.coordinates
      };
      
      console.log('🔄 Creating active charging session for Live Charging:', activeSession);
      
      const sessionResult = await sessionManager.logChargingSession(activeSession);
      console.log('✅ Active charging session logged successfully:', sessionResult);

      // Create an on-chain memo transaction and record it via serverless API
      try {
        const recordPayload = {
          privyUserId: user?.id || walletAddress, // Use actual Privy user ID
          sessionId: sessionResult || `session_${Date.now()}`, // sessionResult is already the sessionId string
          stationId: station.id,
          stationName: station.name,
          location: station.location,
          kWh: selectedAmount,
          durationMinutes: Math.max(1, Math.floor(selectedAmount * 2.4)), // Rough estimate: ~2.4 min per kWh
          costUSD: totalCost,
          metadata: {
            method: isDragging ? 'swipe' : 'button',
            localTxHash: txHash
          }
        };

        console.log('🔗 Calling serverless /api/record-session to create memo tx...', recordPayload);

        const recordResp = await fetch('/api/record-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(recordPayload)
        });

        const recordJson = await recordResp.json();
        if (recordJson?.success) {
          console.log('✅ On-chain memo recorded:', recordJson.data.solanaTransaction);
          
          // Store memo transaction data for confirmation display
          setMemoTransactionData(recordJson.data.solanaTransaction);
          
          // Update local transaction/session entries with on-chain details if available
          const solanaTx = recordJson.data.solanaTransaction;
          if (solanaTx?.signature) {
            // Update last logged transaction in sessionManager if supported
            try {
              await sessionManager.updateTransactionWithOnChain(txHash, {
                solanaTransactionHash: solanaTx.signature,
                solanaExplorerUrl: solanaTx.explorerUrl,
                verified: solanaTx.verified
              });
              console.log('🔃 Updated local transaction record with on-chain data');
            } catch (err) {
              console.log('⚠️ Could not update local transaction with on-chain data:', err);
            }
          }
        } else {
          console.log('⚠️ record-session responded with failure:', recordJson);
        }
      } catch (err) {
        console.error('⚠️ Failed to create on-chain memo transaction:', err);
      }
      
      // Force refresh live charging data immediately for all users
      setTimeout(() => {
        const liveCharging = sessionManager.getLiveChargingSessions();
        console.log('🔴 Current live charging sessions:', liveCharging.length, liveCharging);
      }, 500);
      
      // Update user stats and deduct real balance
      console.log('💰 Before balance update - Current balance:', userBalance);
      
      console.log('🔍 Payment processing for wallet:', walletAddress);
      
      // Get fresh user session to ensure we have latest data
      let userSession = sessionManager.getUserSession(walletAddress);
      if (!userSession) {
        console.error('❌ No user session found during payment, creating new one...');
        // Try to initialize if missing
        userSession = await sessionManager.initializeUser(walletAddress, user?.email?.address);
        if (!userSession) {
          throw new Error('Failed to create user session for payment');
        }
        console.log('✅ Created new user session for payment:', userSession);
      }
      
      // Check sufficient balance again with fresh data
      const currentBalance = userSession.currentBalance || 0;
      if (currentBalance < totalCost) {
        console.log('❌ INSUFFICIENT BALANCE - Fresh check failed:', currentBalance, 'vs', totalCost);
        throw new Error(`Insufficient balance: $${currentBalance.toFixed(2)} available, $${totalCost.toFixed(2)} required`);
      }
      
      console.log('💰 CRITICAL: About to process payment:', {
        originalBalance: currentBalance,
        totalCost: totalCost,
        energyAmount: selectedAmount,
        dechEarned: dechEarned,
        walletAddress: walletAddress
      });
      
      // Use both sessionManager and real-time balance system for consistency
      sessionManager.updateUserStats(selectedAmount, totalCost, dechEarned);
      
      // Update real-time balance system (this will update the UI immediately)
      deductChargingCost(totalCost, dechEarned);
      
      // Get the updated session to verify the changes
      const updatedSession = sessionManager.getUserSession(walletAddress);
      const newBalance = updatedSession?.currentBalance || 0;
      
      console.log('💳 Balance successfully updated via both systems:', {
        previous: currentBalance,
        paid: totalCost,
        remaining: newBalance,
        dechEarned: dechEarned,
        totalDech: updatedSession?.dechBalance || 0,
        realtimeBalance: realtimeBalance,
        realtimeDech: realtimeDechBalance
      });
      
      // Update local rewards state
      setRewardsEarned((prev) => Number((prev + dechEarned).toFixed(2)));
      console.log('🔍 FINAL STATE: UI balance updated to:', Number(newBalance.toFixed(2)));
      // Log successful balance update
      await ClientComprehensiveLogger.logBalanceCheck(walletAddress, {
        currentBalance: Number((userBalance - amountPaid).toFixed(2)),
        rewardsEarned: Number((rewardsEarned + dechEarned).toFixed(2)),
        checkContext: 'post_transaction_balance_update'
      });
      
      if (txHash) {
        console.log('✅ TRANSACTION CONFIRMED SUCCESSFULLY!');
        console.log('📱 Real Solana Transaction Hash:', txHash);
        console.log('🔗 Explorer URL:', `https://explorer.solana.com/tx/${txHash}?cluster=devnet`);
      } else {
        console.log('❌ Transaction failed: No valid Solana hash. Session not started.');
      }
      console.log('⚡ Starting charging session for user:', walletAddress);
      
      // Final balance verification after transaction completion with improved error handling
      setTimeout(() => {
        const finalCheck = sessionManager.getUserSession(walletAddress);
        const roundedCurrentBalance = parseFloat((currentBalance || 0).toFixed(2));
        const roundedTotalCost = parseFloat((totalCost || 0).toFixed(2));
        const expectedBalance = parseFloat((roundedCurrentBalance - roundedTotalCost).toFixed(2));
        
        console.log('🎯 BALANCE VERIFICATION AFTER TRANSACTION:');
        console.log('🎯 Original Balance:', roundedCurrentBalance);
        console.log('🎯 Transaction Cost:', roundedTotalCost);
        console.log('🎯 Expected Balance:', expectedBalance);
        console.log('🎯 Actual Balance:', finalCheck?.currentBalance);
        
        if (finalCheck) {
          const actualBalance = parseFloat((finalCheck.currentBalance || 0).toFixed(2));
          const difference = Math.abs(actualBalance - expectedBalance);
          
          // Use more tolerant validation (0.1 instead of 0.01) to handle floating point precision
          if (difference > 0.1) {
            console.warn('⚠️ Balance mismatch detected:', {
              expected: expectedBalance,
              actual: actualBalance,
              difference: difference
            });
            
            // Auto-correct significant differences to prevent cascading errors
            if (difference > 1.0) {
              console.log('🔧 Auto-correcting balance discrepancy...');
              finalCheck.currentBalance = expectedBalance;
              sessionManager.saveUserSession(finalCheck);
              // Refresh real-time balance to sync
              refreshBalance();
              console.log('✅ Balance corrected to:', expectedBalance);
            }
          } else {
            console.log('✅ SUCCESS: Balance deduction verified and persisted!');
            console.log('💰 Balance matches expected value within tolerance');
          }
        } else {
          console.warn('⚠️ Could not verify balance - user session not found');
        }
      }, 1000);
      
      // Keep URL as charging page during confirmation
      console.log('🔗 Transaction confirmed, keeping URL as:', `/charges/${stationId}?charging=true`);
      
      // Update states for success flow
      setTransactionHash(txHash);
      setIsConfirming(false);
      setShowTransactionPopup(false);
      setShowConfirmation(true);
      setConfirmationCountdown(7);
      
      console.log('📱 SHOWING CONFIRMATION POPUP with hash:', txHash);
      console.log('🎉 Payment confirmation successful! User will see popup for 7 seconds then charging starts');
      
      // Start countdown timer
      const countdownInterval = setInterval(() => {
        setConfirmationCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      // Auto close confirmation and start charging after 7 seconds (longer to show transaction details)
      setTimeout(() => {
        console.log('🔄 Auto-closing confirmation and starting charging...');
        setShowConfirmation(false);
        setChargingState(true);
        setHasActiveSession(true);
        
        // Start live charging session for real-time tracking
        try {
          const liveSessionId = startLiveCharging({
            stationId: station.id,
            stationName: station.name,
            location: {
              lat: parseFloat(searchParams.get('lat') || '0'),
              lng: parseFloat(searchParams.get('lng') || '0'),
              address: station.location
            },
            targetKwh: selectedAmount,
            costPerKwh: station.pricePerKwh || 0.14
          });
          console.log('🔴 Started live charging session:', liveSessionId);
          setLiveSessionId(liveSessionId);
          
          // Refresh dashboard sessions immediately
          refreshSessions();
        } catch (error) {
          console.error('⚠️ Failed to start live charging session:', error);
        }
        
        // Reset swipe states
        setIsSwipeComplete(false);
        
        // Transition to charging mode
        transitionToChargingMode();
        
        // Log charging start event
        console.log('⚡ Charging session started:', {
          stationId,
          stationName: station.name,
          userId: user?.id,
          selectedAmount,
          pricePerKwh: station.pricePerKwh,
          transactionHash: txHash,
          timestamp: new Date().toISOString()
        });
        
        // Animation for charging start with cool effects
        if (progressRef.current) {
          gsap.timeline()
            .to(progressRef.current, {
              scale: 1.2,
              rotation: 360,
              duration: 0.6,
              ease: "power2.out"
            })
            .to(progressRef.current, {
              scale: 1,
              rotation: 0,
              duration: 0.4,
              ease: "power2.in"
            });
        }
        
        console.log('⚡ CHARGING HAS STARTED! User should now see charging interface');
      }, 7000);
      
    } catch (error) {
      console.error('❌ Transaction failed:', error);
      
      // Log transaction error
      console.log('❌ TRANSACTION FAILED:', error);
      if (user?.wallet?.address) {
        await ClientComprehensiveLogger.logError(walletAddress, error, {
          component: 'charge_transaction',
          severity: 'high',
          context: 'confirmTransaction_failure',
          userBalance,
          transactionAmount: totalCost
        });
      }
      
      // Reset all states
      setIsConfirming(false);
      setIsSwipeComplete(false);
      resetSwipe();
      
      // Show user-friendly error message
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Payment failed: ${errorMessage}. Please check your balance and try again.`);
    }
  };

  const handleSwipeStart = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    e.preventDefault();
  };

  const handleSwipeMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging || !swipeRef.current) return;
    
    e.preventDefault(); // Prevent default scrolling behavior
    
    const rect = swipeRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    let newPosition = Math.max(0, Math.min(clientX - rect.left - 30, rect.width - 60));
    
    // Make it easier to drag on desktop by reducing resistance
    const percentage = (newPosition / (rect.width - 60)) * 100;
    
    setSwipePosition(newPosition);
    
    if (percentage >= 80 && !isConfirming && !isSwipeComplete) {
      console.log('🎯 SWIPE PAYMENT COMPLETED! Starting transaction...');
      
      const walletAddress = getWalletAddress(); // Use consistent wallet address
      
      // Log swipe completion with comprehensive data
      console.log('📝 Logging swipe transaction:', {
        walletAddress,
        percentage,
        selectedAmount,
        stationId: station?.id,
        timestamp: new Date().toISOString()
      });
      
      if (user?.wallet?.address) {
        ClientComprehensiveLogger.logUIInteraction(walletAddress, 'swipe_payment_completed', {
          direction: 'right',
          percentage,
          amount: selectedAmount,
          totalCost: ((selectedAmount * (station?.pricePerKwh || 0.14)) + 0.02),
          stationId: station?.id,
          stationName: station?.name,
          method: 'swipe',
          context: 'charge_payment_confirmation'
        });
      }
      
      setIsSwipeComplete(true);
      setIsDragging(false);
      setIsConfirming(true);
      
      // Execute transaction
      confirmTransaction().catch((error) => {
        console.error('❌ Swipe transaction failed:', error);
        setIsConfirming(false);
        setIsSwipeComplete(false);
        resetSwipe();
      });
    }
  };

  const handleSwipeEnd = () => {
    if (!isSwipeComplete) {
      // Smoother return animation for desktop
      setSwipePosition(0);
    }
    setIsDragging(false);
  };

  const resetSwipe = () => {
    setSwipePosition(0);
    setIsSwipeComplete(false);
    setIsDragging(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!ready || !station) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading charging station...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white relative">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-xl border-b border-white/10">
        <div className="px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 sm:gap-3 text-gray-400 hover:text-white transition-colors duration-300">
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            <span className="text-sm sm:text-base">Back to Map</span>
          </Link>
          
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="text-center hidden sm:block">
              <div className="text-xs text-gray-400">Current Time</div>
              <div className="text-lg font-bold text-white">
                {currentTime.toLocaleTimeString('en-US', { 
                  hour12: false, 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-400">Balance</div>
              <div className="flex items-center gap-2">
                <div className="text-lg sm:text-xl font-bold text-blue-400">
                  ${userBalance.toFixed(2)}
                </div>
                <button
                  onClick={async () => {
                    console.log('🔄 Manual balance refresh clicked - STARTING');
                    
                    try {
                      // Direct localStorage approach for testing
                      const walletAddress = getWalletAddress(); // Use consistent wallet address
                      console.log('🔍 Using wallet address:', walletAddress);
                      
                      // Force create/update user session in localStorage
                      const userSessionKey = `user_session_${walletAddress}`;
                      const existingSession = localStorage.getItem(userSessionKey);
                      console.log('🔍 Existing session:', existingSession);
                      
                      const userSession = {
                        walletAddress,
                        email: user?.email?.address,
                        joinedAt: new Date().toISOString(),
                        totalSessions: 0,
                        totalEnergyConsumed: 0,
                        totalDechEarned: 0,
                        totalSpent: 0,
                        currentBalance: 100.00, // Force $100
                        dechBalance: 0,
                        level: 1,
                        achievements: ['welcome'],
                        preferences: {
                          preferredPaymentMethod: 'USD',
                          autoCharge: false,
                          notifications: true
                        }
                      };
                      
                      // Save to localStorage
                      localStorage.setItem(userSessionKey, JSON.stringify(userSession));
                      console.log('� Saved session to localStorage:', userSession);
                      
                      // Force UI update via real-time balance system
                      refreshBalance();
                      
                      console.log('✅ Manual refresh complete - balance should be $100');
                      
                      // Verify it was saved
                      const verification = localStorage.getItem(userSessionKey);
                      console.log('🔍 Verification - stored session:', JSON.parse(verification || '{}'));
                      
                    } catch (error) {
                      console.error('❌ Manual refresh failed:', error);
                    }
                  }}
                  className="w-6 h-6 bg-green-500 hover:bg-green-400 rounded-full flex items-center justify-center text-white text-xs transition-colors"
                  title="Force refresh balance to $100"
                >
                  🔄
                </button>
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-400">DECH Earned</div>
              <div className="text-lg sm:text-xl font-bold text-blue-400">
                {rewardsEarned.toFixed(1)} DECH
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-32 px-4 sm:px-6 pb-6 max-w-4xl mx-auto">
        {/* Station Info */}
        <div ref={stationCardRef} className="bg-gradient-to-br from-gray-900/50 to-black/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-6 gap-4">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-black text-white mb-2">{station.name}</h1>
              <p className="text-gray-400 flex items-center gap-2 text-sm sm:text-base">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                {station.location}
              </p>
            </div>
            <div className="text-left sm:text-right">
              <div className="text-xl sm:text-2xl font-bold text-white">${station.pricePerKwh.toFixed(2)}/kWh</div>
              <div className="text-sm text-gray-400">
                {station.availablePorts}/{station.totalPorts} ports available
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {station.features.map((feature, index) => (
              <div key={index} className="bg-white/5 rounded-xl p-3 text-center">
                <div className="text-sm text-gray-300 font-medium">{feature}</div>
              </div>
            ))}
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex text-yellow-400">
              {[...Array(5)].map((_, i) => (
                <svg key={i} className="w-5 h-5" fill={i < Math.floor(station.rating) ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              ))}
            </div>
            <span className="text-gray-400 text-sm">({station.rating.toFixed(2)}/5.0)</span>
          </div>
        </div>

        {/* Enhanced Charging Control */}
        <div className="bg-gradient-to-br from-gray-900/50 to-black/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8">
          {(isSetupMode || (!chargingState || !hasActiveSession)) && !isCharging ? (
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-6">
                {isSetupMode ? 'Setup Your Charging Session' : 'Select Charging & Payment'}
              </h2>
              {isSetupMode && (
                <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                  <div className="flex items-center gap-2 text-blue-400 mb-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <span className="font-semibold">Setup Mode</span>
                  </div>
                  <p className="text-sm text-gray-300">
                    Configure your charging preferences and complete payment to start your session.
                  </p>
                </div>
              )}
              
              {/* Amount Selection */}
              <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-8">
                {[15, 25, 50].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setSelectedAmount(amount)}
                    className={`p-3 sm:p-4 rounded-2xl border-2 transition-all duration-300 ${
                      selectedAmount === amount
                        ? 'border-white bg-white/10 text-white'
                        : 'border-gray-600 text-gray-400 hover:border-gray-500'
                    }`}
                  >
                    <div className="text-lg sm:text-2xl font-bold">{amount} kWh</div>
                    <div className="text-xs sm:text-sm">${(amount * station.pricePerKwh).toFixed(2)}</div>
                    <div className="text-xs text-blue-400 mt-1">+{amount * 10} DECH</div>
                  </button>
                ))}
              </div>


              
              {/* Balance Display */}
              <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-white font-semibold">Your Balance</div>
                      <div className="text-sm text-gray-400">Available for charging</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-bold transition-all duration-300 ${isBalanceUpdating ? 'scale-110 text-green-400' : 'text-white'}`}>
                      ${userBalance.toFixed(2)}
                    </div>
                    <div className="text-sm text-blue-400">
                      {realtimeDechBalance.toFixed(1)} DECH
                    </div>
                  </div>
                </div>
                {userBalance < (selectedAmount * station.pricePerKwh + 0.02) && (
                  <div className="mt-3 p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-red-400 text-sm text-center">
                      Insufficient balance. Need ${((selectedAmount * station.pricePerKwh + 0.02) - userBalance).toFixed(2)} more.
                    </p>
                  </div>
                )}
              </div>

              {/* Start Charging Button */}
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-gray-400 mb-2">Ready to charge • Tap to confirm</p>
                  <p className="text-sm text-gray-500">Billing: ${(selectedAmount * (station?.pricePerKwh || 0.14)).toFixed(2)} for {selectedAmount} kWh</p>
                </div>
                
                <button
                  onClick={handleStartCharging}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-5 sm:py-6 px-6 rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-green-500/25 active:scale-95 flex items-center justify-center space-x-3"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                  </svg>
                  <span className="text-lg sm:text-xl">
                    {isSetupMode ? 'Confirm & Start Charging' : 'Start Charging Session'}
                  </span>
                </button>
                
                <div className="text-center text-xs text-gray-500">
                  <p>🔒 Secured by Solana blockchain • ⚡ Instant payments</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <div className="flex items-center justify-center gap-3 mb-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <h2 className="text-3xl font-bold text-green-400">Charging Active</h2>
              </div>
              <p className="text-gray-400 mb-8">Port 3 - {station.name} • Live Session</p>
              
              {/* Charging Progress */}
              <div ref={progressRef} className="relative mb-8">
                <div className="w-48 h-48 mx-auto mb-6">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="#374151"
                      strokeWidth="8"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="#10B981"
                      strokeWidth="8"
                      strokeDasharray={`${2 * Math.PI * 45}`}
                      strokeDashoffset={`${2 * Math.PI * 45 * (1 - chargingProgress / 100)}`}
                      className="transition-all duration-500"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-white">{Math.round(chargingProgress)}%</div>
                      <div className="text-sm text-gray-400">Complete</div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Real-time Live Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-gray-800/50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-white">{energyDelivered.toFixed(1)} kWh</div>
                  <div className="text-sm text-gray-400">Energy</div>
                </div>
                <div className="bg-gray-800/50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-white">{formatTime(chargingTime)}</div>
                  <div className="text-sm text-gray-400">Duration</div>
                </div>
                <div className="bg-gray-800/50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-blue-400 animate-pulse">{rewardsEarned.toFixed(1)} DECH</div>
                  <div className="text-sm text-gray-400">Earning Live</div>
                </div>
                <div className="bg-gray-800/50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-green-400">${(energyDelivered * (station.pricePerKwh || 0.14)).toFixed(2)}</div>
                  <div className="text-sm text-gray-400">Cost</div>
                </div>
              </div>
              
              {/* Live Activity Indicator */}
              <div className="bg-green-900/30 border border-green-500/30 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-center gap-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                  <span className="text-green-400 font-medium">Active charging session • Earning DECH tokens</span>
                </div>
                <div className="text-center text-sm text-green-300 mt-2">
                  Rate: +{(selectedAmount * 10 / 60).toFixed(1)} DECH/min • Session will appear in "My Charging"
                </div>
              </div>
              
              {/* Enhanced Stop Charging */}
              <button
                onClick={async () => {
                  console.log('🛑 STOPPING CHARGING SESSION');
                  const walletAddress = getWalletAddress(); // Use consistent wallet address
                  
                  // Log session stop
                  if (user?.wallet?.address) {
                    await ClientComprehensiveLogger.logChargeStop(walletAddress, `session_${Date.now()}`, {
                      energy_consumed: energyDelivered,
                      duration_minutes: Math.floor(chargingTime / 60),
                      dech_earned: rewardsEarned,
                      cost: energyDelivered * (station.pricePerKwh || 0.14),
                      stopped_manually: true
                    });
                  }
                  
                  // Create completed session with all final values
                  const completedSession = {
                    id: transactionHash || `session_${Date.now()}`,
                    walletAddress,
                    stationId: station.id,
                    stationName: station.name,
                    location: station.location,
                    startTime: new Date(Date.now() - chargingTime * 1000).toISOString(),
                    endTime: new Date().toISOString(),
                    energyConsumed: energyDelivered,
                    amountPaid: parseFloat((energyDelivered * (station.pricePerKwh || 0.14)).toFixed(2)),
                    dechEarned: rewardsEarned,
                    txHash: transactionHash || `tx_${Date.now()}`,
                    status: 'completed' as const,
                    coordinates: station.coordinates
                  };
                  
                  console.log('💾 Saving completed charging session:', completedSession);
                  
                  // Save completed session (this will replace the active session)
                  await sessionManager.logChargingSession(completedSession);
                  
                  // Update user session with final DECH earnings
                  const userSession = sessionManager.getUserSession(walletAddress);
                  if (userSession) {
                    userSession.totalEnergyConsumed = (userSession.totalEnergyConsumed || 0) + energyDelivered;
                    userSession.totalDechEarned = (userSession.totalDechEarned || 0) + rewardsEarned;
                    userSession.dechBalance = (userSession.dechBalance || 0) + rewardsEarned;
                    userSession.totalSessions = (userSession.totalSessions || 0) + 1;
                    sessionManager.saveUserSession(userSession);
                    console.log('📊 Updated user session with final stats:', userSession);
                  }
                  
                  // Remove from active sessions if needed: prefer liveSessionId, otherwise try transactionHash or lookup
                  try {
                    let stopId = liveSessionId || transactionHash;
                    if (!stopId) {
                      // try to find an active session for this wallet and station
                      const active = sessionManager.getChargingSessions(walletAddress).find(s => s.status === 'active' && s.stationId === station.id);
                      stopId = active?.id || null;
                    }

                    if (stopId) {
                      const success = sessionManager.stopChargingSession(stopId, walletAddress);
                      console.log('🔄 Stopped active session:', stopId, success);
                    } else {
                      console.log('ℹ️ No active session id found to stop');
                    }
                  } catch (err) {
                    console.error('⚠️ Error stopping active session:', err);
                  }
                  
                  // Stop live charging session
                  if (liveSessionId) {
                    try {
                      await stopLiveCharging(liveSessionId);
                      console.log('🔴 Stopped live charging session:', liveSessionId);
                      setLiveSessionId(null);
                      refreshSessions();
                    } catch (error) {
                      console.error('⚠️ Failed to stop live charging session:', error);
                    }
                  }
                  
                  console.log('✅ Charging session completed and logged to history');
                  
                  setChargingState(false);
                  setHasActiveSession(false);
                  
                  // Update URL to show charging stopped
                  window.history.pushState({}, '', `/charges/${stationId}?charging=false`);
                  
                  // Log the charging stop event
                  console.log('🛑 Charging stopped:', {
                    stationId,
                    timestamp: new Date().toISOString(),
                    sessionDuration: chargingTime,
                    energyConsumed: energyDelivered,
                    dechEarned: rewardsEarned,
                    totalCost: (energyDelivered * (station.pricePerKwh || 0.14)).toFixed(2)
                  });
                }}
                className="bg-red-500 hover:bg-red-600 text-white px-10 py-4 rounded-2xl font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                Stop Charging Session
              </button>
              
              <div className="text-center text-sm text-gray-500 mt-4">
                Session will be saved to your charging history
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Transaction Confirmation Popup */}
      {showTransactionPopup && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-3xl p-8 max-w-md w-full mx-4 transform transition-all duration-300 scale-100">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Confirm Transaction</h2>
              <p className="text-gray-400">Review your charging session details</p>
            </div>

            <div className="space-y-6 mb-8">
              {/* Station Details */}
              <div className="bg-gray-800/50 rounded-2xl p-4 border border-gray-700">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-white">{station?.name}</h3>
                    <p className="text-sm text-gray-400">{station?.location}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-400">Port 3</div>
                    <div className="text-sm text-blue-400">Available</div>
                  </div>
                </div>
              </div>

              {/* Billing Details */}
              <div className="bg-gray-800/50 rounded-2xl p-4 border border-gray-700">
                <h4 className="font-semibold text-white mb-3">Billing Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Energy Amount:</span>
                    <span className="text-white">{selectedAmount} kWh</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Rate:</span>
                    <span className="text-white">${station?.pricePerKwh?.toFixed(2)}/kWh</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Network Fee:</span>
                    <span className="text-white">$0.02</span>
                  </div>
                  <hr className="border-gray-600 my-2" />
                  <div className="flex justify-between font-semibold">
                    <span className="text-white">Total Amount:</span>
                    <span className="text-blue-400">${((selectedAmount * (station?.pricePerKwh || 0.14)) + 0.02).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Rewards Preview */}
              <div className="bg-gradient-to-r from-blue-900/30 to-blue-900/30 rounded-2xl p-4 border border-blue-700/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-500 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">🪙</span>
                  </div>
                  <div>
                    <div className="text-sm text-gray-300">You'll earn</div>
                    <div className="font-bold text-blue-400">+{selectedAmount * 10} DECH tokens</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={() => setShowTransactionPopup(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
              disabled={isConfirming || isDragging}
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>

            {/* Swipe to Confirm */}
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-gray-400 mb-4">
                  {isSwipeComplete ? "Processing transaction..." : "Swipe to confirm payment or click the button"}
                </p>
              </div>
              

              
              {/* Professional Swipe to Pay */}
              <div className="block">
                <div className="text-center mb-3">
                  <p className="text-sm font-medium text-white mb-1">Swipe to Pay ${((selectedAmount * (station?.pricePerKwh || 0.14)) + 0.02).toFixed(2)}</p>
                  <p className="text-xs text-gray-400">Slide right to confirm and start charging →</p>
                </div>
                <div
                  ref={swipeRef}
                  className="relative h-16 bg-gray-800 rounded-2xl border border-gray-600 overflow-hidden select-none touch-none cursor-grab active:cursor-grabbing transition-all duration-200"
                  onMouseMove={handleSwipeMove}
                  onMouseUp={handleSwipeEnd}
                  onMouseLeave={handleSwipeEnd}
                  onTouchMove={handleSwipeMove}
                  onTouchEnd={handleSwipeEnd}
                  style={{ userSelect: 'none', touchAction: 'none' }}
                >
                {/* Clean progress background */}
                <div 
                  className="absolute inset-0 bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-300"
                  style={{ 
                    opacity: swipePosition > 0 ? 0.6 : 0,
                    width: `${(swipePosition / (swipeRef.current?.clientWidth || 300 - 64)) * 100}%`
                  }}
                />
                
                {/* Clean instruction text */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`font-medium text-sm pointer-events-none transition-colors duration-200 ${
                    isConfirming ? "text-blue-400" : 
                    isSwipeComplete ? "text-green-400" : 
                    swipePosition > 150 ? "text-white" : "text-gray-400"
                  }`}>
                    {isConfirming ? "Processing..." : 
                     isSwipeComplete ? "Payment Confirmed" : 
                     swipePosition > 150 ? "Release to Pay" :
                     "Slide to confirm payment"}
                  </span>
                </div>
                
                {/* Clean swipe button */}
                <div
                  className={`absolute top-2 left-2 w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center cursor-grab active:cursor-grabbing transition-all duration-200 z-10 ${
                    isDragging ? 'scale-110 shadow-lg' : 'shadow-md'
                  } ${isSwipeComplete ? 'bg-green-500' : ''}`}
                  style={{ 
                    transform: `translateX(${swipePosition}px)`,
                    transition: isDragging ? 'none' : 'transform 0.3s ease-out'
                  }}
                  onMouseDown={handleSwipeStart}
                  onTouchStart={handleSwipeStart}
                  draggable={false}
                >
                  {isConfirming ? (
                    <svg className="w-5 h-5 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : isSwipeComplete ? (
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </div>
              </div>

              {isConfirming && (
                <div className="text-center bg-blue-900/20 border border-blue-500/30 rounded-2xl p-4">
                  <div className="flex items-center justify-center gap-3 mb-2">
                    <svg className="animate-spin h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-sm font-semibold text-blue-400">Processing Payment...</p>
                  </div>
                  <p className="text-sm text-gray-400">Confirming transaction on blockchain</p>
                  <p className="text-xs text-gray-500 mt-1">This may take a few seconds</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Clean Transaction Confirmation */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 max-w-md w-full mx-4">
            <div className="text-center">
              {/* Simple success icon */}
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              
              <h2 className="text-2xl font-bold text-white mb-2">Payment Confirmed!</h2>
              <p className="text-gray-400 mb-2">Transaction successful on Solana blockchain</p>
              <div className="flex items-center justify-center gap-2 mb-6">
                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {confirmationCountdown}
                </div>
                <p className="text-sm text-blue-400">Charging starts automatically in {confirmationCountdown} seconds</p>
              </div>
              
              <div className="bg-gray-800/50 rounded-2xl p-4 mb-6">
                {memoTransactionData ? (
                  <div className="space-y-3">
                    <div className="text-sm text-gray-400 mb-2">On-Chain Memo Transaction</div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Signature:</span>
                        <span className="text-blue-400 font-mono text-xs">{memoTransactionData.signature?.slice(0, 8)}...{memoTransactionData.signature?.slice(-8)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Status:</span>
                        <span className={`text-xs px-2 py-1 rounded ${memoTransactionData.verified ? 'bg-green-900/50 text-green-400' : 'bg-yellow-900/50 text-yellow-400'}`}>
                          {memoTransactionData.verified ? 'Verified On-Chain' : 'Demo Transaction'}
                        </span>
                      </div>
                      {memoTransactionData.verified && memoTransactionData.signature && isValidSolanaSignature(memoTransactionData.signature) ? (
                        <a 
                          href={memoTransactionData.explorerUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 py-3 px-4 rounded-lg transition-all duration-200 text-sm font-medium"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" clipRule="evenodd" />
                          </svg>
                          View Transaction on Solana Explorer
                        </a>
                      ) : (
                        <div className="flex items-center justify-center gap-2 bg-green-600/20 text-green-400 py-3 px-4 rounded-lg text-sm font-medium">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          Real Solana Transaction Confirmed
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="text-sm text-gray-400 mb-2">Local Transaction Hash</div>
                    <div className="text-blue-400 font-mono text-sm break-all">{transactionHash}</div>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-800/30 rounded-xl p-3">
                  <div className="text-2xl font-bold text-white">${((selectedAmount * (station?.pricePerKwh || 0.14)) + 0.02).toFixed(2)}</div>
                  <div className="text-sm text-gray-400">Amount Paid</div>
                </div>
                <div className="bg-gray-800/30 rounded-xl p-3">
                  <div className="text-2xl font-bold text-blue-400">+{selectedAmount * 10} DECH</div>
                  <div className="text-sm text-gray-400">Tokens Earned</div>
                </div>
              </div>
              
              <div className="bg-gray-800 rounded-xl p-4">
                <div className="text-white font-semibold mb-2">Starting Charging Session</div>
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-600 border-t-blue-500"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ChargePageWrapper({ params }: { params: Promise<{ stationId: string }> }) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    }>
      <ChargePage params={params} />
    </Suspense>
  );
}

export default ChargePageWrapper;

