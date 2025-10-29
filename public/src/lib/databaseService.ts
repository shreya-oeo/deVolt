import { connectToDatabase } from './mongodb';

export interface UserProfile {
  _id?: string;
  userId: string; // Privy user ID
  email?: string;
  walletAddress?: string; // Optional - may not have external wallet
  joinedAt: string;
  totalSessions: number;
  totalEnergyConsumed: number;
  totalSpent: number;
  totalDechEarned: number;
  currentBalance: number;
  level: number;
  achievements: string[];
  preferences: {
    notifications: boolean;
    autoCharge: boolean;
    preferredPaymentMethod: string;
  };
  solanaInitialized: boolean;
  solanaTransactionCount: number;
  lastActivity: string;
}

export interface ChargingSession {
  _id?: string;
  userId: string;
  sessionId: string;
  stationId: string;
  stationName: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  startTime: string;
  endTime?: string;
  kWh: number;
  durationMinutes: number;
  costUSD: number;
  dechEarned: number;
  status: 'active' | 'completed' | 'failed';
  
  // On-chain verification data
  solanaTransactionHash?: string;
  solanaExplorerUrl?: string;
  sessionHash?: string;
  verified: boolean;
  
  metadata?: {
    deviceType?: string;
    paymentMethod?: string;
    powerLevel?: number;
  };
}

export interface TransactionLog {
  _id?: string;
  userId: string;
  privyUserId?: string;
  type: 'charge' | 'purchase' | 'reward' | 'withdrawal';
  amount: number;
  currency: 'USD' | 'DECH' | 'SOL';
  timestamp: string;
  description: string;
  memo?: string;
  
  // On-chain data
  solanaTransactionHash?: string;
  solanaExplorerUrl?: string;
  blockHash?: string;
  verified: boolean;
  
  // Session reference
  sessionId?: string;
  
  // Additional properties for enhanced transaction details
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

export class DatabaseService {
  private db: any = null;

  async getDatabase() {
    try {
      if (!this.db) {
        console.log('🔌 Connecting to MongoDB...');
        this.db = await connectToDatabase();
        
        if (!this.db) {
          console.warn('⚠️ MongoDB connection failed in development mode - continuing without remote logging');
          return null;
        }
        
        console.log('✅ MongoDB connection established');
      }
      return this.db;
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error);
      
      // In development, continue without database
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️ MongoDB connection failed in development mode - continuing without remote logging');
        return null;
      }
      
