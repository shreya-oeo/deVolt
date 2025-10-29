import { MongoClient, Db, Collection } from 'mongodb';

// MongoDB connection URI from environment variables
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://vaibhavtripathi7331_db_user:uwuchan69@cluster0.jdmmerm.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0&tls=true&tlsAllowInvalidCertificates=true';
const DB_NAME = 'decharge_hackathon';

// Collection names
export const COLLECTIONS = {
  USER_ACTIVITIES: 'user_activities',
  TRANSACTIONS: 'transactions',
  CHARGING_SESSIONS: 'charging_sessions',
  USER_SESSIONS: 'user_sessions',
  BALANCE_CHECKS: 'balance_checks',
  AUTH_EVENTS: 'auth_events',
  ERROR_LOGS: 'error_logs'
} as const;

// Activity types for comprehensive logging
export const ACTIVITY_TYPES = {
  // Authentication events
  LOGIN: 'login',
  LOGOUT: 'logout',
  WALLET_CONNECT: 'wallet_connect',
  WALLET_DISCONNECT: 'wallet_disconnect',
  
  // Balance events
  BALANCE_CHECK: 'balance_check',
  BALANCE_UPDATE: 'balance_update',
  INSUFFICIENT_FUNDS: 'insufficient_funds',
  
  // Charging events
  CHARGE_START: 'charge_start',
  CHARGE_COMPLETE: 'charge_complete',
  CHARGE_STOP: 'charge_stop',
  CHARGE_ERROR: 'charge_error',
  
  // Transaction events
  TRANSACTION_INITIATE: 'transaction_initiate',
  TRANSACTION_CONFIRM: 'transaction_confirm',
  TRANSACTION_FAIL: 'transaction_fail',
  
  // Navigation events
  PAGE_VIEW: 'page_view',
  DASHBOARD_VIEW: 'dashboard_view',
  MAP_VIEW: 'map_view',
  
  // UI events
  BUTTON_CLICK: 'button_click',
  SWIPE_ACTION: 'swipe_action',
  FORM_SUBMIT: 'form_submit',
  
  // System events
  ERROR: 'error',
  API_CALL: 'api_call',
  DATA_SYNC: 'data_sync'
} as const;

interface DatabaseConnection {
  client: MongoClient;
  db: Db;
}

class DatabaseManager {
  private static instance: DatabaseManager;
  private connection: DatabaseConnection | null = null;
  private isConnecting = false;

  private constructor() {}

