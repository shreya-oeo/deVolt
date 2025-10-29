// User Session Management with Local Storage
import { ClientComprehensiveLogger } from './clientLogger';

export interface UserSession {
  walletAddress: string;
  email?: string;
  joinedAt: string;
  totalSessions: number;
  totalEnergyConsumed: number;
  totalDechEarned: number;
  totalSpent: number;
  currentBalance: number; // USD balance
  dechBalance: number; // DECH token balance
  level: number;
  achievements: string[];
  preferences: {
    preferredPaymentMethod: string;
    autoCharge: boolean;
    notifications: boolean;
  };
}

export interface ChargingSession {
  id: string;
  walletAddress: string;
  stationId: string;
  stationName: string;
  location: string;
  startTime: string;
  endTime?: string;
  energyConsumed: number;
  amountPaid: number;
  dechEarned: number;
  txHash: string;
  status: 'active' | 'completed' | 'cancelled';
  coordinates: { lat: number; lng: number };
}

export interface TransactionLog {
  id: string;
  _id?: string;
  privyUserId?: string;
  sessionId?: string;
  walletAddress: string;
  type: 'charge' | 'purchase' | 'withdrawal' | 'reward';
  amount: number;
  currency: 'USD' | 'SOL' | 'DECH';
  timestamp: string;
  description?: string;
  memo?: string;
  txHash: string;
  solanaTransactionHash?: string;
  solanaExplorerUrl?: string;
  blockHash?: string;
  status: 'pending' | 'confirmed' | 'failed';
  verified?: boolean;
  stationName?: string;
  costUSD?: number;
  kWh?: number;
  metadata?: {
    onChainMemo?: string;
    kWh?: number;
    durationMinutes?: number;
    dechEarned?: number;
    stationId?: string;
    stationName?: string;
    location?: any;
    sessionHash?: string;
    energyRate?: string;
    dechRate?: string;
    [key: string]: any;
  };
}

class UserSessionManager {
  private static instance: UserSessionManager;
  private currentUser: UserSession | null = null;
  
  private constructor() {
    // No longer need to initialize logger instance
  }
  
  static getInstance(): UserSessionManager {
    if (!UserSessionManager.instance) {
      UserSessionManager.instance = new UserSessionManager();
    }
    return UserSessionManager.instance;
  }
  
  // Enhanced user initialization with comprehensive logging
  async initializeUser(walletAddress: string, email?: string): Promise<UserSession> {
    const existingUser = this.getUserSession(walletAddress);
    
    if (existingUser) {
      // Ensure all existing users have at least $100 demo balance for continued testing
      if (existingUser.currentBalance < 100) {
        console.log('💰 Topping up user balance from', existingUser.currentBalance, 'to $100');
        existingUser.currentBalance = 100.00;
        this.saveUserSession(existingUser);
      }
      
      this.currentUser = existingUser;
      
      // Log returning user login
      await ClientComprehensiveLogger.logLogin(walletAddress, {
        source: 'privy_auth', 
        email, 
        isReturningUser: true,
        timestamp: new Date() 
      });

      // Log balance check for returning user
      await ClientComprehensiveLogger.logBalanceCheck(walletAddress, {
        currentBalance: existingUser.currentBalance,
        dechBalance: existingUser.dechBalance,
        checkContext: 'returning_user_login'
      });

      return existingUser;
    }
    
    // Create new user
    const newUser: UserSession = {
      walletAddress,
      email,
      joinedAt: new Date().toISOString(),
      totalSessions: 0,
      totalEnergyConsumed: 0,
      totalDechEarned: 0,
      totalSpent: 0,
      currentBalance: 100.00, // $100 demo balance for all new users
      dechBalance: 0,
      level: 1,
      achievements: ['welcome'],
      preferences: {
        preferredPaymentMethod: 'USD',
        autoCharge: false,
        notifications: true
      }
    };

    // Save the new user first
    this.saveUserSession(newUser);

    // Create demo data for new users (only if they don't have any existing data)
    const existingTransactions = this.getTransactionLogs(walletAddress);
    const existingSessions = this.getChargingSessions(walletAddress);
    
    if (existingTransactions.length === 0 && existingSessions.length === 0) {
      console.log('🎯 Creating demo data for brand new user:', walletAddress);
      await this.createDemoData(walletAddress);
    }
    
    // Log new user creation
    await ClientComprehensiveLogger.logLogin(walletAddress, {
      source: 'privy_auth', 
      email, 
      isNewUser: true,
      initialBalance: 100,
      timestamp: new Date() 
    });

    // Log wallet connection for new user
    await ClientComprehensiveLogger.logUIInteraction(walletAddress, 'wallet_connect', {
      isNewUser: true, 
      initialBalance: 100, 
      email 
    });

    // Log initial balance check
    await ClientComprehensiveLogger.logBalanceCheck(walletAddress, {
      currentBalance: 100.00,
      dechBalance: 0,
      checkContext: 'new_user_initial_balance'
    });
    
    this.saveUserSession(newUser);
    this.currentUser = newUser;

    // Update user session in database
    await ClientComprehensiveLogger.logSystemEvent(walletAddress, 'user_session_update', {
      currentBalance: 100.00,
      dechBalance: 0,
      totalEnergyConsumed: 0,
      totalDechEarned: 0,
      sessionsCompleted: 0,
      totalSpent: 0,
      lastActivity: new Date()
    });

    console.log('✅ New user created with $100 demo balance:', walletAddress);
    return newUser;
  }

