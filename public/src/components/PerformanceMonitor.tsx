'use client';

import { useEffect } from 'react';

export function PerformanceMonitor() {
  useEffect(() => {
    // Monitor Core Web Vitals
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const value = (entry as any).value || entry.duration || (entry as any).loadTime || 0;
          console.log(`🚀 ${entry.name}:`, value);
          
          // Log performance metrics to API
          fetch('/api/log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'activity',
              walletAddress: 'system',
              activityType: 'performance_metric',
              metadata: {
                metricName: entry.name,
                value: value,
                timestamp: new Date().toISOString()
              }
            })
          }).catch(() => {}); // Silent fail for performance logs
        }
      });

      // Observe different types of performance entries
      try {
        observer.observe({ entryTypes: ['paint', 'navigation', 'largest-contentful-paint'] });
      } catch (e) {
        console.warn('Performance observer not fully supported');
      }

      return () => observer.disconnect();
    }
  }, []);

  return null;
}