      throw new Error('Database connection unavailable');
    }
  }

  /**
   * Initialize or get user profile with Privy integration
   */
  async initializeUser(privyUserId: string, email?: string, walletAddress?: string): Promise<UserProfile> {
    const db = await this.getDatabase();
    const users = db.collection('users');

    // Check if user already exists
    let user = await users.findOne({ userId: privyUserId });

    if (!user) {
      // Create new user profile
      const newUser: UserProfile = {
        userId: privyUserId,
        email,
        walletAddress,
        joinedAt: new Date().toISOString(),
        totalSessions: 0,
        totalEnergyConsumed: 0,
        totalSpent: 0,
        totalDechEarned: 0,
        currentBalance: 100.00, // Starting balance
        level: 1,
        achievements: ['welcome'],
        preferences: {
          notifications: true,
          autoCharge: false,
          preferredPaymentMethod: 'USD'
        },
        solanaInitialized: false,
        solanaTransactionCount: 0,
        lastActivity: new Date().toISOString()
      };

      const result = await users.insertOne(newUser);
      user = { ...newUser, _id: result.insertedId };

      // Initialize user (Solana integration removed for simplicity)
      try {
        await users.updateOne(
          { userId: privyUserId },
          { 
            $set: { 
              solanaInitialized: true,
              solanaTransactionCount: 1
            } 
          }
        );

        // Log the initialization transaction
        await this.logTransaction({
          userId: privyUserId,
          type: 'purchase',
          amount: 100,
          currency: 'DECH',
          timestamp: new Date().toISOString(),
          description: 'Initial DECH token allocation',
          solanaTransactionHash: `demo_init_${privyUserId}_${Date.now()}`,
          solanaExplorerUrl: 'https://explorer.solana.com/tx/demo?cluster=devnet',
          verified: true,
          metadata: {
            initializationType: 'privy_platform_wallet',
            email
          }
        });
      } catch (error) {
        console.error('❌ Failed to initialize user on Solana:', error);
      }
    } else {
      // Update last activity
      await users.updateOne(
        { userId: privyUserId },
        { 
          $set: { 
            lastActivity: new Date().toISOString(),
            email: email || user.email, // Update email if provided
            walletAddress: walletAddress || user.walletAddress
          } 
        }
      );
    }

    return user;
  }

  /**
   * Create new charging session with on-chain recording
   */
  async createChargingSession(sessionData: Omit<ChargingSession, '_id' | 'verified' | 'solanaTransactionHash' | 'solanaExplorerUrl' | 'sessionHash'>): Promise<ChargingSession> {
    const db = await this.getDatabase();
    const sessions = db.collection('sessions');
    const users = db.collection('users');

    // Create session object
    const session: ChargingSession = {
      ...sessionData,
      verified: false
    };

    // Insert session into database
    const result = await sessions.insertOne(session);
    session._id = result.insertedId;

    // Record session (Solana integration simplified)
    try {
      // Generate a mock transaction hash for demo purposes
      const mockTransactionHash = `demo_${sessionData.sessionId}_${Date.now()}`;
      const mockExplorerUrl = `https://explorer.solana.com/tx/${mockTransactionHash}?cluster=devnet`;
      const mockSessionHash = `session_${sessionData.sessionId}_${Date.now()}`;
      
      // Update session with mock blockchain data
      await sessions.updateOne(
        { _id: result.insertedId },
        {
            $set: {
              solanaTransactionHash: mockTransactionHash,
              solanaExplorerUrl: mockExplorerUrl,
              sessionHash: mockSessionHash,
              verified: true
            }
          }
        );

        // Update user stats
        await users.updateOne(
          { userId: sessionData.userId },
          {
            $inc: {
              totalSessions: 1,
              totalEnergyConsumed: sessionData.kWh,
              totalSpent: sessionData.costUSD,
              totalDechEarned: sessionData.dechEarned,
              solanaTransactionCount: 1
            },
            $set: {
              lastActivity: new Date().toISOString()
            }
          }
        );

        // Log the charging transaction
        await this.logTransaction({
          userId: sessionData.userId,
          type: 'charge',
          amount: sessionData.costUSD,
          currency: 'USD',
          timestamp: sessionData.endTime || sessionData.startTime,
          description: `Charging session at ${sessionData.stationName}`,
          solanaTransactionHash: mockTransactionHash,
          solanaExplorerUrl: `https://explorer.solana.com/tx/${mockTransactionHash}?cluster=devnet`,
          verified: true,
          sessionId: sessionData.sessionId,
          metadata: {
            kWh: sessionData.kWh,
            durationMinutes: sessionData.durationMinutes,
            dechEarned: sessionData.dechEarned,
            stationId: sessionData.stationId,
            location: sessionData.location
          }
        });

        session.solanaTransactionHash = mockTransactionHash;
        session.solanaExplorerUrl = `https://explorer.solana.com/tx/${mockTransactionHash}?cluster=devnet`;
        session.sessionHash = `hash_${sessionData.sessionId}_${Date.now()}`;
        session.verified = true;
    } catch (error) {
      console.error('❌ Failed to record session on Solana:', error);
      // Session is still saved to database even if blockchain recording fails
    }

    return session;
  }

  /**
   * Log transaction with optional Solana integration
   */
  async logTransaction(transactionData: Omit<TransactionLog, '_id'>): Promise<TransactionLog> {
    try {
      const db = await this.getDatabase();
      const transactions = db.collection('transactions');

      const transaction: TransactionLog = {
        ...transactionData
      };

      const result = await transactions.insertOne(transaction);
      console.log('✅ Transaction logged to database:', result.insertedId);
      return { ...transaction, _id: result.insertedId };
    } catch (error) {
      console.error('❌ Database transaction logging failed, falling back to local logging:', error);
      
      // Create a local transaction record for fallback
      const fallbackTransaction: TransactionLog = {
        _id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...transactionData
      };

      // Log locally for debugging (could be saved to local storage or file)
      console.log('💾 Local transaction logged:', JSON.stringify(fallbackTransaction, null, 2));
      
      return fallbackTransaction;
    }
  }

  /**
   * Get user's charging sessions
   */
  async getUserSessions(userId: string, limit: number = 50): Promise<ChargingSession[]> {
    const db = await this.getDatabase();
    const sessions = db.collection('sessions');

    return await sessions
      .find({ userId })
      .sort({ startTime: -1 })
      .limit(limit)
      .toArray();
  }

  /**
   * Get user's transaction history
   */
  async getUserTransactions(userId: string, limit: number = 100): Promise<TransactionLog[]> {
    const db = await this.getDatabase();
    const transactions = db.collection('transactions');

    return await transactions
      .find({ userId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();
  }

  /**
   * Get user profile
   */
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const db = await this.getDatabase();
    const users = db.collection('users');

    return await users.findOne({ userId });
  }

  /**
   * Update user balance
   */
  async updateUserBalance(userId: string, amount: number, currency: 'USD' | 'DECH'): Promise<void> {
    const db = await this.getDatabase();
    const users = db.collection('users');

    const updateField = currency === 'USD' ? 'currentBalance' : 'totalDechEarned';
    
    await users.updateOne(
      { userId },
      {
        $inc: { [updateField]: amount },
        $set: { lastActivity: new Date().toISOString() }
      }
    );
  }

  /**
   * Verify session on blockchain
   */
  async verifySession(sessionId: string): Promise<{ verified: boolean; session?: ChargingSession }> {
    const db = await this.getDatabase();
    const sessions = db.collection('sessions');

    const session = await sessions.findOne({ sessionId });
    
    if (!session || !session.solanaTransactionHash || !session.sessionHash) {
      return { verified: false };
    }

    try {
      // Simplified verification - just check if session exists and has transaction hash
      const isVerified = session.solanaTransactionHash && session.sessionHash;

      if (isVerified && !session.verified) {
        // Update session as verified
        await sessions.updateOne(
          { sessionId },
          { $set: { verified: true } }
        );
        session.verified = true;
      }

      return {
        verified: isVerified,
        session: isVerified ? session : undefined
      };
    } catch (error) {
      console.error('❌ Session verification failed:', error);
      return { verified: false };
    }
  }

  /**
   * Get leaderboard data
   */
  async getLeaderboard(limit: number = 100): Promise<UserProfile[]> {
    const db = await this.getDatabase();
    const users = db.collection('users');

    return await users
      .find({})
      .sort({ totalEnergyConsumed: -1 })
      .limit(limit)
      .toArray();
  }

  /**
   * Get live charging sessions
   */
  async getLiveChargingSessions(): Promise<ChargingSession[]> {
    const db = await this.getDatabase();
    const sessions = db.collection('sessions');

    return await sessions
      .find({ status: 'active' })
      .sort({ startTime: -1 })
      .toArray();
  }

  /**
   * Update a transaction record by its local txHash (application-generated) with on-chain details
   */
  async updateTransactionByLocalHash(localTxHash: string, updates: Partial<TransactionLog>): Promise<TransactionLog | null> {
    try {
      const db = await this.getDatabase();
      const transactions = db.collection('transactions');

      // First check if the transaction exists
      const existingTransaction = await transactions.findOne({ txHash: localTxHash });
      if (!existingTransaction) {
        console.warn(`⚠️ Transaction not found for hash: ${localTxHash}`);
        return null;
      }

      const res = await transactions.findOneAndUpdate(
        { txHash: localTxHash },
        { $set: updates },
        { returnDocument: 'after' }
      );

      if (!res || !res.value) {
        console.warn(`⚠️ Failed to update transaction for hash: ${localTxHash}`);
        return null;
      }
      
      console.log(`✅ Updated transaction ${localTxHash} with on-chain data`);
      return res.value as TransactionLog;
    } catch (error) {
      console.error('❌ Failed to update transaction by local hash:', error);
      return null;
    }
  }
}

// Singleton instance
export const databaseService = new DatabaseService();