  // Enhanced logout with comprehensive logging
  async logout(walletAddress: string): Promise<void> {
    try {
      if (this.currentUser) {
        // Log logout activity
        await ClientComprehensiveLogger.logLogout(walletAddress, {
          sessionDuration: Date.now() - new Date(this.currentUser.joinedAt).getTime(),
          timestamp: new Date() 
        });

        console.log('🔐 User logged out:', walletAddress);
        this.currentUser = null;
      }
    } catch (error) {
      console.error('❌ Logout logging failed:', error);
    }
  }

  // Update a logged transaction with on-chain details (calls server API)
  async updateTransactionWithOnChain(localTxHash: string, onChainData: { solanaTransactionHash: string; solanaExplorerUrl?: string; verified?: boolean }) {
    try {
      const resp = await fetch('/api/transactions/update-onchain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          localTxHash,
          solanaTransactionHash: onChainData.solanaTransactionHash,
          solanaExplorerUrl: onChainData.solanaExplorerUrl,
          verified: onChainData.verified || false
        })
      });

      const json = await resp.json();
      if (!json.success) {
        console.warn('⚠️ updateTransactionWithOnChain failed:', json);
      }
      return json;
    } catch (error) {
      console.error('❌ Failed to call update-onchain API:', error);
      throw error;
    }
  }
  
  // Get user session from localStorage
  getUserSession(walletAddress: string): UserSession | null {
    try {
      const stored = localStorage.getItem(`user_session_${walletAddress}`);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Error getting user session:', error);
      return null;
    }
  }

  getUserStats(walletAddress?: string): any {
    const targetAddress = walletAddress || this.currentUser?.walletAddress;
    if (!targetAddress) return null;

    const sessions = this.getChargingSessions(targetAddress);
    const transactions = this.getTransactionLogs(targetAddress);
    const totalSessions = sessions.length;
    const totalEnergyConsumed = sessions.reduce((sum, session) => sum + session.energyConsumed, 0);
    const totalSpent = transactions
      .filter(tx => tx.type === 'charge' && tx.status === 'confirmed')
      .reduce((sum, tx) => sum + tx.amount, 0);
    const totalDechEarned = sessions.reduce((sum, session) => sum + session.dechEarned, 0);
    
    // Calculate environmental impact
    const co2Saved = totalEnergyConsumed * 0.45; // kg CO2 saved per kWh
    const treesEquivalent = Math.floor(co2Saved / 22); // 22kg CO2 per tree annually
    
    // Calculate current balance (mock calculation)
    const currentBalance = totalDechEarned - (totalSpent * 85); // 1 DECH = $0.85
    
    return {
      totalSessions,
      totalEnergyConsumed: Math.round(totalEnergyConsumed * 10) / 10,
      totalSpent: Math.round(totalSpent * 100) / 100,
      totalDechEarned: Math.round(totalDechEarned),
      currentBalance: Math.max(0, Math.round(currentBalance)),
      co2Saved: Math.round(co2Saved * 10) / 10,
      treesEquivalent,
      level: Math.min(10, Math.floor(totalSessions / 5) + 1),
      rank: this.calculateRank(totalSessions, totalEnergyConsumed),
      achievements: this.calculateAchievements(totalSessions, totalEnergyConsumed, co2Saved),
      monthlyUsage: this.getMonthlyUsage(targetAddress),
      favoriteStations: this.getFavoriteStations(targetAddress),
      avgSessionDuration: this.getAverageSessionDuration(targetAddress),
      totalDistance: this.getTotalDistanceTraveled(totalEnergyConsumed)
    };
  }

  private calculateRank(sessions: number, energy: number): string {
    const score = sessions * 10 + energy * 2;
    if (score >= 1000) return 'Diamond';
    if (score >= 500) return 'Platinum';
    if (score >= 250) return 'Gold';
    if (score >= 100) return 'Silver';
    return 'Bronze';
  }

  private calculateAchievements(sessions: number, energy: number, co2: number): string[] {
    const achievements = [];
    if (sessions >= 1) achievements.push('First Charge');
    if (sessions >= 10) achievements.push('Regular User');
    if (sessions >= 50) achievements.push('Power User');
    if (energy >= 100) achievements.push('Energy Efficient');
    if (energy >= 500) achievements.push('Green Champion');
    if (co2 >= 50) achievements.push('Eco Warrior');
    if (co2 >= 200) achievements.push('Planet Saver');
    return achievements;
  }

  private getMonthlyUsage(walletAddress: string): any[] {
    const sessions = this.getChargingSessions(walletAddress);
    const monthlyData = new Map();
    
    sessions.forEach(session => {
      const month = new Date(session.startTime).toISOString().slice(0, 7); // YYYY-MM
      if (!monthlyData.has(month)) {
        monthlyData.set(month, { energy: 0, sessions: 0, spending: 0 });
      }
      const data = monthlyData.get(month);
      data.energy += session.energyConsumed;
      data.sessions += 1;
      data.spending += session.amountPaid;
    });

    return Array.from(monthlyData.entries()).map(([month, data]) => ({
      month,
      ...data,
      energy: Math.round(data.energy * 10) / 10,
      spending: Math.round(data.spending * 100) / 100
    })).slice(-6); // Last 6 months
  }

  private getFavoriteStations(walletAddress: string): any[] {
    const sessions = this.getChargingSessions(walletAddress);
    const stationCount = new Map();
    
    sessions.forEach(session => {
      const key = `${session.stationId}-${session.stationName}`;
      if (!stationCount.has(key)) {
        stationCount.set(key, { 
          id: session.stationId, 
          name: session.stationName, 
          location: session.location,
          visits: 0, 
          totalEnergy: 0 
        });
      }
      const data = stationCount.get(key);
      data.visits += 1;
      data.totalEnergy += session.energyConsumed;
    });

    return Array.from(stationCount.values())
      .sort((a, b) => b.visits - a.visits)
      .slice(0, 3);
  }

  private getAverageSessionDuration(walletAddress: string): number {
    const sessions = this.getChargingSessions(walletAddress).filter(s => s.endTime);
    if (sessions.length === 0) return 0;
    
    const totalDuration = sessions.reduce((sum, session) => {
      const start = new Date(session.startTime).getTime();
      const end = new Date(session.endTime!).getTime();
      return sum + (end - start);
    }, 0);

    return Math.round((totalDuration / sessions.length) / 60000); // minutes
  }

  private getTotalDistanceTraveled(totalEnergy: number): number {
    // Mock calculation based on energy consumption (rough estimate)
    return Math.round(totalEnergy * 4.5); // ~4.5 km per kWh for average EV
  }

  // Get leaderboard data for all users
  getLeaderboard(): any[] {
    const leaderboard = [];
    
    // Add demo leaderboard entries for better UI experience
    const demoLeaderboard = [
      {
        walletAddress: 'demo_user_1',
        rank: 'Diamond',
        level: 8,
        totalSessions: 45,
        totalEnergyConsumed: 890.5,
        totalDechEarned: 8905,
        co2Saved: 400.7,
        joinedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        achievements: ['welcome', 'first_charge', 'eco_warrior', 'frequent_charger'],
        displayName: 'EcoDriver',
        isDemo: true
      },
      {
        walletAddress: 'demo_user_2',
        rank: 'Platinum',
        level: 6,
        totalSessions: 32,
        totalEnergyConsumed: 654.2,
        totalDechEarned: 6542,
        co2Saved: 294.4,
        joinedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        achievements: ['welcome', 'first_charge', 'eco_warrior'],
        displayName: 'GreenCommuter',
        isDemo: true
      },
      {
        walletAddress: 'demo_user_3',
        rank: 'Gold',
        level: 5,
        totalSessions: 28,
        totalEnergyConsumed: 456.8,
        totalDechEarned: 4568,
        co2Saved: 205.6,
        joinedAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
        achievements: ['welcome', 'first_charge'],
        displayName: 'CityCharger',
        isDemo: true
      },
      {
        walletAddress: 'demo_user_4',
        rank: 'Silver',
        level: 4,
        totalSessions: 19,
        totalEnergyConsumed: 234.6,
        totalDechEarned: 2346,
        co2Saved: 105.6,
        joinedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        achievements: ['welcome', 'first_charge'],
        displayName: 'ElectricNomad',
        isDemo: true
      },
      {
        walletAddress: 'demo_user_5',
        rank: 'Bronze',
        level: 3,
        totalSessions: 12,
        totalEnergyConsumed: 156.4,
        totalDechEarned: 1564,
        co2Saved: 70.4,
        joinedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        achievements: ['welcome'],
        displayName: 'PowerSeeker',
        isDemo: true
      }
    ];
    
    // Add demo entries first
    leaderboard.push(...demoLeaderboard);
    
    // Get all real user sessions from localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('user_session_')) {
        try {
          const userSession = JSON.parse(localStorage.getItem(key) || '{}');
          const stats = this.getUserStats(userSession.walletAddress);
          
          if (stats && stats.totalSessions > 0) { // Only include users with actual activity
            leaderboard.push({
              walletAddress: userSession.walletAddress,
              rank: stats.rank,
              level: stats.level,
              totalSessions: stats.totalSessions,
              totalEnergyConsumed: stats.totalEnergyConsumed,
              totalDechEarned: stats.totalDechEarned,
              co2Saved: stats.co2Saved,
              joinedAt: userSession.joinedAt,
              achievements: stats.achievements,
              displayName: userSession.walletAddress.slice(0, 8) + '...',
              isDemo: false
            });
          }
        } catch (error) {
          console.error('Error parsing user session:', error);
        }
      }
    }
    
    // Sort by total energy consumed (primary) and total sessions (secondary)
    return leaderboard
      .sort((a, b) => {
        if (b.totalEnergyConsumed !== a.totalEnergyConsumed) {
          return b.totalEnergyConsumed - a.totalEnergyConsumed;
        }
        return b.totalSessions - a.totalSessions;
      })
      .slice(0, 50); // Top 50 users
  }

  // Get all active charging sessions across all users
  getLiveChargingSessions(): any[] {
    const liveSessions = [];
    
    // Add demo live charging sessions for better UI experience
    const demoLiveSessions = [
      {
        walletAddress: 'demo_live_user_1',
        sessionId: 'demo_live_session_1',
        stationId: 'STATION_LIVE_001',
        stationName: 'Metro Plaza Station',
        location: 'Downtown, Los Angeles',
        startTime: new Date(Date.now() - 25 * 60 * 1000).toISOString(), // 25 mins ago
        energyConsumed: 15.8,
        amountPaid: 0,
        dechEarned: 158,
        txHash: 'live_demo_tx_1',
        status: 'active' as const,
        coordinates: { lat: 34.0522, lng: -118.2437 },
        timeElapsed: 25,
        currentProgress: 65,
        estimatedCompletion: 15,
        displayName: 'PowerUser',
        isDemo: true
      },
      {
        walletAddress: 'demo_live_user_2',
        sessionId: 'demo_live_session_2',
        stationId: 'STATION_LIVE_002',
        stationName: 'Airport Charging Hub',
        location: 'LAX Terminal, Los Angeles',
        startTime: new Date(Date.now() - 12 * 60 * 1000).toISOString(), // 12 mins ago
        energyConsumed: 8.4,
        amountPaid: 0,
        dechEarned: 84,
        txHash: 'live_demo_tx_2',
        status: 'active' as const,
        coordinates: { lat: 33.9425, lng: -118.4081 },
        timeElapsed: 12,
        currentProgress: 30,
        estimatedCompletion: 28,
        displayName: 'TravelCharger',
        isDemo: true
      },
      {
        walletAddress: 'demo_live_user_3',
        sessionId: 'demo_live_session_3',
        stationId: 'STATION_LIVE_003',
        stationName: 'Shopping Center Fast Charge',
        location: 'Beverly Hills, CA',
        startTime: new Date(Date.now() - 8 * 60 * 1000).toISOString(), // 8 mins ago
        energyConsumed: 22.1,
        amountPaid: 0,
        dechEarned: 221,
        txHash: 'live_demo_tx_3',
        status: 'active' as const,
        coordinates: { lat: 34.0736, lng: -118.4004 },
        timeElapsed: 8,
        currentProgress: 45,
        estimatedCompletion: 12,
        displayName: 'ShopAndCharge',
        isDemo: true
      }
    ];
    
    // Add demo sessions first
    liveSessions.push(...demoLiveSessions);
    
    // Get all charging sessions from localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('charging_sessions_')) {
        try {
          const sessions = JSON.parse(localStorage.getItem(key) || '[]');
          const activeSessions = sessions.filter((session: ChargingSession) => 
            session.status === 'active'
          );
          
          activeSessions.forEach((session: ChargingSession) => {
            const timeElapsed = Date.now() - new Date(session.startTime).getTime();
            const minutesElapsed = Math.floor(timeElapsed / 60000);
            
            liveSessions.push({
              ...session,
              timeElapsed: minutesElapsed,
              currentProgress: Math.min(95, (minutesElapsed / 60) * 100), // Mock progress
              estimatedCompletion: Math.max(5, 60 - minutesElapsed), // Mock remaining time
              displayName: session.walletAddress.slice(0, 8) + '...',
              isDemo: false
            });
          });
        } catch (error) {
          console.error('Error parsing charging sessions:', error);
        }
      }
    }
    
    return liveSessions.sort((a, b) => 
      new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    );
  }

  // Stop a charging session
  stopChargingSession(sessionId: string, walletAddress: string): boolean {
    try {
      const sessions = this.getChargingSessions(walletAddress);
      const sessionIndex = sessions.findIndex(s => s.id === sessionId);
      
      if (sessionIndex === -1) return false;
      
      const session = sessions[sessionIndex];
      if (session.status !== 'active') return false;
      
      // Calculate final values
      const timeElapsed = Date.now() - new Date(session.startTime).getTime();
      const hoursElapsed = timeElapsed / (1000 * 60 * 60);
      const energyConsumed = Number(Math.min(session.energyConsumed || (hoursElapsed * 25), hoursElapsed * 25).toFixed(2)); // 25kW charging rate estimate
      const finalDechEarned = Number((energyConsumed * 10).toFixed(2)); // 10 DECH per kWh

      // Determine final amount: prefer existing amountPaid if provided, otherwise estimate using a default rate
      const defaultRate = 0.14; // USD per kWh fallback
      const finalAmountPaid = Number((session.amountPaid && session.amountPaid > 0 ? session.amountPaid : (energyConsumed * defaultRate)).toFixed(2));
      
      // Update session
      sessions[sessionIndex] = {
        ...session,
        endTime: new Date().toISOString(),
        status: 'completed',
        energyConsumed,
        dechEarned: finalDechEarned,
        amountPaid: finalAmountPaid
      };
      
      // Save updated sessions
      localStorage.setItem(`charging_sessions_${walletAddress}`, JSON.stringify(sessions));
      
      // Log transaction for session completion
      // Update user stats (deduct balance and add DECH)
      try {
        this.updateUserStats(energyConsumed, finalAmountPaid, finalDechEarned);
      } catch (err) {
        console.warn('⚠️ Failed to update user stats after stopChargingSession:', err);
      }

      this.logTransaction({
        walletAddress,
        type: 'charge',
        amount: finalAmountPaid,
        currency: 'USD',
        timestamp: new Date().toISOString(),
        txHash: null, // On-chain hash handled elsewhere
        status: 'confirmed',
        metadata: {
          sessionId,
          sessionCompleted: true,
          energyConsumed,
          dechEarned: finalDechEarned
        }
      });
      
      console.log('🔌 Charging session stopped:', sessionId);
      return true;
    } catch (error) {
      console.error('Error stopping charging session:', error);
      return false;
    }
  }
  
  // Save user session to localStorage
  saveUserSession(user: UserSession): void {
    try {
      localStorage.setItem(`user_session_${user.walletAddress}`, JSON.stringify(user));
      this.currentUser = user;
    } catch (error) {
      console.error('Error saving user session:', error);
    }
  }
  
  // Update user stats after charging session
  updateUserStats(energyConsumed: number, amountPaid: number, dechEarned: number): void {
    if (!this.currentUser) return;
    
    const updatedUser: UserSession = {
      ...this.currentUser,
      totalSessions: this.currentUser.totalSessions + 1,
      totalEnergyConsumed: this.currentUser.totalEnergyConsumed + energyConsumed,
      totalDechEarned: this.currentUser.totalDechEarned + dechEarned,
      totalSpent: this.currentUser.totalSpent + amountPaid,
      currentBalance: Math.max(0, this.currentUser.currentBalance - amountPaid), // Deduct from balance
      dechBalance: this.currentUser.dechBalance + dechEarned, // Add DECH tokens
      level: Math.floor((this.currentUser.totalSessions + 1) / 10) + 1
    };
    
    // Check for achievements
    this.checkAchievements(updatedUser);
    
    this.currentUser = updatedUser;
    this.saveUserSession(updatedUser);
    
    console.log('💰 Balance updated:', {
      spent: amountPaid,
      remaining: updatedUser.currentBalance,
      dechEarned: dechEarned,
      totalDech: updatedUser.dechBalance
    });
  }
  
  // Enhanced charging session logging with API
  async logChargingSession(session: Omit<ChargingSession, 'id'>): Promise<string> {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fullSession: ChargingSession = {
      ...session,
      id: sessionId
    };

    try {
      // Log locally for immediate UI updates
      const existingSessions = this.getChargingSessions(session.walletAddress);
      existingSessions.unshift(fullSession);
      
      // Keep only last 100 sessions locally
      const limitedSessions = existingSessions.slice(0, 100);
      
      localStorage.setItem(
        `charging_sessions_${session.walletAddress}`,
        JSON.stringify(limitedSessions)
      );

      // Log to database via API
      try {
        const response = await fetch('/api/transactions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'log_charging_session',
            data: {
              walletAddress: session.walletAddress,
              stationId: session.stationId,
              stationName: session.stationName,
              location: session.location,
              startTime: session.startTime,
              endTime: session.endTime,
              status: session.status,
              energyConsumed: session.energyConsumed,
              amountPaid: session.amountPaid,
              dechEarned: session.dechEarned,
              txHash: session.txHash,
              coordinates: session.coordinates
            }
          })
        });

        const result = await response.json();
        if (result.success) {
          console.log('✅ Charging session logged to database:', sessionId);
        } else {
          console.warn('⚠️ Failed to log session to database:', result.message);
        }
      } catch (apiError) {
        console.warn('⚠️ API logging failed, session stored locally only:', apiError);
      }

      return sessionId;
    } catch (error) {
      console.error('❌ Error logging charging session:', error);
      return sessionId;
    }
  }  // Get charging sessions for user
  getChargingSessions(walletAddress: string): ChargingSession[] {
    try {
      const stored = localStorage.getItem(`charging_sessions_${walletAddress}`);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error getting charging sessions:', error);
      return [];
    }
  }
  
  // Enhanced transaction logging with comprehensive logging
  async logTransaction(transaction: Omit<TransactionLog, 'id'>): Promise<string> {
    const txId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fullTransaction: TransactionLog = {
      ...transaction,
      id: txId
    };
    
    try {
      // Log transaction initiation with comprehensive logger
      if (transaction.type === 'charge') {
        await ClientComprehensiveLogger.logTransactionInitiate(transaction.walletAddress, transaction.amount, {
          txHash: transaction.txHash,
          currency: transaction.currency,
          type: transaction.type,
          stationId: transaction.metadata?.stationId
        });
      }

      // Log locally for immediate UI updates
      const existingTxs = this.getTransactionLogs(transaction.walletAddress);
      existingTxs.unshift(fullTransaction);
      
      // Keep only last 200 transactions locally
      const limitedTxs = existingTxs.slice(0, 200);
      
      localStorage.setItem(
        `transaction_logs_${transaction.walletAddress}`,
        JSON.stringify(limitedTxs)
      );

      // Log to database via API
      try {
        const response = await fetch('/api/transactions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'log_transaction',
            data: {
              walletAddress: transaction.walletAddress,
              type: transaction.type,
              amount: transaction.amount,
              currency: transaction.currency,
              txHash: transaction.txHash,
              status: transaction.status,
              metadata: transaction.metadata
            }
          })
        });

        const result = await response.json();
        if (result.success) {
          console.log('✅ Transaction logged to database:', txId);
          
          // Log successful transaction confirmation
          if (transaction.status === 'confirmed') {
            await ClientComprehensiveLogger.logTransactionComplete(transaction.walletAddress, transaction.txHash, transaction.amount, {
              confirmationTime: 2000 // Simulated confirmation time
            });
          }
        } else {
          console.warn('⚠️ Failed to log transaction to database:', result.message);
        }
      } catch (apiError) {
        console.warn('⚠️ API logging failed, transaction stored locally only:', apiError);
      }
      
      return txId;
    } catch (error) {
      console.error('❌ Error logging transaction:', error);
      
      // Log transaction failure
      await ClientComprehensiveLogger.logTransactionFail(
        transaction.walletAddress, 
        transaction.txHash, 
        transaction.amount,
        error.message
      );
      
      return txId;
    }
  }
  
  // Get transaction logs for user
  getTransactionLogs(walletAddress: string): TransactionLog[] {
    try {
      const stored = localStorage.getItem(`transaction_logs_${walletAddress}`);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error getting transaction logs:', error);
      return [];
    }
  }
  
  // Check and award achievements
  private checkAchievements(user: UserSession): void {
    const newAchievements: string[] = [];
    
    if (user.totalSessions >= 1 && !user.achievements.includes('first_charge')) {
      newAchievements.push('first_charge');
    }
    
    if (user.totalSessions >= 10 && !user.achievements.includes('regular_charger')) {
      newAchievements.push('regular_charger');
    }
    
    if (user.totalSessions >= 50 && !user.achievements.includes('power_user')) {
      newAchievements.push('power_user');
    }
    
    if (user.totalEnergyConsumed >= 100 && !user.achievements.includes('eco_warrior')) {
      newAchievements.push('eco_warrior');
    }
    
    if (user.totalDechEarned >= 1000 && !user.achievements.includes('token_collector')) {
      newAchievements.push('token_collector');
    }
    
    if (newAchievements.length > 0) {
      user.achievements = [...user.achievements, ...newAchievements];
      
      // Show achievement notification (could be enhanced with a toast system)
      console.log('🏆 New achievements unlocked:', newAchievements);
    }
  }
  
  // Get current user
  getCurrentUser(): UserSession | null {
    return this.currentUser;
  }
  
  // Clear user session (logout)
  clearSession(): void {
    this.currentUser = null;
  }
  
  // Create demo data for new users to populate dashboard
  async createDemoData(walletAddress: string): Promise<void> {
    try {
      console.log('🎯 Creating demo data for new user:', walletAddress);

      // Create demo transactions
      const demoTransactions = [
        {
          walletAddress,
          type: 'purchase' as const,
          amount: 50,
          currency: 'USD' as const,
          timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
          txHash: `demo_tx_${Date.now()}_1`,
          status: 'confirmed' as const,
          metadata: {
            description: 'Initial balance top-up'
          }
        },
        {
          walletAddress,
          type: 'charge' as const,
          amount: 15.74,
          currency: 'USD' as const,
          timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
          txHash: `demo_tx_${Date.now()}_2`,
          status: 'confirmed' as const,
          metadata: {
            stationId: 'STATION001',
            stationName: 'City Center Mall',
            energyAmount: 25,
            dechEarned: 250
          }
        },
        {
          walletAddress,
          type: 'charge' as const,
          amount: 8.42,
          currency: 'USD' as const,
          timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
          txHash: `demo_tx_${Date.now()}_3`,
          status: 'confirmed' as const,
          metadata: {
            stationId: 'STATION002',
            stationName: 'Downtown Plaza',
            energyAmount: 18,
            dechEarned: 180
          }
        }
      ];

      // Save demo transactions
      for (const tx of demoTransactions) {
        await this.logTransaction(tx);
      }

      // Create demo charging sessions
      const demoChargingSessions = [
        {
          walletAddress,
          sessionId: `demo_session_${Date.now()}_1`,
          stationId: 'STATION001',
          stationName: 'City Center Mall',
          location: 'Mall District, New York',
          startTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          endTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 45 * 60 * 1000).toISOString(),
          energyConsumed: 25,
          amountPaid: 15.74,
          dechEarned: 250,
          txHash: `demo_tx_${Date.now()}_2`,
          status: 'completed' as const,
          coordinates: { lat: 40.7580, lng: -73.9855 }
        },
        {
          walletAddress,
          sessionId: `demo_session_${Date.now()}_2`,
          stationId: 'STATION002',
          stationName: 'Downtown Plaza',
          location: 'Financial District, New York',
          startTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          endTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 32 * 60 * 1000).toISOString(),
          energyConsumed: 18,
          amountPaid: 8.42,
          dechEarned: 180,
          txHash: `demo_tx_${Date.now()}_3`,
          status: 'completed' as const,
          coordinates: { lat: 40.7074, lng: -74.0113 }
        }
      ];

      // Save demo charging sessions
      for (const session of demoChargingSessions) {
        await this.logChargingSession(session);
      }

      // Create one active charging session for live charging demo
      const activeSession = {
        walletAddress,
        sessionId: `live_session_${Date.now()}`,
        stationId: 'STATION003',
        stationName: 'Tech Park Station',
        location: 'Silicon Valley, CA',
        startTime: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // Started 15 mins ago
        energyConsumed: 12.5,
        amountPaid: 0, // Still charging
        dechEarned: 125,
        txHash: `live_tx_${Date.now()}`,
        status: 'active' as const,
        coordinates: { lat: 37.4419, lng: -122.1430 }
      };

      await this.logChargingSession(activeSession);

      console.log('✅ Demo data created successfully for', walletAddress);
    } catch (error) {
      console.error('❌ Failed to create demo data:', error);
    }
  }


}

export default UserSessionManager;