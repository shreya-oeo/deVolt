/**
 * Bridge service that connects Privy authentication with existing session management
 * This ensures all user data is real and properly synchronized between systems
 */

import { usePrivy } from '@privy-io/react-auth';
import UserSessionManager from './userSession';

export class PrivySessionBridge {
  private static instance: PrivySessionBridge;
  private sessionManager: UserSessionManager;

  private constructor() {
    this.sessionManager = UserSessionManager.getInstance();
  }

  static getInstance(): PrivySessionBridge {
    if (!PrivySessionBridge.instance) {
      PrivySessionBridge.instance = new PrivySessionBridge();
    }
    return PrivySessionBridge.instance;
  }

  /**
   * Initialize or sync a Privy user with the existing session management system
   */
  async initializePrivyUser(privyUserId: string, email?: string): Promise<any> {
    console.log('🔗 Bridging Privy user to session system:', privyUserId);

    // Use the Privy user ID as the wallet address in our existing system
    // This ensures consistent data flow between Privy and localStorage sessions
    const existingSession = await this.sessionManager.initializeUser(privyUserId, email);

    // Ensure the session has proper Privy metadata
    const updatedSession = {
      ...existingSession,
      privyUserId,
      email: email || existingSession.email,
      walletAddress: privyUserId, // Map Privy ID to walletAddress for compatibility
      isPrivyUser: true,
      lastPrivySync: new Date().toISOString()
    };

    this.sessionManager.saveUserSession(updatedSession);
    console.log('✅ Privy user session synchronized:', updatedSession.walletAddress);

    return updatedSession;
  }

  /**
   * Get user session using Privy ID
   */
  getPrivyUserSession(privyUserId: string) {
    return this.sessionManager.getUserSession(privyUserId);
  }

  /**
   * Log a charging session for a Privy user with proper data mapping
   */
  async logPrivyChargingSession(privyUserId: string, sessionData: {
    stationId: string;
    stationName: string;
    location: string;
    coordinates: { lat: number; lng: number };
    energyConsumed: number;
    amountPaid: number;
    dechEarned: number;
    txHash: string;
    status: 'active' | 'completed' | 'cancelled';
  }) {
    console.log('⚡ Logging Privy charging session:', privyUserId, sessionData.stationName);

    const chargingSession = {
      walletAddress: privyUserId, // Map to existing system
      stationId: sessionData.stationId,
      stationName: sessionData.stationName,
      location: sessionData.location,
      startTime: new Date().toISOString(),
      endTime: sessionData.status === 'completed' ? new Date().toISOString() : undefined,
      energyConsumed: sessionData.energyConsumed,
      amountPaid: sessionData.amountPaid,
      dechEarned: sessionData.dechEarned,
      txHash: sessionData.txHash,
      status: sessionData.status,
      coordinates: sessionData.coordinates
    };

    const sessionId = await this.sessionManager.logChargingSession(chargingSession);
    console.log('✅ Privy charging session logged with ID:', sessionId);
    
    return sessionId;
  }

  /**
   * Log a transaction for a Privy user
   */
  async logPrivyTransaction(privyUserId: string, transactionData: {
    type: 'charge' | 'purchase' | 'withdrawal' | 'reward';
    amount: number;
    currency: 'USD' | 'SOL' | 'DECH';
    txHash: string;
    status: 'pending' | 'confirmed' | 'failed';
    metadata?: any;
  }) {
    console.log('💳 Logging Privy transaction:', privyUserId, transactionData.type, transactionData.amount);

    const transaction = {
      walletAddress: privyUserId, // Map to existing system
      type: transactionData.type,
      amount: transactionData.amount,
      currency: transactionData.currency,
      timestamp: new Date().toISOString(),
      txHash: transactionData.txHash,
      status: transactionData.status,
      metadata: {
        ...transactionData.metadata,
        privyUser: true,
        privyUserId
      }
    };

    const txId = await this.sessionManager.logTransaction(transaction);
    console.log('✅ Privy transaction logged with ID:', txId);
    
    return txId;
  }

  /**
   * Get all charging sessions for a Privy user
   */
  getPrivyChargingSessions(privyUserId: string) {
    return this.sessionManager.getChargingSessions(privyUserId);
  }

  /**
   * Get all transactions for a Privy user
   */
  getPrivyTransactions(privyUserId: string) {
    return this.sessionManager.getTransactionLogs(privyUserId);
  }

  /**
   * Update Privy user stats after a transaction
   */
  updatePrivyUserStats(privyUserId: string, energyConsumed: number, amountPaid: number, dechEarned: number) {
    // Get current session and update it directly
    const currentSession = this.sessionManager.getUserSession(privyUserId);
    if (!currentSession) {
      console.error('❌ Cannot update stats: Privy user session not found:', privyUserId);
      return null;
    }

    // Update session data manually since we can't access private currentUser
    const updatedSession = {
      ...currentSession,
      totalSessions: currentSession.totalSessions + 1,
      totalEnergyConsumed: currentSession.totalEnergyConsumed + energyConsumed,
      totalDechEarned: currentSession.totalDechEarned + dechEarned,
      totalSpent: currentSession.totalSpent + amountPaid,
      currentBalance: Math.max(0, currentSession.currentBalance - amountPaid),
      dechBalance: currentSession.dechBalance + dechEarned,
      level: Math.floor((currentSession.totalSessions + 1) / 10) + 1
    };

    // Save updated session
    this.sessionManager.saveUserSession(updatedSession);
    
    console.log('📊 Privy user stats updated:', privyUserId, {
      spent: amountPaid,
      remaining: updatedSession.currentBalance,
      dechEarned: dechEarned
    });
    
    return updatedSession;
  }

  /**
   * Get comprehensive user data for Privy user
   */
  getPrivyUserData(privyUserId: string) {
    const session = this.getPrivyUserSession(privyUserId);
    const chargingSessions = this.getPrivyChargingSessions(privyUserId);
    const transactions = this.getPrivyTransactions(privyUserId);
    const stats = this.sessionManager.getUserStats(privyUserId);

    return {
      userSession: session,
      chargingSessions,
      transactions,
      stats,
      summary: {
        totalSessions: chargingSessions.length,
        totalTransactions: transactions.length,
        currentBalance: session?.currentBalance || 0,
        dechBalance: session?.dechBalance || 0,
        totalSpent: session?.totalSpent || 0,
        totalEnergyConsumed: session?.totalEnergyConsumed || 0
      }
    };
  }

  /**
   * Sync Privy user data with backend APIs (when available)
   */
  async syncPrivyUserWithBackend(privyUserId: string) {
    try {
      console.log('🔄 Syncing Privy user with backend APIs:', privyUserId);

      // Initialize user with backend
      const initResponse = await fetch('/api/init-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          privyUserId,
          email: this.getPrivyUserSession(privyUserId)?.email
        })
      });

      if (initResponse.ok) {
        const initResult = await initResponse.json();
        console.log('✅ Privy user synced with backend:', initResult);
        return initResult;
      }
    } catch (error) {
      console.log('⚠️ Backend sync failed, using local data:', error);
    }

    return null;
  }
}

export default PrivySessionBridge;