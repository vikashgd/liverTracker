/**
 * Mobile session persistence utilities
 * Handles session management across mobile browser sessions and app states
 */

interface SessionData {
  token: string;
  userId: string;
  email: string;
  expiresAt: number;
  lastActivity: number;
}

interface MobileSessionConfig {
  storageKey: string;
  maxAge: number; // in milliseconds
  checkInterval: number; // in milliseconds
  warningThreshold: number; // in milliseconds before expiry
}

const DEFAULT_CONFIG: MobileSessionConfig = {
  storageKey: 'livertrack_mobile_session',
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  checkInterval: 60 * 1000, // 1 minute
  warningThreshold: 5 * 60 * 1000 // 5 minutes
};

class MobileSessionManager {
  private config: MobileSessionConfig;
  private checkTimer: NodeJS.Timeout | null = null;
  private warningCallbacks: Array<(timeLeft: number) => void> = [];
  private expiryCallbacks: Array<() => void> = [];

  constructor(config: Partial<MobileSessionConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Store session data with mobile-specific optimizations
   */
  storeSession(sessionData: Omit<SessionData, 'lastActivity'>): boolean {
    try {
      const data: SessionData = {
        ...sessionData,
        lastActivity: Date.now()
      };

      // Use localStorage for persistence across browser sessions
      localStorage.setItem(this.config.storageKey, JSON.stringify(data));
      
      // Also store in sessionStorage as backup
      sessionStorage.setItem(this.config.storageKey + '_backup', JSON.stringify(data));
      
      this.startSessionCheck();
      return true;
    } catch (error) {
      console.error('Failed to store mobile session:', error);
      return false;
    }
  }

  /**
   * Retrieve session data with validation
   */
  getSession(): SessionData | null {
    try {
      // Try localStorage first
      let dataStr = localStorage.getItem(this.config.storageKey);
      
      // Fallback to sessionStorage
      if (!dataStr) {
        dataStr = sessionStorage.getItem(this.config.storageKey + '_backup');
      }

      if (!dataStr) return null;

      const data: SessionData = JSON.parse(dataStr);
      
      // Validate session
      if (this.isSessionExpired(data)) {
        this.clearSession();
        return null;
      }

      // Update last activity
      data.lastActivity = Date.now();
      this.storeSession(data);

      return data;
    } catch (error) {
      console.error('Failed to retrieve mobile session:', error);
      this.clearSession();
      return null;
    }
  }

  /**
   * Update session activity timestamp
   */
  updateActivity(): void {
    const session = this.getSession();
    if (session) {
      session.lastActivity = Date.now();
      this.storeSession(session);
    }
  }

  /**
   * Clear session data
   */
  clearSession(): void {
    try {
      localStorage.removeItem(this.config.storageKey);
      sessionStorage.removeItem(this.config.storageKey + '_backup');
      this.stopSessionCheck();
    } catch (error) {
      console.error('Failed to clear mobile session:', error);
    }
  }

  /**
   * Check if session is expired
   */
  isSessionExpired(session: SessionData): boolean {
    const now = Date.now();
    return now > session.expiresAt || (now - session.lastActivity) > this.config.maxAge;
  }

  /**
   * Get time until session expires
   */
  getTimeUntilExpiry(): number {
    const session = this.getSession();
    if (!session) return 0;

    const now = Date.now();
    const expiryTime = Math.min(
      session.expiresAt,
      session.lastActivity + this.config.maxAge
    );

    return Math.max(0, expiryTime - now);
  }

  /**
   * Start periodic session checking
   */
  private startSessionCheck(): void {
    if (this.checkTimer) return;

    this.checkTimer = setInterval(() => {
      const session = this.getSession();
      if (!session) {
        this.triggerExpiryCallbacks();
        return;
      }

      const timeLeft = this.getTimeUntilExpiry();
      
      if (timeLeft <= 0) {
        this.clearSession();
        this.triggerExpiryCallbacks();
      } else if (timeLeft <= this.config.warningThreshold) {
        this.triggerWarningCallbacks(timeLeft);
      }
    }, this.config.checkInterval);
  }

  /**
   * Stop session checking
   */
  private stopSessionCheck(): void {
    if (this.checkTimer) {
      clearInterval(this.checkTimer);
      this.checkTimer = null;
    }
  }

  /**
   * Add callback for session expiry warnings
   */
  onSessionWarning(callback: (timeLeft: number) => void): () => void {
    this.warningCallbacks.push(callback);
    return () => {
      const index = this.warningCallbacks.indexOf(callback);
      if (index > -1) {
        this.warningCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Add callback for session expiry
   */
  onSessionExpiry(callback: () => void): () => void {
    this.expiryCallbacks.push(callback);
    return () => {
      const index = this.expiryCallbacks.indexOf(callback);
      if (index > -1) {
        this.expiryCallbacks.splice(index, 1);
      }
    };
  }

  private triggerWarningCallbacks(timeLeft: number): void {
    this.warningCallbacks.forEach(callback => {
      try {
        callback(timeLeft);
      } catch (error) {
        console.error('Session warning callback error:', error);
      }
    });
  }

  private triggerExpiryCallbacks(): void {
    this.expiryCallbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('Session expiry callback error:', error);
      }
    });
  }

  /**
   * Handle mobile app state changes
   */
  handleAppStateChange(state: 'active' | 'background' | 'inactive'): void {
    switch (state) {
      case 'active':
        // App became active, update activity and check session
        this.updateActivity();
        this.startSessionCheck();
        break;
      case 'background':
      case 'inactive':
        // App went to background, stop checking to save battery
        this.stopSessionCheck();
        break;
    }
  }

  /**
   * Handle network connectivity changes
   */
  handleNetworkChange(isOnline: boolean): void {
    if (isOnline) {
      // Network restored, validate session with server
      this.validateSessionWithServer();
    }
  }

  /**
   * Validate session with server
   */
  private async validateSessionWithServer(): Promise<boolean> {
    const session = this.getSession();
    if (!session) return false;

    try {
      const response = await fetch('/api/auth/validate-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.token}`
        },
        body: JSON.stringify({
          userId: session.userId,
          lastActivity: session.lastActivity
        })
      });

      if (!response.ok) {
        this.clearSession();
        this.triggerExpiryCallbacks();
        return false;
      }

      const data = await response.json();
      if (data.valid) {
        // Update session with server response
        this.storeSession({
          token: data.token || session.token,
          userId: session.userId,
          email: session.email,
          expiresAt: data.expiresAt || session.expiresAt
        });
        return true;
      } else {
        this.clearSession();
        this.triggerExpiryCallbacks();
        return false;
      }
    } catch (error) {
      console.error('Session validation error:', error);
      // Don't clear session on network errors, just log
      return false;
    }
  }
}

