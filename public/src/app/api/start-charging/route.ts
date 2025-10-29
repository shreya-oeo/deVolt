import { NextRequest, NextResponse } from 'next/server';
import { databaseService } from '@/lib/databaseService';

export async function POST(request: NextRequest) {
  try {
    const chargingData = await request.json();
    
    // Validate required fields
    const required = ['privyUserId', 'stationId', 'stationName'];
    const missing = required.filter(field => !chargingData[field]);
    
    if (missing.length > 0) {
      console.log('❌ Missing required fields:', missing);
      return NextResponse.json(
        { error: `Missing required fields: ${missing.join(', ')}` },
        { status: 400 }
      );
    }

    console.log('⚡ Starting charging session for user:', chargingData.privyUserId);

    // Check if user already has an active session
    let activeSession = null;
    try {
      const existingSessions = await databaseService.getUserSessions(chargingData.privyUserId, 1);
      activeSession = existingSessions.find(s => s.status === 'active');
    } catch (dbError) {
      console.log('⚠️ Database unavailable, skipping active session check');
      // Continue without checking for existing sessions
    }
    
    if (activeSession) {
      console.log('⚠️ User already has active charging session:', activeSession.sessionId);
      return NextResponse.json(
        { error: 'User already has an active charging session' },
        { status: 400 }
      );
    }

    // Create live charging session
    const sessionId = `live_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    
    const sessionData = {
      userId: chargingData.privyUserId,
      sessionId,
      stationId: chargingData.stationId,
      stationName: chargingData.stationName,
      location: chargingData.location || {
        lat: 12.9716,
        lng: 77.5946,
        address: chargingData.stationName
      },
      startTime: now,
      // Don't set endTime for live session
      kWh: 0, // Will be updated in real-time
      durationMinutes: 0, // Will be updated in real-time
      costUSD: 0, // Will be calculated in real-time
      dechEarned: 0, // Will be calculated at the end
      status: 'active' as const,
      metadata: {
        ...chargingData.metadata,
        isLive: true,
        powerLevel: chargingData.powerLevel || 150,
        pricePerKwh: chargingData.pricePerKwh || 0.30
      }
    };

    let session;
    try {
      session = await databaseService.createChargingSession(sessionData);
      console.log('✅ Live charging session started:', sessionId);
    } catch (dbError) {
      console.log('⚠️ Database unavailable, creating local session:', dbError);
      // Create local session when database is unavailable
      session = {
        _id: `local_session_${Date.now()}`,
        ...sessionData,
        verified: false,
        solanaTransactionHash: null,
        solanaExplorerUrl: null
      };
      console.log('✅ Local charging session started:', sessionId);
    }

    return NextResponse.json({
      success: true,
      message: 'Charging session started successfully',
      data: {
        session,
        instructions: {
          updateEndpoint: '/api/update-charging',
          stopEndpoint: '/api/stop-charging',
          statusEndpoint: `/api/charging-status?sessionId=${sessionId}`
        }
      }
    });

  } catch (error) {
    console.error('❌ API - Start charging error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to start charging session',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const privyUserId = searchParams.get('privyUserId');

    if (!privyUserId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get user's active charging session
    const sessions = await databaseService.getUserSessions(privyUserId, 10);
    const activeSession = sessions.find(s => s.status === 'active');

    return NextResponse.json({
      success: true,
      data: {
        activeSession,
        hasActiveSession: !!activeSession
      }
    });

  } catch (error) {
    console.error('❌ API - Get charging status error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get charging status',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}