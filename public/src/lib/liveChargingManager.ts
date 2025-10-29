/**
 * Live Charging Session Manager
 * Handles real-time charging sessions with progress tracking and cancellation
 */

import ServerlessSolana from './serverlessSolana';

interface LiveChargingSession {
  sessionId: string;
  privyUserId: string;
  stationId: string;
  stationName: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  startTime: string;
  targetKwh: number;
  currentKwh: number;
  costPerKwh: number;
  dechEarnedSoFar: number;
  estimatedEndTime: string;
  actualProgress: number; // 0-100
  status: 'active' | 'completed' | 'cancelled' | 'error';
  metadata?: any;
}

class LiveChargingManager {
  private static instance: LiveChargingManager;
  private activeSessions: Map<string, LiveChargingSession> = new Map();
  private progressIntervals: Map<string, NodeJS.Timeout> = new Map();
  private updateCallbacks: Set<(sessions: LiveChargingSession[]) => void> = new Set();

  private constructor() {}

  static getInstance(): LiveChargingManager {
    if (!LiveChargingManager.instance) {
      LiveChargingManager.instance = new LiveChargingManager();
    }
    return LiveChargingManager.instance;
  }

  /**
   * Start a new live charging session
   */
  startChargingSession(sessionData: {
    sessionId: string;
    privyUserId: string;
    stationId: string;
    stationName: string;
    location: { lat: number; lng: number; address: string };
    targetKwh: number;
    costPerKwh: number;
  }): LiveChargingSession {
    const session: LiveChargingSession = {
      ...sessionData,
      startTime: new Date().toISOString(),
      currentKwh: 0,
      dechEarnedSoFar: 0,
      estimatedEndTime: new Date(Date.now() + sessionData.targetKwh * 60000).toISOString(), // 1 min per kWh
      actualProgress: 0,
      status: 'active'
    };

    this.activeSessions.set(sessionData.sessionId, session);
    this.startProgressTracking(sessionData.sessionId);
    this.notifyUpdates();

    console.log('🔋 Started live charging session:', sessionData.sessionId);
    return session;
  }

  /**
   * Start progress tracking for a session
   */
  private startProgressTracking(sessionId: string): void {
    const updateInterval = setInterval(() => {
      const session = this.activeSessions.get(sessionId);
      if (!session || session.status !== 'active') {
        this.stopProgressTracking(sessionId);
        return;
      }

      // Simulate realistic charging progress (slower at beginning and end)
      const timeElapsed = Date.now() - new Date(session.startTime).getTime();
      const progressMinutes = timeElapsed / 60000;
      
      // Realistic charging curve (fast in middle, slower at start/end)
      let progressPercent = Math.min(100, (progressMinutes / (session.targetKwh * 1.2)) * 100);
      
      // Apply charging curve
      if (progressPercent < 20) {
        progressPercent *= 0.7; // Slower start
      } else if (progressPercent > 80) {
        progressPercent = 80 + (progressPercent - 80) * 0.5; // Slower end
      }

      session.actualProgress = Math.min(100, progressPercent);
      session.currentKwh = (session.targetKwh * session.actualProgress) / 100;
      session.dechEarnedSoFar = Math.floor(session.currentKwh * 10); // 10 DECH per kWh

      // Check if session is complete
      if (session.actualProgress >= 100) {
        this.completeSession(sessionId);
      } else {
        this.activeSessions.set(sessionId, session);
        this.notifyUpdates();
      }
    }, 2000); // Update every 2 seconds

    this.progressIntervals.set(sessionId, updateInterval);
  }

  /**
   * Stop progress tracking
   */
  private stopProgressTracking(sessionId: string): void {
    const interval = this.progressIntervals.get(sessionId);
    if (interval) {
      clearInterval(interval);
      this.progressIntervals.delete(sessionId);
    }
  }

  /**
   * Complete a charging session
   */
  private async completeSession(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    session.status = 'completed';
    session.actualProgress = 100;
    session.currentKwh = session.targetKwh;
    session.dechEarnedSoFar = Math.floor(session.targetKwh * 10);

    this.stopProgressTracking(sessionId);
    this.activeSessions.set(sessionId, session);

    // Log transaction to API
    await this.logTransactionToAPI(session);

    // Remove from active sessions after a delay
    setTimeout(() => {
      this.activeSessions.delete(sessionId);
      this.notifyUpdates();
    }, 5000);

    this.notifyUpdates();
    console.log('✅ Completed charging session:', sessionId);
  }