// Global instance
let mobileSessionManager: MobileSessionManager | null = null;

export function getMobileSessionManager(config?: Partial<MobileSessionConfig>): MobileSessionManager {
  if (!mobileSessionManager) {
    mobileSessionManager = new MobileSessionManager(config);
  }
  return mobileSessionManager;
}

/**
 * Hook for mobile session management
 */
export function useMobileSession() {
  const sessionManager = getMobileSessionManager();

  const storeSession = (sessionData: Omit<SessionData, 'lastActivity'>) => {
    return sessionManager.storeSession(sessionData);
  };

  const getSession = () => {
    return sessionManager.getSession();
  };

  const clearSession = () => {
    sessionManager.clearSession();
  };

  const updateActivity = () => {
    sessionManager.updateActivity();
  };

  const getTimeUntilExpiry = () => {
    return sessionManager.getTimeUntilExpiry();
  };

  const onSessionWarning = (callback: (timeLeft: number) => void) => {
    return sessionManager.onSessionWarning(callback);
  };

  const onSessionExpiry = (callback: () => void) => {
    return sessionManager.onSessionExpiry(callback);
  };

  return {
    storeSession,
    getSession,
    clearSession,
    updateActivity,
    getTimeUntilExpiry,
    onSessionWarning,
    onSessionExpiry
  };
}

/**
 * Initialize mobile session handling
 */
export function initializeMobileSession() {
  if (typeof window === 'undefined') return;

  const sessionManager = getMobileSessionManager();

  // Handle page visibility changes
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      sessionManager.handleAppStateChange('active');
    } else {
      sessionManager.handleAppStateChange('background');
    }
  });

  // Handle online/offline events
  window.addEventListener('online', () => {
    sessionManager.handleNetworkChange(true);
  });

  window.addEventListener('offline', () => {
    sessionManager.handleNetworkChange(false);
  });

  // Handle beforeunload to update activity
  window.addEventListener('beforeunload', () => {
    sessionManager.updateActivity();
  });

  // Handle focus/blur events
  window.addEventListener('focus', () => {
    sessionManager.handleAppStateChange('active');
  });

  window.addEventListener('blur', () => {
    sessionManager.handleAppStateChange('inactive');
  });
}

/**
 * Utility functions for mobile session handling
 */
export const mobileSessionUtils = {
  formatTimeLeft: (milliseconds: number): string => {
    const minutes = Math.floor(milliseconds / (1000 * 60));
    const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  },

  isLowBattery: (): boolean => {
    if ('getBattery' in navigator) {
      // @ts-ignore - Battery API is experimental
      return navigator.getBattery().then((battery: any) => {
        return battery.level < 0.2 && !battery.charging;
      });
    }
    return false;
  },

  shouldReduceActivity: (): boolean => {
    // Reduce session checking frequency on low battery or slow connection
    if ('connection' in navigator) {
      // @ts-ignore - Network Information API
      const connection = (navigator as any).connection;
      return connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g';
    }
    return false;
  }
};