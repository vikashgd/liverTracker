/**
 * OAuth fallback handling system
 * Provides graceful fallbacks when OAuth authentication fails
 */

import { getAuthErrorManager, authErrorUtils } from "./auth-error-manager";

export interface OAuthFallbackOptions {
  enableEmailPasswordFallback: boolean;
  enableMagicLinkFallback: boolean;
  enableAccountRecovery: boolean;
  showAlternativeProviders: boolean;
  maxRetryAttempts: number;
  retryDelay: number;
}

export interface OAuthProvider {
  id: string;
  name: string;
  icon: string;
  available: boolean;
  fallbackPriority: number;
}

const DEFAULT_FALLBACK_OPTIONS: OAuthFallbackOptions = {
  enableEmailPasswordFallback: true,
  enableMagicLinkFallback: false,
  enableAccountRecovery: true,
  showAlternativeProviders: false,
  maxRetryAttempts: 3,
  retryDelay: 2000
};

const OAUTH_PROVIDERS: OAuthProvider[] = [
  {
    id: 'google',
    name: 'Google',
    icon: 'google',
    available: true,
    fallbackPriority: 1
  },
  {
    id: 'github',
    name: 'GitHub',
    icon: 'github',
    available: false,
    fallbackPriority: 2
  },
  {
    id: 'microsoft',
    name: 'Microsoft',
    icon: 'microsoft',
    available: false,
    fallbackPriority: 3
  }
];

export class OAuthFallbackHandler {
  private options: OAuthFallbackOptions;
  private retryAttempts: Map<string, number> = new Map();
  private errorManager = getAuthErrorManager();

  constructor(options: Partial<OAuthFallbackOptions> = {}) {
    this.options = { ...DEFAULT_FALLBACK_OPTIONS, ...options };
  }

  /**
   * Handle OAuth error and provide fallback options
   */
  async handleOAuthError(
    provider: string,
    error: string | Error,
    context: {
      operation: 'signin' | 'signup' | 'link';
      userEmail?: string;
      callbackUrl?: string;
    }
  ): Promise<{
    authError: any;
    fallbackOptions: FallbackOption[];
    canRetry: boolean;
    retryDelay?: number;
  }> {
    // Create structured error
    const authError = typeof error === 'string' 
      ? authErrorUtils.handleNextAuthError(error)
      : this.errorManager.createError(error, {
          operation: `oauth_${context.operation}`,
          additionalData: { provider, ...context }
        });

    // Track retry attempts
    const retryKey = `${provider}_${context.operation}`;
    const currentAttempts = this.retryAttempts.get(retryKey) || 0;
    this.retryAttempts.set(retryKey, currentAttempts + 1);

    // Determine if retry is possible
    const canRetry = currentAttempts < this.options.maxRetryAttempts;
    const retryDelay = canRetry ? this.calculateRetryDelay(currentAttempts) : undefined;

    // Generate fallback options
    const fallbackOptions = this.generateFallbackOptions(provider, context, authError);

    return {
      authError,
      fallbackOptions,
      canRetry,
      retryDelay
    };
  }

