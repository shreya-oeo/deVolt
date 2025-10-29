import { NextRequest, NextResponse } from 'next/server';
import { databaseService } from '@/lib/databaseService';

export async function POST(request: NextRequest) {
  try {
    const sessionData = await request.json();

    // Validate required fields
    const required = ['userId', 'sessionId', 'stationId', 'stationName', 'location', 'kWh', 'durationMinutes', 'costUSD', 'dechEarned'];
    const missing = required.filter(field => !sessionData[field]);
    
    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missing.join(', ')}` },
        { status: 400 }
      );
    }

    // Set default status if not provided
    if (!sessionData.status) {
      sessionData.status = 'completed';
    }

    const session = await databaseService.createChargingSession(sessionData);

    return NextResponse.json({
      success: true,
      data: session
    });
  } catch (error) {
    console.error('❌ API - Create session error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create charging session',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const sessions = await databaseService.getUserSessions(userId, limit);

    return NextResponse.json({
      success: true,
      data: sessions
    });
  } catch (error) {
    console.error('❌ API - Get sessions error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get sessions',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}