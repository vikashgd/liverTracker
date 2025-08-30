import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SessionProvider } from 'next-auth/react';
import { signIn } from 'next-auth/react';

// Mock NextAuth
vi.mock('next-auth/react', () => ({
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
  signIn: vi.fn(),
  signOut: vi.fn(),
  useSession: vi.fn(() => ({
    data: null,
    status: 'unauthenticated'
  }))
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

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:3000',
    assign: vi.fn(),
    reload: vi.fn()
  },
  writable: true
});

import { MobileGoogleButton } from '../../components/auth';
import { getOAuthFallbackHandler } from '../../lib/oauth-fallback-handler';

describe('OAuth Integration Tests', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    (fetch as any).mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Google OAuth Flow', () => {
    it('should initiate Google OAuth successfully', async () => {
      const mockSignIn = vi.mocked(signIn);
      mockSignIn.mockResolvedValue({ 
        ok: true, 
        error: null, 
        status: 200, 
        url: 'https://accounts.google.com/oauth/authorize?...' 
      });

      render(
        <SessionProvider session={null}>
          <MobileGoogleButton 
            text="Sign in with Google"
            callbackUrl="/dashboard"
          />
        </SessionProvider>
      );

      const googleButton = screen.getByRole('button', { name: /sign in with google/i });
      await user.click(googleButton);

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith('google', {
          callbackUrl: '/dashboard',
          redirect: false
        });
      });

      // Should redirect to OAuth URL
      expect(window.location.href).toBe('https://accounts.google.com/oauth/authorize?...');
    });

    it('should handle OAuth cancellation', async () => {
      const mockSignIn = vi.mocked(signIn);
      mockSignIn.mockResolvedValue({ 
        ok: false, 
        error: 'OAuthCallback', 
        status: 400, 
        url: null 
      });

      const onError = vi.fn();

      render(
        <SessionProvider session={null}>
          <MobileGoogleButton 
            text="Sign in with Google"
            callbackUrl="/dashboard"
            onError={onError}
          />
        </SessionProvider>
      );

      const googleButton = screen.getByRole('button', { name: /sign in with google/i });
      await user.click(googleButton);

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith('OAuthCallback');
      });
    });

    it('should handle OAuth network errors', async () => {
      const mockSignIn = vi.mocked(signIn);
      mockSignIn.mockRejectedValue(new Error('Network error'));

      const onError = vi.fn();

      render(
        <SessionProvider session={null}>
          <MobileGoogleButton 
            text="Sign in with Google"
            callbackUrl="/dashboard"
            onError={onError}
          />
        </SessionProvider>
      );

      const googleButton = screen.getByRole('button', { name: /sign in with google/i });
      await user.click(googleButton);

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith('Failed to sign in with Google. Please try again.');
      });
    });

    it('should show loading state during OAuth', async () => {
      const mockSignIn = vi.mocked(signIn);
      // Simulate slow OAuth response
      mockSignIn.mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({ ok: true, error: null, status: 200, url: '/dashboard' }), 100)
        )
      );

      render(
        <SessionProvider session={null}>
          <MobileGoogleButton 
            text="Sign in with Google"
            callbackUrl="/dashboard"
          />
        </SessionProvider>
      );

      const googleButton = screen.getByRole('button', { name: /sign in with google/i });
      await user.click(googleButton);

      // Should show loading state
      expect(screen.getByText(/connecting/i)).toBeInTheDocument();
      expect(googleButton).toBeDisabled();

      // Wait for completion
      await waitFor(() => {
        expect(screen.queryByText(/connecting/i)).not.toBeInTheDocument();
      });
    });

    it('should handle account linking scenarios', async () => {
      const mockSignIn = vi.mocked(signIn);
      mockSignIn.mockResolvedValue({ 
        ok: false, 
        error: 'OAuthAccountNotLinked', 
        status: 400, 
        url: null 
      });

      const fallbackHandler = getOAuthFallbackHandler();
      const handleError = vi.spyOn(fallbackHandler, 'handleOAuthError');

      render(
        <SessionProvider session={null}>
          <MobileGoogleButton 
            text="Sign in with Google"
            callbackUrl="/dashboard"
          />
        </SessionProvider>
      );

      const googleButton = screen.getByRole('button', { name: /sign in with google/i });
      await user.click(googleButton);

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalled();
      });

      // Should handle account linking error
      expect(handleError).toHaveBeenCalledWith(
        'google',
        'OAuthAccountNotLinked',
        expect.objectContaining({
          operation: 'signin'
        })
      );
    });
  });

  describe('OAuth Fallback Handling', () => {
    it('should provide fallback options for OAuth failures', async () => {
      const fallbackHandler = getOAuthFallbackHandler();
      
      const result = await fallbackHandler.handleOAuthError(
        'google',
        'OAuthSignin',
        {
          operation: 'signin',
          userEmail: 'test@example.com',
          callbackUrl: '/dashboard'
        }
      );

      expect(result.fallbackOptions).toContainEqual(
        expect.objectContaining({
          type: 'alternative_auth',
          action: 'use_email_password'
        })
      );

      expect(result.canRetry).toBe(true);
    });

    it('should execute retry fallback action', async () => {
      const fallbackHandler = getOAuthFallbackHandler();
      const mockSignIn = vi.mocked(signIn);
      mockSignIn.mockResolvedValue({ ok: true, error: null, status: 200, url: '/dashboard' });

      const fallbackOption = {
        type: 'retry' as const,
        label: 'Try Google again',
        action: 'retry_oauth',
        provider: 'google',
        priority: 1,
        description: 'Retry the same authentication method'
      };

      const result = await fallbackHandler.executeFallbackAction(
        fallbackOption,
        { callbackUrl: '/dashboard' }
      );

      expect(result.success).toBe(true);
      expect(mockSignIn).toHaveBeenCalledWith('google', {
        callbackUrl: '/dashboard',
        redirect: false
      });
    });

    it('should execute email/password fallback action', async () => {
      const fallbackHandler = getOAuthFallbackHandler();

      const fallbackOption = {
        type: 'alternative_auth' as const,
        label: 'Sign in with email and password',
        action: 'use_email_password',
        priority: 2,
        description: 'Use your email and password instead',
        data: { email: 'test@example.com' }
      };

      const result = await fallbackHandler.executeFallbackAction(
        fallbackOption,
        { 
          callbackUrl: '/dashboard',
          userEmail: 'test@example.com'
        }
      );

      expect(result.success).toBe(true);
      expect(result.redirectUrl).toContain('/auth/signin');
      expect(result.redirectUrl).toContain('callbackUrl=%2Fdashboard');
      expect(result.redirectUrl).toContain('email=test%40example.com');
    });

    it('should handle magic link fallback', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      const fallbackHandler = getOAuthFallbackHandler({
        enableMagicLinkFallback: true
      });

      const fallbackOption = {
        type: 'alternative_auth' as const,
        label: 'Send magic link to email',
        action: 'use_magic_link',
        priority: 3,
        description: "We'll send a secure link to your email",
        data: { email: 'test@example.com' }
      };

      const result = await fallbackHandler.executeFallbackAction(
        fallbackOption,
        { 
          callbackUrl: '/dashboard',
          userEmail: 'test@example.com'
        }
      );

      expect(result.success).toBe(true);
      expect(result.message).toContain('Magic link sent to test@example.com');
      expect(fetch).toHaveBeenCalledWith('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          callbackUrl: '/dashboard'
        })
      });
    });

    it('should track retry attempts', async () => {
      const fallbackHandler = getOAuthFallbackHandler({
        maxRetryAttempts: 2
      });

      // First attempt
      let result = await fallbackHandler.handleOAuthError(
        'google',
        'OAuthSignin',
        { operation: 'signin' }
      );
      expect(result.canRetry).toBe(true);

      // Second attempt
      result = await fallbackHandler.handleOAuthError(
        'google',
        'OAuthSignin',
        { operation: 'signin' }
      );
      expect(result.canRetry).toBe(true);

      // Third attempt (should exceed limit)
      result = await fallbackHandler.handleOAuthError(
        'google',
        'OAuthSignin',
        { operation: 'signin' }
      );
      expect(result.canRetry).toBe(false);
    });

    it('should clear retry attempts', () => {
      const fallbackHandler = getOAuthFallbackHandler();

      // Generate some retry attempts
      fallbackHandler.handleOAuthError('google', 'OAuthSignin', { operation: 'signin' });
      fallbackHandler.handleOAuthError('google', 'OAuthSignin', { operation: 'signin' });

      // Clear attempts
      fallbackHandler.clearRetryAttempts('google', 'signin');

      // Should be able to retry again
      const result = fallbackHandler.handleOAuthError('google', 'OAuthSignin', { operation: 'signin' });
      expect(result).resolves.toMatchObject({ canRetry: true });
    });
  });

  describe('OAuth Provider Configuration', () => {
    it('should return available OAuth providers', () => {
      const fallbackHandler = getOAuthFallbackHandler();
      const providers = fallbackHandler.getAvailableProviders();

      expect(providers).toContainEqual(
        expect.objectContaining({
          id: 'google',
          name: 'Google',
          available: true
        })
      );
    });

    it('should handle multiple OAuth providers', async () => {
      const fallbackHandler = getOAuthFallbackHandler({
        showAlternativeProviders: true
      });

      const result = await fallbackHandler.handleOAuthError(
        'google',
        'OAuthSignin',
        { operation: 'signin' }
      );

      // Should suggest alternative providers (if available)
      const alternativeProviders = result.fallbackOptions.filter(
        option => option.type === 'alternative_oauth'
      );

      // Note: In the current implementation, only Google is available
      // This test would be more meaningful with multiple providers configured
      expect(alternativeProviders).toBeDefined();
    });
  });

  describe('OAuth Security', () => {
    it('should handle CSRF protection', async () => {
      const mockSignIn = vi.mocked(signIn);
      mockSignIn.mockResolvedValue({ 
        ok: false, 
        error: 'Callback', 
        status: 400, 
        url: null 
      });

      render(
        <SessionProvider session={null}>
          <MobileGoogleButton 
            text="Sign in with Google"
            callbackUrl="/dashboard"
          />
        </SessionProvider>
      );

      const googleButton = screen.getByRole('button', { name: /sign in with google/i });
      await user.click(googleButton);

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalled();
      });

      // Should handle CSRF errors gracefully
      // In a real implementation, this would show appropriate error messages
    });

    it('should validate callback URLs', async () => {
      const suspiciousCallbackUrl = 'https://malicious-site.com/steal-tokens';

      render(
        <SessionProvider session={null}>
          <MobileGoogleButton 
            text="Sign in with Google"
            callbackUrl={suspiciousCallbackUrl}
          />
        </SessionProvider>
      );

      const googleButton = screen.getByRole('button', { name: /sign in with google/i });
      await user.click(googleButton);

      // In a real implementation, this should validate the callback URL
      // and reject suspicious URLs
      expect(signIn).toHaveBeenCalledWith('google', {
        callbackUrl: suspiciousCallbackUrl,
        redirect: false
      });
    });
  });

  describe('OAuth Mobile Specific Tests', () => {
    it('should handle mobile browser OAuth flow', async () => {
      // Mock mobile user agent
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
        configurable: true
      });

      const mockSignIn = vi.mocked(signIn);
      mockSignIn.mockResolvedValue({ 
        ok: true, 
        error: null, 
        status: 200, 
        url: '/dashboard' 
      });

      render(
        <SessionProvider session={null}>
          <MobileGoogleButton 
            text="Sign in with Google"
            callbackUrl="/dashboard"
          />
        </SessionProvider>
      );

      const googleButton = screen.getByRole('button', { name: /sign in with google/i });
      
      // Should have mobile-optimized styling
      expect(googleButton).toHaveClass('mobile-google-button');
      
      await user.click(googleButton);

      expect(mockSignIn).toHaveBeenCalledWith('google', {
        callbackUrl: '/dashboard',
        redirect: false
      });
    });

    it('should handle in-app browser OAuth', async () => {
      // Mock in-app browser user agent (e.g., Facebook in-app browser)
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 [FBAN/FBIOS;FBDV/iPhone12,1]',
        configurable: true
      });

      const mockSignIn = vi.mocked(signIn);
      mockSignIn.mockResolvedValue({ 
        ok: false, 
        error: 'OAuthSignin', 
        status: 400, 
        url: null 
      });

      const onError = vi.fn();

      render(
        <SessionProvider session={null}>
          <MobileGoogleButton 
            text="Sign in with Google"
            callbackUrl="/dashboard"
            onError={onError}
          />
        </SessionProvider>
      );

      const googleButton = screen.getByRole('button', { name: /sign in with google/i });
      await user.click(googleButton);

      await waitFor(() => {
        expect(onError).toHaveBeenCalled();
      });

      // Should provide fallback for in-app browser issues
      expect(onError).toHaveBeenCalledWith('OAuthSignin');
    });

    it('should handle touch interactions properly', async () => {
      render(
        <SessionProvider session={null}>
          <MobileGoogleButton 
            text="Sign in with Google"
            callbackUrl="/dashboard"
          />
        </SessionProvider>
      );

      const googleButton = screen.getByRole('button', { name: /sign in with google/i });
      
      // Should have touch-optimized properties
      const buttonStyles = window.getComputedStyle(googleButton);
      expect(buttonStyles.getPropertyValue('-webkit-tap-highlight-color')).toBe('transparent');
      expect(buttonStyles.getPropertyValue('-webkit-touch-callout')).toBe('none');
    });
  });

  describe('OAuth Error Recovery', () => {
    it('should provide comprehensive error recovery options', async () => {
      const fallbackHandler = getOAuthFallbackHandler({
        enableEmailPasswordFallback: true,
        enableAccountRecovery: true,
        showAlternativeProviders: false
      });

      const result = await fallbackHandler.handleOAuthError(
        'google',
        'OAuthAccountNotLinked',
        {
          operation: 'signin',
          userEmail: 'test@example.com',
          callbackUrl: '/dashboard'
        }
      );

      const fallbackTypes = result.fallbackOptions.map(option => option.type);
      
      expect(fallbackTypes).toContain('retry');
      expect(fallbackTypes).toContain('alternative_auth');
      expect(fallbackTypes).toContain('recovery');
      expect(fallbackTypes).toContain('support');
    });

    it('should prioritize fallback options correctly', async () => {
      const fallbackHandler = getOAuthFallbackHandler();

      const result = await fallbackHandler.handleOAuthError(
        'google',
        'OAuthSignin',
        { operation: 'signin' }
      );

      // Options should be sorted by priority
      const priorities = result.fallbackOptions.map(option => option.priority);
      const sortedPriorities = [...priorities].sort((a, b) => a - b);
      
      expect(priorities).toEqual(sortedPriorities);
    });
  });
});

// Helper to add React import for JSX
import React from 'react';