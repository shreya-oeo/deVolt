"use client";

import { useState, useEffect, useCallback } from 'react';

interface BalanceUpdate {
  currentBalance: number;
  dechBalance: number;
  lastUpdate: number;
}

export const useRealTimeBalance = (walletAddress: string | undefined) => {
  const [balance, setBalance] = useState<BalanceUpdate>({
    currentBalance: 0,
    dechBalance: 0,
    lastUpdate: Date.now()
  });
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch balance from API
  const fetchBalance = useCallback(async () => {
    if (!walletAddress) return;

    try {
      const response = await fetch(`/api/user/${walletAddress}`);
      if (response.ok) {
        const data = await response.json();
        setBalance({
          currentBalance: data.currentBalance || 0,
          dechBalance: data.dechBalance || 0,
          lastUpdate: Date.now()
        });
      }
    } catch (error) {
      // Silently handle errors
    }
  }, [walletAddress]);

  // Update balance locally (optimistic update)
  const updateBalance = useCallback((usdChange: number, dechChange: number) => {
    setIsUpdating(true);
    setBalance(prev => ({
      currentBalance: Math.max(0, prev.currentBalance + usdChange),
      dechBalance: Math.max(0, prev.dechBalance + dechChange),
      lastUpdate: Date.now()
    }));
    
    // Reset updating state after animation
    setTimeout(() => setIsUpdating(false), 1000);
  }, []);

  // Deduct charging cost
  const deductChargingCost = useCallback((cost: number, dechReward: number) => {
    updateBalance(-cost, dechReward);
  }, [updateBalance]);

  // Add funds
  const addFunds = useCallback((amount: number, dechBonus: number = 0) => {
    updateBalance(amount, dechBonus);
  }, [updateBalance]);

  // Poll for updates every 10 seconds
  useEffect(() => {
    if (!walletAddress) return;

    fetchBalance();
    const interval = setInterval(fetchBalance, 10000);
    return () => clearInterval(interval);
  }, [walletAddress, fetchBalance]);

  return {
    balance: balance.currentBalance,
    dechBalance: balance.dechBalance,
    isUpdating,
    updateBalance,
    deductChargingCost,
    addFunds,
    refreshBalance: fetchBalance
  };
};