  static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  async connect(): Promise<DatabaseConnection> {
    if (this.connection) {
      return this.connection;
    }

    if (this.isConnecting) {
      // Wait for existing connection attempt
      while (this.isConnecting) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      if (this.connection) {
        return this.connection;
      }
    }

    this.isConnecting = true;

    try {
      console.log('🔌 Connecting to MongoDB...');
      
      // Check if we're in local development and MongoDB is having issues
      const isLocalDev = process.env.NODE_ENV === 'development' || !process.env.VERCEL;
      
      const client = new MongoClient(MONGODB_URI, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: isLocalDev ? 3000 : 10000, // Shorter timeout for local dev
        socketTimeoutMS: 45000,
        retryWrites: true,
        w: 'majority'
      });

      await client.connect();
      console.log('✅ Connected to MongoDB successfully');

      const db = client.db(DB_NAME);
      
      // Create indexes for better performance
      await this.createIndexes(db);
      
      this.connection = { client, db };
      return this.connection;
    } catch (error) {
      // In development, log the error but don't crash the app
      const isLocalDev = process.env.NODE_ENV === 'development' || !process.env.VERCEL;
      
      if (isLocalDev) {
        console.warn('⚠️ MongoDB connection failed in development mode - continuing without remote logging');
        console.warn('Error:', error.message);
        
        // Return a mock connection for development
        const mockConnection = {
          client: null as any,
          db: null as any
        };
        this.connection = mockConnection;
        return mockConnection;
      } else {
        console.error('❌ MongoDB connection failed:', error);
        throw error;
      }
    } finally {
      this.isConnecting = false;
    }
  }

  private async createIndexes(db: Db): Promise<void> {
    try {
      // User activities indexes
      await db.collection(COLLECTIONS.USER_ACTIVITIES).createIndex({ walletAddress: 1, timestamp: -1 });
      await db.collection(COLLECTIONS.USER_ACTIVITIES).createIndex({ activityType: 1, timestamp: -1 });
      
      // Transactions indexes
      await db.collection(COLLECTIONS.TRANSACTIONS).createIndex({ walletAddress: 1, timestamp: -1 });
      await db.collection(COLLECTIONS.TRANSACTIONS).createIndex({ txHash: 1 }, { unique: true });
      await db.collection(COLLECTIONS.TRANSACTIONS).createIndex({ status: 1, timestamp: -1 });
      
      // Charging sessions indexes
      await db.collection(COLLECTIONS.CHARGING_SESSIONS).createIndex({ walletAddress: 1, startTime: -1 });
      await db.collection(COLLECTIONS.CHARGING_SESSIONS).createIndex({ status: 1, startTime: -1 });
      await db.collection(COLLECTIONS.CHARGING_SESSIONS).createIndex({ stationId: 1, startTime: -1 });
      
      // User sessions indexes
      await db.collection(COLLECTIONS.USER_SESSIONS).createIndex({ walletAddress: 1 }, { unique: true });
      await db.collection(COLLECTIONS.USER_SESSIONS).createIndex({ lastActivity: -1 });
      
      // Balance checks indexes
      await db.collection(COLLECTIONS.BALANCE_CHECKS).createIndex({ walletAddress: 1, timestamp: -1 });
      
      // Auth events indexes
      await db.collection(COLLECTIONS.AUTH_EVENTS).createIndex({ walletAddress: 1, timestamp: -1 });
      await db.collection(COLLECTIONS.AUTH_EVENTS).createIndex({ eventType: 1, timestamp: -1 });

      console.log('📊 Database indexes created successfully');
    } catch (error) {
      console.warn('⚠️ Failed to create some indexes:', error);
    }
  }

  async getCollection(collectionName: string): Promise<Collection | null> {
    try {
      const { db } = await this.connect();
      
      // Return null if mock connection (development mode with MongoDB issues)
      if (!db) {
        return null;
      }
      
      return db.collection(collectionName);
    } catch (error) {
      console.warn('⚠️ Failed to get collection, returning null for graceful degradation');
      return null;
    }
  }

  async logActivity(activity: {
    walletAddress: string;
    activityType: string;
    data?: any;
    metadata?: any;
    userAgent?: string;
    ipAddress?: string;
  }): Promise<void> {
    try {
      const collection = await this.getCollection(COLLECTIONS.USER_ACTIVITIES);
      
      // Skip if mock connection (development mode with MongoDB issues)
      if (!collection) {
        console.log('📝 Activity logged locally (MongoDB unavailable):', activity.activityType);
        return;
      }
      
      const activityDoc = {
        ...activity,
        timestamp: new Date(),
        activityId: `${activity.walletAddress}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };

      await collection.insertOne(activityDoc);
      console.log(`📝 Activity logged: ${activity.activityType} for ${activity.walletAddress}`);
    } catch (error) {
      console.error('❌ Failed to log activity:', error);
    }
  }

  async logTransaction(transaction: {
    walletAddress: string;
    txHash: string;
    type: string;
    amount: number;
    currency: string;
    status: string;
    metadata?: any;
  }): Promise<void> {
    try {
      const collection = await this.getCollection(COLLECTIONS.TRANSACTIONS);
      
      // Skip if mock connection (development mode with MongoDB issues)
      if (!collection) {
        console.log('💰 Transaction logged locally (MongoDB unavailable):', transaction.txHash);
        return;
      }
      
      const transactionDoc = {
        ...transaction,
        timestamp: new Date()
      };

      await collection.insertOne(transactionDoc);
      console.log(`💰 Transaction logged: ${transaction.txHash} for ${transaction.walletAddress}`);
    } catch (error) {
      console.error('❌ Failed to log transaction:', error);
    }
  }

  async logChargingSession(session: {
    walletAddress: string;
    sessionId: string;
    stationId: string;
    stationName: string;
    location: string;
    startTime: Date;
    endTime?: Date;
    status: string;
    energyConsumed: number;
    amountPaid: number;
    dechEarned: number;
    txHash: string;
    coordinates?: [number, number];
  }): Promise<void> {
    try {
      const collection = await this.getCollection(COLLECTIONS.CHARGING_SESSIONS);
      
      // Handle graceful degradation if database is unavailable
      if (!collection) {
        console.warn('⚠️ Database unavailable, skipping charging session logging');
        return;
      }
      
      const sessionDoc = {
        ...session,
        timestamp: new Date()
      };

      await collection.insertOne(sessionDoc);
      console.log(`🔌 Charging session logged: ${session.sessionId} for ${session.walletAddress}`);
    } catch (error) {
      console.error('❌ Failed to log charging session:', error);
    }
  }

  async logBalanceCheck(check: {
    walletAddress: string;
    currentBalance: number;
    dechBalance: number;
    requestedAmount?: number;
    sufficient: boolean;
    context: string;
  }): Promise<void> {
    try {
      const collection = await this.getCollection(COLLECTIONS.BALANCE_CHECKS);
      
      // Skip if mock connection (development mode with MongoDB issues)
      if (!collection) {
        console.log('💳 Balance check logged locally (MongoDB unavailable):', check.walletAddress);
        return;
      }
      
      const checkDoc = {
        ...check,
        timestamp: new Date(),
        checkId: `${check.walletAddress}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
      };

      await collection.insertOne(checkDoc);
      console.log(`💳 Balance check logged for ${check.walletAddress}: $${check.currentBalance}`);
    } catch (error) {
      console.error('❌ Failed to log balance check:', error);
    }
  }

  async logAuthEvent(event: {
    walletAddress?: string;
    eventType: string;
    success: boolean;
    error?: string;
    metadata?: any;
  }): Promise<void> {
    try {
      const collection = await this.getCollection(COLLECTIONS.AUTH_EVENTS);
      
      // Handle graceful degradation if database is unavailable
      if (!collection) {
        console.warn('⚠️ Database unavailable, skipping auth event logging');
        return;
      }
      
      const eventDoc = {
        ...event,
        timestamp: new Date(),
        eventId: `auth_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };

      await collection.insertOne(eventDoc);
      console.log(`🔐 Auth event logged: ${event.eventType} - ${event.success ? 'Success' : 'Failed'}`);
    } catch (error) {
      console.error('❌ Failed to log auth event:', error);
    }
  }

  async updateUserSession(walletAddress: string, sessionData: any): Promise<void> {
    try {
      const collection = await this.getCollection(COLLECTIONS.USER_SESSIONS);
      
      await collection.updateOne(
        { walletAddress },
        {
          $set: {
            ...sessionData,
            lastActivity: new Date(),
            updatedAt: new Date()
          },
          $setOnInsert: {
            createdAt: new Date(),
            walletAddress
          }
        },
        { upsert: true }
      );

      console.log(`👤 User session updated for ${walletAddress}`);
    } catch (error) {
      console.error('❌ Failed to update user session:', error);
    }
  }

  async disconnect(): Promise<void> {
    if (this.connection) {
      await this.connection.client.close();
      this.connection = null;
      console.log('🔌 Disconnected from MongoDB');
    }
  }
}

export default DatabaseManager;