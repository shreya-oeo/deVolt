import { useState, useEffect, useCallback } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import LiveChargingManager, { LiveChargingSession } from '@/lib/liveChargingManager';

interface UseLiveChargingReturn {
  activeSessions: LiveChargingSession[];
  isCharging: boolean;
  startCharging: (stationData: {
    stationId: string;
    stationName: string;
    location: { lat: number; lng: number; address: string };
    targetKwh: number;
    costPerKwh: number;
  }) => string; // Returns session ID
  stopCharging: (sessionId: string) => Promise<boolean>;
  getSessionProgress: (sessionId: string) => {
    progress: number;
    currentKwh: number;
    estimatedTimeRemaining: number;
    dechEarned: number;
  } | null;
  refreshSessions: () => void;
}

export function useLiveCharging(): UseLiveChargingReturn {
  const { user, authenticated } = usePrivy();
  const [activeSessions, setActiveSessions] = useState<LiveChargingSession[]>([]);
  const [manager] = useState(() => LiveChargingManager.getInstance());

  // Subscribe to live updates
  useEffect(() => {
    const unsubscribe = manager.subscribe((sessions) => {
      setActiveSessions(sessions);
    });

    // Initial load
    setActiveSessions(manager.getActiveSessions());

    return unsubscribe;
  }, [manager]);

  /**
   * Start a new charging session
   */
  const startCharging = useCallback((stationData: {
    stationId: string;
    stationName: string;
    location: { lat: number; lng: number; address: string };
    targetKwh: number;
    costPerKwh: number;
  }): string => {
    if (!authenticated || !user?.id) {
      throw new Error('User not authenticated');
    }

    const sessionId = `live_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    manager.startChargingSession({
      sessionId,
      privyUserId: user.id,
      ...stationData
    });

    console.log('🚗 Started charging session:', sessionId, 'at', stationData.stationName);
    return sessionId;
  }, [authenticated, user?.id, manager]);

  /**
   * Stop/cancel a charging session
   */
  const stopCharging = useCallback(async (sessionId: string): Promise<boolean> => {
    const success = await manager.cancelSession(sessionId);
    console.log(success ? '✅ Stopped charging session:' : '❌ Failed to stop session:', sessionId);
    return success;
  }, [manager]);

  /**
   * Get progress for a specific session
   */
  const getSessionProgress = useCallback((sessionId: string) => {
    const session = manager.getSession(sessionId);
    if (!session) return null;

    const timeElapsed = Date.now() - new Date(session.startTime).getTime();
    const estimatedTotal = session.targetKwh * 60000 * 1.2; // 1.2 minutes per kWh
    const estimatedTimeRemaining = Math.max(0, estimatedTotal - timeElapsed) / 60000; // in minutes

    return {
      progress: session.actualProgress,
      currentKwh: session.currentKwh,
      estimatedTimeRemaining: Math.round(estimatedTimeRemaining),
      dechEarned: session.dechEarnedSoFar
    };
  }, [manager]);

  /**
   * Refresh active sessions
   */
  const refreshSessions = useCallback(() => {
    setActiveSessions(manager.getActiveSessions());
  }, [manager]);

  return {
    activeSessions,
    isCharging: activeSessions.length > 0,
    startCharging,
    stopCharging,
    getSessionProgress,
    refreshSessions
  };
}

export default useLiveCharging;