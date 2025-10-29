import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const sessionData = await request.json();

    const required = ['privyUserId', 'stationId', 'stationName'];
    const missing = required.filter(field => !sessionData[field]);
    
    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missing.join(', ')}` },
        { status: 400 }
      );
    }

    const {
      privyUserId,
      stationId,
      stationName,
      location = { lat: 0, lng: 0, address: '' }
    } = sessionData;

    // Generate session ID
    const sessionId = `session_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;

    // Create session record
    const session = {
      sessionId,
      privyUserId,
      stationId,
      stationName,
      location,
      status: 'active',
      startTime: new Date().toISOString(),
      endTime: null,
      kWh: 0,
      durationMinutes: 0,
      costUSD: 0,
      dechEarned: 0,
      verified: false,
      solanaTransactionHash: null
    };

    const db = await connectToDatabase();
    const sessions = db.collection('sessions');
    
    const result = await sessions.insertOne(session);

    return NextResponse.json({
      success: true,
      message: 'Charging session created successfully',
      data: {
        sessionId,
        ...session,
        _id: result.insertedId
      }
    });

  } catch (error) {
    console.error('❌ Create session error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create charging session',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
