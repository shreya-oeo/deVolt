/**
 * Client-side comprehensive logger that sends data to API endpoints
 * This replaces direct database calls to avoid MongoDB client-side issues
 */

export class ClientComprehensiveLogger {
  private static async sendToAPI(endpoint: string, data: any): Promise<void> {
    // Skip all logging in development to reduce noise
    if (process.env.NODE_ENV === 'development') {
      return;
    }

    const maxRetries = 1; // Reduced retries
    let retries = 0;
    
    while (retries < maxRetries) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          controller.abort('Request timeout');
        }, 5000); // Reduced timeout to 5 seconds
        
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`API call failed: ${response.status}`);
        }
        
        return; // Success, exit retry loop
        
      } catch (error: any) {
        retries++;
        
        if (retries >= maxRetries) {
          // Silently fail - no console spam
          return;
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  // Authentication Events
  static async logLogin(walletAddress: string, metadata?: any): Promise<void> {
    await this.sendToAPI('/api/log', {
      type: 'auth_event',
      walletAddress,
      eventType: 'login',
      success: true,
      metadata: {
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        ...metadata
      }
    });
  }

  static async logLogout(walletAddress: string, metadata?: any): Promise<void> {
    await this.sendToAPI('/api/log', {
      type: 'auth_event',
      walletAddress,
      eventType: 'logout',
      success: true,
      metadata: {
        timestamp: new Date().toISOString(),
        ...metadata
      }
    });
  }

  // Balance Operations - Throttled to prevent spam
  private static lastBalanceCheck = 0;
  private static balanceCheckThrottle = 30000; // 30 seconds

  static async logBalanceCheck(walletAddress: string, balanceData: any): Promise<void> {
    const now = Date.now();
    if (now - this.lastBalanceCheck < this.balanceCheckThrottle) {
      return; // Skip if called too recently
    }
    this.lastBalanceCheck = now;

    await this.sendToAPI('/api/log', {
      type: 'balance_check',
      balanceData: {
        walletAddress,
        ...balanceData,
        timestamp: new Date().toISOString()
      }
    });
  }

  // Charging Operations
  static async logChargeStart(walletAddress: string, sessionId: string, metadata?: any): Promise<void> {
    await this.sendToAPI('/api/log', {
      type: 'activity',
      walletAddress,
      activityType: 'charge_start',
      metadata: {
        sessionId,
        timestamp: new Date().toISOString(),
        ...metadata
      }
    });
  }

  static async logChargeStop(walletAddress: string, sessionId: string, metadata?: any): Promise<void> {
    await this.sendToAPI('/api/log', {
      type: 'activity',
      walletAddress,
      activityType: 'charge_stop',
      metadata: {
        sessionId,
        timestamp: new Date().toISOString(),
        ...metadata
      }
    });
  }

  static async logChargingSession(sessionData: any): Promise<void> {
    await this.sendToAPI('/api/log', {
      type: 'charging_session',
      sessionData: {
        ...sessionData,
        timestamp: new Date().toISOString()
      }
    });
  }

  // Transaction Operations
  static async logTransactionInitiate(walletAddress: string, amount: number, metadata?: any): Promise<void> {
    await this.sendToAPI('/api/log', {
      type: 'transaction',
      walletAddress,
      txHash: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      transactionType: 'initiate',
      amount,
      currency: 'SOL',
      status: 'initiated',
      metadata: {
        timestamp: new Date().toISOString(),
        ...metadata
      }
    });
  }

  static async logTransactionComplete(walletAddress: string, txHash: string, amount: number, metadata?: any): Promise<void> {
    await this.sendToAPI('/api/log', {
      type: 'transaction',
      walletAddress,
      txHash,
      transactionType: 'complete',
      amount,
      currency: 'SOL',
      status: 'completed',
      metadata: {
        timestamp: new Date().toISOString(),
        ...metadata
      }
    });
  }

  static async logTransactionFail(walletAddress: string, txHash: string, amount: number, error: string, metadata?: any): Promise<void> {
    await this.sendToAPI('/api/log', {
      type: 'transaction',
      walletAddress,
      txHash,
      transactionType: 'fail',
      amount,
      currency: 'SOL',
      status: 'failed',
      metadata: {
        timestamp: new Date().toISOString(),
        error,
        ...metadata
      }
    });
  }

  // UI Interactions
  static async logUIInteraction(walletAddress: string, interactionType: string, metadata?: any): Promise<void> {
    await this.sendToAPI('/api/log', {
      type: 'activity',
      walletAddress,
      activityType: interactionType,
      metadata: {
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        ...metadata
      }
    });
  }

  static async logButtonClick(walletAddress: string, buttonName: string, metadata?: any): Promise<void> {
    await this.logUIInteraction(walletAddress, 'button_click', {
      button: buttonName,
      ...metadata
    });
  }

  static async logPageView(walletAddress: string, page: string, metadata?: any): Promise<void> {
    await this.logUIInteraction(walletAddress, 'page_view', {
      page,
      url: window.location.href,
      referrer: document.referrer,
      ...metadata
    });
  }

  // System Events
  static async logSystemEvent(walletAddress: string, eventType: string, metadata?: any): Promise<void> {
    await this.sendToAPI('/api/log', {
      type: 'activity',
      walletAddress,
      activityType: eventType,
      metadata: {
        timestamp: new Date().toISOString(),
        ...metadata
      }
    });
  }

  static async logError(walletAddress: string, error: any, context?: any): Promise<void> {
    await this.sendToAPI('/api/log', {
      type: 'error',
      walletAddress,
      error: error.toString(),
      context: {
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        ...context
      }
    });
  }
}

// Export as default for backward compatibility
export default ClientComprehensiveLogger;