  /**
   * Generate appropriate fallback options based on error and context
   */
  private generateFallbackOptions(
    provider: string,
    context: {
      operation: 'signin' | 'signup' | 'link';
      userEmail?: string;
      callbackUrl?: string;
    },
    authError: any
  ): FallbackOption[] {
    const options: FallbackOption[] = [];

    // Retry with same provider
    const retryKey = `${provider}_${context.operation}`;
    const currentAttempts = this.retryAttempts.get(retryKey) || 0;
    
    if (currentAttempts < this.options.maxRetryAttempts) {
      options.push({
        type: 'retry',
        label: `Try ${OAUTH_PROVIDERS.find(p => p.id === provider)?.name || provider} again`,
        action: 'retry_oauth',
        provider,
        priority: 1,
        description: 'Retry the same authentication method'
      });
    }

    // Email/Password fallback
    if (this.options.enableEmailPasswordFallback) {
      if (context.operation === 'signin') {
        options.push({
          type: 'alternative_auth',
          label: 'Sign in with email and password',
          action: 'use_email_password',
          priority: 2,
          description: 'Use your email and password instead',
          data: { email: context.userEmail }
        });
      } else if (context.operation === 'signup') {
        options.push({
          type: 'alternative_auth',
          label: 'Create account with email and password',
          action: 'use_email_password',
          priority: 2,
          description: 'Create your account using email and password',
          data: { email: context.userEmail }
        });
      }
    }

    // Magic link fallback
    if (this.options.enableMagicLinkFallback && context.userEmail) {
      options.push({
        type: 'alternative_auth',
        label: 'Send magic link to email',
        action: 'use_magic_link',
        priority: 3,
        description: 'We\'ll send a secure link to your email',
        data: { email: context.userEmail }
      });
    }

    // Alternative OAuth providers
    if (this.options.showAlternativeProviders) {
      const alternativeProviders = OAUTH_PROVIDERS
        .filter(p => p.id !== provider && p.available)
        .sort((a, b) => a.fallbackPriority - b.fallbackPriority);

      alternativeProviders.forEach(altProvider => {
        options.push({
          type: 'alternative_oauth',
          label: `Continue with ${altProvider.name}`,
          action: 'use_alternative_oauth',
          provider: altProvider.id,
          priority: 4,
          description: `Use your ${altProvider.name} account instead`,
          icon: altProvider.icon
        });
      });
    }

    // Account recovery options
    if (this.options.enableAccountRecovery) {
      if (authError.code === 'OAUTH_ACCOUNT_LINKING_FAILED') {
        options.push({
          type: 'recovery',
          label: 'Reset password for existing account',
          action: 'reset_password',
          priority: 5,
          description: 'Reset the password for your existing account',
          data: { email: context.userEmail }
        });
      }

      options.push({
        type: 'support',
        label: 'Contact support',
        action: 'contact_support',
        priority: 10,
        description: 'Get help from our support team',
        data: { 
          error: authError.code,
          provider,
          operation: context.operation
        }
      });
    }

    // Sort by priority
    return options.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  private calculateRetryDelay(attemptNumber: number): number {
    return Math.min(
      this.options.retryDelay * Math.pow(2, attemptNumber),
      30000 // Max 30 seconds
    );
  }

  /**
   * Execute a fallback action
   */
  async executeFallbackAction(
    option: FallbackOption,
    context: {
      callbackUrl?: string;
      userEmail?: string;
    }
  ): Promise<FallbackActionResult> {
    try {
      switch (option.action) {
        case 'retry_oauth':
          return await this.retryOAuth(option.provider!, context);
        
        case 'use_email_password':
          return this.redirectToEmailPassword(context);
        
        case 'use_magic_link':
          return await this.sendMagicLink(option.data?.email || context.userEmail!, context);
        
        case 'use_alternative_oauth':
          return await this.useAlternativeOAuth(option.provider!, context);
        
        case 'reset_password':
          return this.redirectToPasswordReset(option.data?.email || context.userEmail!, context);
        
        case 'contact_support':
          return this.redirectToSupport(option.data, context);
        
        default:
          throw new Error(`Unknown fallback action: ${option.action}`);
      }
    } catch (error) {
      return {
        success: false,
        error: this.errorManager.createError(error as Error, {
          operation: 'fallback_action',
          additionalData: { action: option.action, option }
        })
      };
    }
  }

  /**
   * Retry OAuth authentication
   */
  private async retryOAuth(
    provider: string,
    context: { callbackUrl?: string }
  ): Promise<FallbackActionResult> {
    // Import signIn dynamically to avoid SSR issues
    const { signIn } = await import('next-auth/react');
    
    const result = await signIn(provider, {
      callbackUrl: context.callbackUrl || '/dashboard',
      redirect: false
    });

    if (result?.error) {
      return {
        success: false,
        error: authErrorUtils.handleNextAuthError(result.error)
      };
    }

    return {
      success: true,
      redirectUrl: result?.url || context.callbackUrl || '/dashboard'
    };
  }

  /**
   * Redirect to email/password authentication
   */
  private redirectToEmailPassword(
    context: { callbackUrl?: string; userEmail?: string }
  ): FallbackActionResult {
    const params = new URLSearchParams();
    
    if (context.callbackUrl) {
      params.set('callbackUrl', context.callbackUrl);
    }
    
    if (context.userEmail) {
      params.set('email', context.userEmail);
    }

    return {
      success: true,
      redirectUrl: `/auth/signin?${params.toString()}`
    };
  }

  /**
   * Send magic link
   */
  private async sendMagicLink(
    email: string,
    context: { callbackUrl?: string }
  ): Promise<FallbackActionResult> {
    const response = await fetch('/api/auth/magic-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        callbackUrl: context.callbackUrl
      })
    });

    if (!response.ok) {
      return {
        success: false,
        error: authErrorUtils.handleApiError(response)
      };
    }

    return {
      success: true,
      message: `Magic link sent to ${email}`,
      redirectUrl: `/auth/check-email?email=${encodeURIComponent(email)}`
    };
  }

  /**
   * Use alternative OAuth provider
   */
  private async useAlternativeOAuth(
    provider: string,
    context: { callbackUrl?: string }
  ): Promise<FallbackActionResult> {
    const { signIn } = await import('next-auth/react');
    
    const result = await signIn(provider, {
      callbackUrl: context.callbackUrl || '/dashboard',
      redirect: false
    });

    if (result?.error) {
      return {
        success: false,
        error: authErrorUtils.handleNextAuthError(result.error)
      };
    }

    return {
      success: true,
      redirectUrl: result?.url || context.callbackUrl || '/dashboard'
    };
  }

  /**
   * Redirect to password reset
   */
  private redirectToPasswordReset(
    email: string,
    context: { callbackUrl?: string }
  ): FallbackActionResult {
    const params = new URLSearchParams();
    params.set('email', email);
    
    if (context.callbackUrl) {
      params.set('callbackUrl', context.callbackUrl);
    }

    return {
      success: true,
      redirectUrl: `/auth/forgot-password?${params.toString()}`
    };
  }

  /**
   * Redirect to support
   */
  private redirectToSupport(
    errorData: any,
    context: { callbackUrl?: string }
  ): FallbackActionResult {
    const params = new URLSearchParams();
    params.set('issue', 'oauth_error');
    params.set('details', JSON.stringify(errorData));
    
    if (context.callbackUrl) {
      params.set('return_url', context.callbackUrl);
    }

    return {
      success: true,
      redirectUrl: `/support/contact?${params.toString()}`
    };
  }

  /**
   * Clear retry attempts for a provider
   */
  clearRetryAttempts(provider: string, operation?: string): void {
    if (operation) {
      this.retryAttempts.delete(`${provider}_${operation}`);
    } else {
      // Clear all attempts for this provider
      const keysToDelete = Array.from(this.retryAttempts.keys())
        .filter(key => key.startsWith(`${provider}_`));
      keysToDelete.forEach(key => this.retryAttempts.delete(key));
    }
  }

  /**
   * Get available OAuth providers
   */
  getAvailableProviders(): OAuthProvider[] {
    return OAUTH_PROVIDERS.filter(p => p.available);
  }
}

export interface FallbackOption {
  type: 'retry' | 'alternative_auth' | 'alternative_oauth' | 'recovery' | 'support';
  label: string;
  action: string;
  provider?: string;
  priority: number;
  description: string;
  icon?: string;
  data?: Record<string, any>;
}

export interface FallbackActionResult {
  success: boolean;
  error?: any;
  message?: string;
  redirectUrl?: string;
}

// Global instance
let oauthFallbackHandler: OAuthFallbackHandler | null = null;

export function getOAuthFallbackHandler(
  options?: Partial<OAuthFallbackOptions>
): OAuthFallbackHandler {
  if (!oauthFallbackHandler) {
    oauthFallbackHandler = new OAuthFallbackHandler(options);
  }
  return oauthFallbackHandler;
}