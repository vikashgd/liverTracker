import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SessionProvider, useSession } from 'next-auth/react';

// Mock NextAuth
const mockUseSession = vi.fn();
vi.mock('next-auth/react', () => ({
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
  useSession: () => mockUseSession(),
  signOut: vi.fn()
}));

// Mock fetch
global.fetch = vi.fn();

// Mock router
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    back: vi.fn()
  }),
  useSearchParams: () => ({
    get: vi.fn(() => null)
  })
}));

// Mock timers
vi.useFakeTimers();

import { SessionTimeoutWarning } from '../../components/auth';
import { getMobileSessionManager } from '../../lib/mobile-session-utils';
import { getAuthLogger } from '../../lib/auth-logger';

describe('Session Management Integration Tests', () => {
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

  beforeEach(() => {
    vi.clearAllMocks();
    (fetch as any).mockClear();
    vi.clearAllTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  describe('Session Timeout Warning', () => {
    it('should show warning when session is about to expire', async () => {
      const mockSession = {
        user: { id: 'user-123', email: 'test@example.com' },
        expires: new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 minutes from now
      };

      mockUseSession.mockReturnValue({
        data: mockSession,
        status: 'authenticated',
        update: vi.fn()
      });

      const onExtendSession = vi.fn();
      const onSignOut = vi.fn();

      render(
        <SessionProvider session={mockSession}>
          <SessionTimeoutWarning
            onExtendSession={onExtendSession}
            onSignOut={onSignOut}
          />
        </SessionProvider>
      );

      // Fast-forward to trigger warning (4 minutes remaining)
      vi.advanceTimersByTime(60 * 1000); // 1 minute

      await waitFor(() => {
        expect(screen.getByText(/session will expire/i)).toBeInTheDocument();
      });

      // Test extend session
      const extendButton = screen.getByRole('button', { name: /extend session/i });
      await user.click(extendButton);

      expect(onExtendSession).toHaveBeenCalled();
    });

    it('should auto-sign out when session expires', async () => {
      const mockSession = {
        user: { id: 'user-123', email: 'test@example.com' },
        expires: new Date(Date.now() + 2 * 60 * 1000).toISOString() // 2 minutes from now
      };

      mockUseSession.mockReturnValue({
        data: mockSession,
        status: 'authenticated',
        update: vi.fn()
      });

      const onSignOut = vi.fn();

      render(
        <SessionProvider session={mockSession}>
          <SessionTimeoutWarning
            onExtendSession={vi.fn()}
            onSignOut={onSignOut}
          />
        </SessionProvider>
      );

      // Fast-forward past expiration
      vi.advanceTimersByTime(3 * 60 * 1000); // 3 minutes

      await waitFor(() => {
        expect(onSignOut).toHaveBeenCalled();
      });
    });

    it('should handle session extension', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      const mockSession = {
        user: { id: 'user-123', email: 'test@example.com' },
        expires: new Date(Date.now() + 5 * 60 * 1000).toISOString()
      };

      mockUseSession.mockReturnValue({
        data: mockSession,
        status: 'authenticated',
        update: vi.fn()
      });

      const onExtendSession = vi.fn(async () => {
        await fetch('/api/auth/session', {
          method: 'GET',
          credentials: 'include'
        });
      });

      render(
        <SessionProvider session={mockSession}>
          <SessionTimeoutWarning
            onExtendSession={onExtendSession}
            onSignOut={vi.fn()}
          />
        </SessionProvider>
      );

      // Trigger warning
      vi.advanceTimersByTime(60 * 1000);

      await waitFor(() => {
        expect(screen.getByText(/session will expire/i)).toBeInTheDocument();
      });

      const extendButton = screen.getByRole('button', { name: /extend session/i });
      await user.click(extendButton);

      expect(fetch).toHaveBeenCalledWith('/api/auth/session', {
        method: 'GET',
        credentials: 'include'
      });
    });
  });

  describe('Mobile Session Persistence', () => {
    it('should persist session data in mobile storage', () => {
      const sessionManager = getMobileSessionManager();
      
      const sessionData = {
        token: 'test-token',
        userId: 'user-123',
        email: 'test@example.com',
        expiresAt: Date.now() + 60 * 60 * 1000 // 1 hour
      };

      const success = sessionManager.storeSession(sessionData);
      expect(success).toBe(true);

      const retrievedSession = sessionManager.getSession();
      expect(retrievedSession).toMatchObject({
        token: 'test-token',
        userId: 'user-123',
        email: 'test@example.com'
      });
    });

    it('should handle session expiry in mobile storage', () => {
      const sessionManager = getMobileSessionManager();
      
      const expiredSessionData = {
        token: 'expired-token',
        userId: 'user-123',
        email: 'test@example.com',
        expiresAt: Date.now() - 60 * 1000 // 1 minute ago
      };

      sessionManager.storeSession(expiredSessionData);
      
      const retrievedSession = sessionManager.getSession();
      expect(retrievedSession).toBeNull();
    });

    it('should update activity timestamp', () => {
      const sessionManager = getMobileSessionManager();
      
      const sessionData = {
        token: 'test-token',
        userId: 'user-123',
        email: 'test@example.com',
        expiresAt: Date.now() + 60 * 60 * 1000
      };

      sessionManager.storeSession(sessionData);
      
      const beforeUpdate = Date.now();
      sessionManager.updateActivity();
      
      const session = sessionManager.getSession();
      expect(session?.lastActivity).toBeGreaterThanOrEqual(beforeUpdate);
    });

    it('should handle app state changes', () => {
      const sessionManager = getMobileSessionManager();
      
      const sessionData = {
        token: 'test-token',
        userId: 'user-123',
        email: 'test@example.com',
        expiresAt: Date.now() + 60 * 60 * 1000
      };

      sessionManager.storeSession(sessionData);

      // Simulate app going to background
      sessionManager.handleAppStateChange('background');
      
      // Simulate app becoming active
      sessionManager.handleAppStateChange('active');
      
      const session = sessionManager.getSession();
      expect(session).toBeDefined();
    });

    it('should handle network connectivity changes', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ valid: true, token: 'new-token' })
      });

      const sessionManager = getMobileSessionManager();
      
      const sessionData = {
        token: 'test-token',
        userId: 'user-123',
        email: 'test@example.com',
        expiresAt: Date.now() + 60 * 60 * 1000
      };

      sessionManager.storeSession(sessionData);

      // Simulate network coming back online
      sessionManager.handleNetworkChange(true);

      // Should validate session with server
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/auth/validate-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token'
          },
          body: expect.stringContaining('user-123')
        });
      });
    });
  });

  describe('Session Security Validation', () => {
    it('should validate session security on protected routes', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ valid: true })
      });

      const mockSession = {
        user: { id: 'user-123', email: 'test@example.com' },
        expires: new Date(Date.now() + 60 * 60 * 1000).toISOString()
      };

      mockUseSession.mockReturnValue({
        data: mockSession,
        status: 'authenticated',
        update: vi.fn()
      });

      // Mock protected route component
      const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
        const { data: session, status } = useSession();
        
        React.useEffect(() => {
          if (session) {
            // Validate session security
            fetch('/api/auth/session', {
              method: 'GET',
              credentials: 'include'
            });
          }
        }, [session]);

        if (status === 'loading') return <div>Loading...</div>;
        if (!session) return <div>Please sign in</div>;
        
        return <div>{children}</div>;
      };

      render(
        <SessionProvider session={mockSession}>
          <ProtectedRoute>
            <div>Protected content</div>
          </ProtectedRoute>
        </SessionProvider>
      );

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/auth/session', {
          method: 'GET',
          credentials: 'include'
        });
      });

      expect(screen.getByText('Protected content')).toBeInTheDocument();
    });

    it('should handle invalid session validation', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401
      });

      const mockSession = {
        user: { id: 'user-123', email: 'test@example.com' },
        expires: new Date(Date.now() + 60 * 60 * 1000).toISOString()
      };

      mockUseSession.mockReturnValue({
        data: mockSession,
        status: 'authenticated',
        update: vi.fn()
      });

      const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
        const { data: session } = useSession();
        const [isValid, setIsValid] = React.useState(true);
        
        React.useEffect(() => {
          if (session) {
            fetch('/api/auth/session', {
              method: 'GET',
              credentials: 'include'
            }).then(response => {
              if (!response.ok) {
                setIsValid(false);
              }
            });
          }
        }, [session]);

        if (!isValid) return <div>Session invalid</div>;
        if (!session) return <div>Please sign in</div>;
        
        return <div>{children}</div>;
      };

      render(
        <SessionProvider session={mockSession}>
          <ProtectedRoute>
            <div>Protected content</div>
          </ProtectedRoute>
        </SessionProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Session invalid')).toBeInTheDocument();
      });
    });
  });

  describe('Session Logging and Monitoring', () => {
    it('should log session events', () => {
      const logger = getAuthLogger();
      const logSessionSpy = vi.spyOn(logger, 'logSessionEvent');

      const sessionManager = getMobileSessionManager();
      
      const sessionData = {
        token: 'test-token',
        userId: 'user-123',
        email: 'test@example.com',
        expiresAt: Date.now() + 60 * 60 * 1000
      };

      sessionManager.storeSession(sessionData);

      // Should log session creation
      expect(logSessionSpy).toHaveBeenCalledWith(
        'created',
        expect.any(String),
        'user-123',
        expect.any(Object)
      );
    });

    it('should track session statistics', () => {
      const sessionManager = getMobileSessionManager();
      
      // Create multiple sessions
      for (let i = 0; i < 5; i++) {
        sessionManager.storeSession({
          token: `token-${i}`,
          userId: `user-${i}`,
          email: `user${i}@example.com`,
          expiresAt: Date.now() + 60 * 60 * 1000
        });
      }

      const timeUntilExpiry = sessionManager.getTimeUntilExpiry();
      expect(timeUntilExpiry).toBeGreaterThan(0);
    });

    it('should handle session warnings and expiry callbacks', async () => {
      const sessionManager = getMobileSessionManager();
      
      const warningCallback = vi.fn();
      const expiryCallback = vi.fn();
      
      const removeWarningCallback = sessionManager.onSessionWarning(warningCallback);
      const removeExpiryCallback = sessionManager.onSessionExpiry(expiryCallback);

      // Create session that will expire soon
      sessionManager.storeSession({
        token: 'test-token',
        userId: 'user-123',
        email: 'test@example.com',
        expiresAt: Date.now() + 2 * 60 * 1000 // 2 minutes
      });

      // Fast-forward to trigger warning
      vi.advanceTimersByTime(60 * 1000); // 1 minute

      await waitFor(() => {
        expect(warningCallback).toHaveBeenCalled();
      });

      // Fast-forward to trigger expiry
      vi.advanceTimersByTime(2 * 60 * 1000); // 2 more minutes

      await waitFor(() => {
        expect(expiryCallback).toHaveBeenCalled();
      });

      // Clean up callbacks
      removeWarningCallback();
      removeExpiryCallback();
    });
  });

  describe('Concurrent Session Handling', () => {
    it('should detect concurrent sessions', () => {
      const logger = getAuthLogger();
      
      // Simulate logins from different IPs for same user
      const userId = 'user-123';
      const ips = ['192.168.1.1', '10.0.0.1', '172.16.0.1'];
      
      ips.forEach(ip => {
        logger.logLoginAttempt(userId, ip, 'Mozilla/5.0', true);
      });

      const securityEvents = logger.getSecurityEvents({ 
        type: 'suspicious_activity',
        userId 
      });

      const concurrentSessionEvent = securityEvents.find(
        event => event.metadata?.reason === 'multiple_ip_logins'
      );

      expect(concurrentSessionEvent).toBeDefined();
    });

    it('should handle session conflicts', async () => {
      const mockSession1 = {
        user: { id: 'user-123', email: 'test@example.com' },
        expires: new Date(Date.now() + 60 * 60 * 1000).toISOString()
      };

      const mockSession2 = {
        user: { id: 'user-123', email: 'test@example.com' },
        expires: new Date(Date.now() + 60 * 60 * 1000).toISOString()
      };

      // Mock component that handles session conflicts
      const SessionConflictHandler = () => {
        const { data: session } = useSession();
        const [hasConflict, setHasConflict] = React.useState(false);

        React.useEffect(() => {
          if (session) {
            // Check for concurrent sessions
            fetch('/api/auth/sessions')
              .then(response => response.json())
              .then(data => {
                if (data.sessions && data.sessions.length > 1) {
                  setHasConflict(true);
                }
              });
          }
        }, [session]);

        if (hasConflict) {
          return (
            <div>
              <p>Multiple sessions detected</p>
              <button onClick={() => setHasConflict(false)}>
                Continue Here
              </button>
            </div>
          );
        }

        return <div>Single session active</div>;
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          sessions: [
            { id: 'session-1', createdAt: Date.now() - 60000 },
            { id: 'session-2', createdAt: Date.now() }
          ]
        })
      });

      mockUseSession.mockReturnValue({
        data: mockSession1,
        status: 'authenticated',
        update: vi.fn()
      });

      render(
        <SessionProvider session={mockSession1}>
          <SessionConflictHandler />
        </SessionProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Multiple sessions detected')).toBeInTheDocument();
      });

      const continueButton = screen.getByRole('button', { name: /continue here/i });
      await user.click(continueButton);

      expect(screen.getByText('Single session active')).toBeInTheDocument();
    });
  });

  describe('Session Recovery', () => {
    it('should recover from storage on app restart', () => {
      const sessionManager = getMobileSessionManager();
      
      // Store session
      const sessionData = {
        token: 'persistent-token',
        userId: 'user-123',
        email: 'test@example.com',
        expiresAt: Date.now() + 60 * 60 * 1000
      };

      sessionManager.storeSession(sessionData);

      // Simulate app restart by creating new session manager
      const newSessionManager = getMobileSessionManager();
      const recoveredSession = newSessionManager.getSession();

      expect(recoveredSession).toMatchObject({
        token: 'persistent-token',
        userId: 'user-123',
        email: 'test@example.com'
      });
    });

    it('should handle corrupted session data', () => {
      // Manually corrupt localStorage
      localStorage.setItem('livertrack_mobile_session', 'corrupted-json');

      const sessionManager = getMobileSessionManager();
      const session = sessionManager.getSession();

      expect(session).toBeNull();
    });

    it('should fallback to sessionStorage when localStorage fails', () => {
      const sessionManager = getMobileSessionManager();
      
      const sessionData = {
        token: 'fallback-token',
        userId: 'user-123',
        email: 'test@example.com',
        expiresAt: Date.now() + 60 * 60 * 1000
      };

      // Store in both storages
      sessionManager.storeSession(sessionData);

      // Clear localStorage but keep sessionStorage
      localStorage.removeItem('livertrack_mobile_session');

      const recoveredSession = sessionManager.getSession();
      expect(recoveredSession).toMatchObject({
        token: 'fallback-token',
        userId: 'user-123'
      });
    });
  });
});

// Helper to add React import for JSX
import React from 'react';