  /**
   * Cancel a charging session
   */
  async cancelSession(sessionId: string): Promise<boolean> {
    const session = this.activeSessions.get(sessionId);
    if (!session || session.status !== 'active') {
      return false;
    }

    session.status = 'cancelled';
    this.stopProgressTracking(sessionId);

    // Log partial transaction if any energy was consumed
    if (session.currentKwh > 0) {
      await this.logTransactionToAPI(session);
    }

    this.activeSessions.set(sessionId, session);

    // Remove from active sessions after a delay
    setTimeout(() => {
      this.activeSessions.delete(sessionId);
      this.notifyUpdates();
    }, 3000);

    this.notifyUpdates();
    console.log('🛑 Cancelled charging session:', sessionId);
    return true;
  }

  /**
   * Log transaction to API with real Solana memo transaction
   */
  private async logTransactionToAPI(session: LiveChargingSession): Promise<void> {
    try {
      const actualKwh = session.currentKwh;
      const costUSD = parseFloat((actualKwh * session.costPerKwh).toFixed(2));
      const dechEarned = Math.floor(actualKwh * 2.5); // 2.5 DECH per kWh
      
      // Create memo for the transaction
      const memo = `DeCharge Live: ${actualKwh.toFixed(1)}kWh at ${session.stationName} - Session ${session.sessionId.slice(-8)}`;
      
      // Create real Solana memo transaction
      let solanaResult = null;
      try {
        console.log('🔗 Creating live session memo transaction...');
        solanaResult = await ServerlessSolana.createMemoTransaction(
          memo,
          session.privyUserId,
          {
            sessionId: session.sessionId,
            stationName: session.stationName,
            kWh: actualKwh,
            costUSD: costUSD,
            dechEarned: dechEarned,
          }
        );
        console.log('✅ Live session memo transaction created:', solanaResult.signature);
      } catch (error) {
        console.log('⚠️ Failed to create live session memo transaction:', error);
      }
      
      const transactionData = {
        action: 'createTransaction',
        userId: session.privyUserId, // Fix: use userId instead of privyUserId
        privyUserId: session.privyUserId,
        type: 'charge',
        amount: costUSD,
        currency: 'USD', // Fix: add required currency field
        description: `EV Charging Session at ${session.stationName} - ${actualKwh.toFixed(1)}kWh`, // Fix: add required description field
        costUSD: costUSD,
        kWh: actualKwh,
        stationId: session.stationId,
        stationName: session.stationName,
        location: session.location,
        durationMinutes: Math.floor((Date.now() - new Date(session.startTime).getTime()) / 60000),
        dechEarned: dechEarned,
        metadata: {
          sessionId: session.sessionId,
          energyAmount: actualKwh,
          dechEarned: dechEarned,
          costINR: costUSD * 78, // Convert USD to INR
          powerLevel: `${Math.floor(Math.random() * 100) + 50}kW`,
          connectorType: 'Type-2 CCS',
          memo: memo,
          onChainMemo: memo,
          targetKwh: session.targetKwh,
          status: session.status,
          startTime: session.startTime,
          endTime: new Date().toISOString(),
          liveSession: true
        },
        // Use only real Solana transaction data - no fake hashes
        solanaTransactionHash: solanaResult?.signature || null,
        blockHash: solanaResult?.blockHash || null,
        verified: solanaResult?.verified || false,
        explorerUrl: solanaResult?.explorerUrl || null
      };

      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transactionData),
      });

      const result = await response.json();
      if (result.success) {
        console.log('✅ Live session transaction logged to API:', result.transaction?._id);
      } else {
        console.error('❌ Failed to log live session transaction:', result.error);
      }
    } catch (error) {
      console.error('❌ Error logging live session transaction:', error);
    }
  }

  /**
   * Get all active sessions
   */
  getActiveSessions(): LiveChargingSession[] {
    return Array.from(this.activeSessions.values()).filter(s => s.status === 'active');
  }

  /**
   * Get specific session
   */
  getSession(sessionId: string): LiveChargingSession | null {
    return this.activeSessions.get(sessionId) || null;
  }

  /**
   * Subscribe to session updates
   */
  subscribe(callback: (sessions: LiveChargingSession[]) => void): () => void {
    this.updateCallbacks.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.updateCallbacks.delete(callback);
    };
  }

  /**
   * Notify all subscribers of updates
   */
  private notifyUpdates(): void {
    const activeSessions = this.getActiveSessions();
    this.updateCallbacks.forEach(callback => {
      try {
        callback(activeSessions);
      } catch (error) {
        console.error('Error in live charging callback:', error);
      }
    });
  }

  /**
   * Cleanup - stop all sessions
   */
  cleanup(): void {
    this.progressIntervals.forEach((interval) => clearInterval(interval));
    this.progressIntervals.clear();
    this.activeSessions.clear();
    this.updateCallbacks.clear();
  }
}

export default LiveChargingManager;
export type { LiveChargingSession };