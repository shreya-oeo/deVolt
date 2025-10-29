import { NextRequest, NextResponse } from 'next/server';
import { databaseService } from '@/lib/databaseService';

export async function POST(request: NextRequest) {
  try {
    const updateData = await request.json();
    
    // Validate required fields
    const required = ['sessionId'];
    const missing = required.filter(field => !updateData[field]);
    
    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missing.join(', ')}` },
        { status: 400 }
      );
    }

    const { sessionId, kWh, durationMinutes } = updateData;

    console.log(`⚡ Updating charging session ${sessionId}: ${kWh} kWh, ${durationMinutes} minutes`);

    const db = await databaseService.getDatabase();
    const sessions = db.collection('sessions');

    // Find the active session
    const session = await sessions.findOne({ sessionId, status: 'active' });
    
    if (!session) {
      return NextResponse.json(
        { error: 'Active charging session not found' },
        { status: 404 }
      );
    }

    // Calculate cost based on kWh and price per kWh
    const pricePerKwh = session.metadata?.pricePerKwh || 0.30;
    const costUSD = kWh * pricePerKwh;

    // Update session with real-time data
    const updateFields = {
      kWh: kWh || session.kWh,
      durationMinutes: durationMinutes || session.durationMinutes,
      costUSD,
      lastUpdated: new Date().toISOString(),
      ...(session.metadata && {
        metadata: {
          ...session.metadata,
          lastUpdate: new Date().toISOString(),
          totalUpdates: (session.metadata.totalUpdates || 0) + 1
        }
      })
    };

    await sessions.updateOne(
      { sessionId },
      { $set: updateFields }
    );

    // Get updated session
    const updatedSession = await sessions.findOne({ sessionId });

    console.log(`✅ Session ${sessionId} updated: ${updateFields.kWh} kWh, $${updateFields.costUSD.toFixed(2)}`);

    return NextResponse.json({
      success: true,
      message: 'Charging session updated',
      data: {
        session: updatedSession,
        realTimeStats: {
          kWh: updateFields.kWh,
          durationMinutes: updateFields.durationMinutes,
          costUSD: updateFields.costUSD,
          averagePower: updateFields.durationMinutes > 0 ? (updateFields.kWh / (updateFields.durationMinutes / 60)).toFixed(1) : 0,
          estimatedFullCharge: updateFields.kWh > 0 ? Math.ceil((75 / updateFields.kWh) * updateFields.durationMinutes) : null
        }
      }
    });

  } catch (error) {
    console.error('❌ API - Update charging error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update charging session',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    const db = await databaseService.getDatabase();
    const sessions = db.collection('sessions');

    const session = await sessions.findOne({ sessionId });

    if (!session) {
      return NextResponse.json(
        { error: 'Charging session not found' },
        { status: 404 }
      );
    }

    // Calculate real-time stats
    let duration = 0;
    if (session.startTime) {
      const start = new Date(session.startTime).getTime();
      const now = Date.now();
      duration = Math.floor((now - start) / 60000); // minutes
    }

    const stats = {
      sessionId: session.sessionId,
      status: session.status,
      kWh: session.kWh,
      durationMinutes: session.status === 'active' ? duration : session.durationMinutes,
      costUSD: session.costUSD,
      stationName: session.stationName,
      startTime: session.startTime,
      isActive: session.status === 'active',
      powerLevel: session.metadata?.powerLevel || 150,
      pricePerKwh: session.metadata?.pricePerKwh || 0.30
    };

    return NextResponse.json({
      success: true,
      data: {
        session: session,
        realTimeStats: stats
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