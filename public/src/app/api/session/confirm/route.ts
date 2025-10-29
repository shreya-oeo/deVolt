import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function POST(request: NextRequest) {
  try {
    const confirmationData = await request.json();

    const required = ['sessionId', 'kWh', 'durationMinutes', 'costUSD'];
    const missing = required.filter(field => !confirmationData[field]);
    
    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missing.join(', ')}` },
        { status: 400 }
      );
    }

    const {
      sessionId,
      kWh,
      durationMinutes,
      costUSD
    } = confirmationData;

    const db = await connectToDatabase();
    const sessions = db.collection('sessions');

    // Find the session
    const session = await sessions.findOne({ sessionId });

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    if (session.status !== 'active') {
      return NextResponse.json(
        { error: 'Session is not active' },
        { status: 400 }
      );
    }

    // Calculate DECH tokens earned
    const dechEarned = Math.floor(kWh * 10);

    // Update session with final data
    const updateResult = await sessions.updateOne(
      { sessionId },
      {
        $set: {
          status: 'completed',
          endTime: new Date().toISOString(),
          kWh,
          durationMinutes,
          costUSD,
          dechEarned,
          verified: true
        }
      }
    );

    if (updateResult.modifiedCount === 0) {
      return NextResponse.json(
        { error: 'Failed to update session' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Charging session confirmed successfully',
      data: {
        sessionId,
        kWh,
        durationMinutes,
        costUSD,
        dechEarned,
        status: 'completed'
      }
    });

  } catch (error) {
    console.error('❌ Confirm session error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to confirm charging session',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
