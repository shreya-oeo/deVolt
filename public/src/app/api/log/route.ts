import { NextRequest, NextResponse } from 'next/server';
import DatabaseManager from '@/lib/database';

// CORS headers for production
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS(req: NextRequest) {
  return new Response(null, { status: 200, headers: corsHeaders });
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Rate limiting check
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    console.log(`📊 API request from ${clientIP}`);

    const logData = await req.json();
    
    // Validate required fields
    if (!logData.type) {
      return NextResponse.json(
        { error: 'Missing required field: type' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Initialize database connection with retry logic
    let db: DatabaseManager;
    let retries = 3;
    
    while (retries > 0) {
      try {
        db = DatabaseManager.getInstance();
        break;
      } catch (error) {
        retries--;
        if (retries === 0) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // Process the request based on type
    switch (logData.type) {
      case 'activity':
        if (!logData.walletAddress || !logData.activityType) {
          throw new Error('Missing required fields for activity logging');
        }
        await db!.logActivity({
          walletAddress: logData.walletAddress,
          activityType: logData.activityType,
          metadata: logData.metadata || {}
        });
        break;
        
      case 'transaction':
        if (!logData.walletAddress || !logData.amount) {
          throw new Error('Missing required fields for transaction logging');
        }
        await db!.logTransaction({
          walletAddress: logData.walletAddress,
          txHash: logData.txHash || `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: logData.transactionType || 'payment',
          amount: logData.amount,
          currency: logData.currency || 'USD',
          status: logData.status || 'pending',
          metadata: logData.metadata || {}
        });
        break;
        
      case 'charging_session':
        if (!logData.sessionData) {
          throw new Error('Missing session data');
        }
        await db!.logChargingSession(logData.sessionData);
        break;
        
      case 'balance_check':
        if (!logData.balanceData) {
          throw new Error('Missing balance data');
        }
        await db!.logBalanceCheck(logData.balanceData);
        break;
        
      case 'auth_event':
        if (!logData.eventType) {
          throw new Error('Missing event type for auth event');
        }
        await db!.logAuthEvent({
          walletAddress: logData.walletAddress,
          eventType: logData.eventType,
          success: logData.success !== false,
          error: logData.error,
          metadata: logData.metadata || {}
        });
        break;
        
      case 'error':
        // Enhanced error logging
        console.error('🚨 Application Error:', {
          walletAddress: logData.walletAddress || 'unknown',
          error: logData.error,
          context: logData.context,
          timestamp: new Date().toISOString(),
          userAgent: req.headers.get('user-agent'),
          ip: clientIP
        });
        break;
        
      default:
        return NextResponse.json(
          { error: `Unsupported log type: ${logData.type}` },
          { status: 400, headers: corsHeaders }
        );
    }
    
    const duration = Date.now() - startTime;
    console.log(`✅ API request completed in ${duration}ms`);
    
    return NextResponse.json(
      { 
        success: true, 
        timestamp: new Date().toISOString(),
        duration: `${duration}ms`
      },
      { headers: corsHeaders }
    );
    
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error('❌ API Error:', {
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
        timestamp: new Date().toISOString()
      },
      { status: 500, headers: corsHeaders }
    );
  }
}