/**
 * Comprehensive authentication error management system
 * Provides centralized error handling, user-friendly messages, and fallback options
 */

export interface AuthError {
  code: string;
  message: string;
  userMessage: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'validation' | 'network' | 'server' | 'oauth' | 'security' | 'session';
  retryable: boolean;
  fallbackOptions?: string[];
  metadata?: Record<string, any>;
}

export interface ErrorContext {
  operation: string;
  userAgent?: string;
  timestamp: number;
  userId?: string;
  sessionId?: string;
  ipAddress?: string;
  additionalData?: Record<string, any>;
}

/**
 * Authentication error definitions
 */
export const AUTH_ERRORS: Record<string, Omit<AuthError, 'metadata'>> = {
  // Validation Errors
  INVALID_EMAIL: {
    code: 'INVALID_EMAIL',
    message: 'Invalid email format provided',
    userMessage: 'Please enter a valid email address.',
    severity: 'low',
    category: 'validation',
    retryable: true
  },
  WEAK_PASSWORD: {
    code: 'WEAK_PASSWORD',
    message: 'Password does not meet security requirements',
    userMessage: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character.',
    severity: 'medium',
    category: 'validation',
    retryable: true
  },
  PASSWORD_MISMATCH: {
    code: 'PASSWORD_MISMATCH',
    message: 'Password confirmation does not match',
    userMessage: 'Passwords do not match. Please try again.',
    severity: 'low',
    category: 'validation',
    retryable: true
  },
  REQUIRED_FIELD: {
    code: 'REQUIRED_FIELD',
    message: 'Required field is missing',
    userMessage: 'Please fill in all required fields.',
    severity: 'low',
    category: 'validation',
    retryable: true
  },

  // Authentication Errors
  INVALID_CREDENTIALS: {
    code: 'INVALID_CREDENTIALS',
    message: 'Invalid email or password provided',
    userMessage: 'Invalid email or password. Please check your credentials and try again.',
    severity: 'medium',
    category: 'security',
    retryable: true,
    fallbackOptions: ['Reset Password', 'Try Different Email']
  },
  ACCOUNT_NOT_FOUND: {
    code: 'ACCOUNT_NOT_FOUND',
    message: 'No account found with provided email',
    userMessage: 'No account found with this email address.',
    severity: 'medium',
    category: 'security',
    retryable: false,
    fallbackOptions: ['Create Account', 'Try Different Email']
  },
  ACCOUNT_LOCKED: {
    code: 'ACCOUNT_LOCKED',
    message: 'Account is temporarily locked due to failed login attempts',
    userMessage: 'Your account has been temporarily locked due to multiple failed login attempts. Please try again in 15 minutes or reset your password.',
    severity: 'high',
    category: 'security',
    retryable: false,
    fallbackOptions: ['Reset Password', 'Contact Support']
  },
  ACCOUNT_DISABLED: {
    code: 'ACCOUNT_DISABLED',
    message: 'Account has been disabled',
    userMessage: 'Your account has been disabled. Please contact support for assistance.',
    severity: 'high',
    category: 'security',
    retryable: false,
    fallbackOptions: ['Contact Support']
  },

  // Session Errors
  SESSION_EXPIRED: {
    code: 'SESSION_EXPIRED',
    message: 'User session has expired',
    userMessage: 'Your session has expired. Please sign in again.',
    severity: 'medium',
    category: 'session',
    retryable: false,
    fallbackOptions: ['Sign In Again']
  },
  SESSION_INVALID: {
    code: 'SESSION_INVALID',
    message: 'Invalid or corrupted session',
    userMessage: 'Your session is invalid. Please sign in again.',
    severity: 'medium',
    category: 'session',
    retryable: false,
    fallbackOptions: ['Sign In Again']
  },
  CONCURRENT_SESSION: {
    code: 'CONCURRENT_SESSION',
    message: 'Multiple sessions detected',
    userMessage: 'You are signed in from another device. Please sign out from other devices or continue here.',
    severity: 'medium',
    category: 'session',
    retryable: false,
    fallbackOptions: ['Continue Here', 'Sign Out Everywhere']
  },

  // OAuth Errors
  OAUTH_CANCELLED: {
    code: 'OAUTH_CANCELLED',
    message: 'OAuth authentication was cancelled by user',
    userMessage: 'Sign-in was cancelled. You can try again or use email/password instead.',
    severity: 'low',
    category: 'oauth',
    retryable: true,
    fallbackOptions: ['Try Again', 'Use Email/Password']
  },
  OAUTH_FAILED: {
    code: 'OAUTH_FAILED',
    message: 'OAuth authentication failed',
    userMessage: 'Google sign-in failed. Please try again or use email/password instead.',
    severity: 'medium',
    category: 'oauth',
    retryable: true,
    fallbackOptions: ['Try Again', 'Use Email/Password', 'Contact Support']
  },
  OAUTH_ACCOUNT_LINKING_FAILED: {
    code: 'OAUTH_ACCOUNT_LINKING_FAILED',
    message: 'Failed to link OAuth account with existing account',
    userMessage: 'Unable to link your Google account. An account with this email already exists.',
    severity: 'medium',
    category: 'oauth',
    retryable: false,
    fallbackOptions: ['Sign In with Password', 'Reset Password']
  },

  // Network Errors
  NETWORK_ERROR: {
    code: 'NETWORK_ERROR',
    message: 'Network connection error',
    userMessage: 'Network connection error. Please check your internet connection and try again.',
    severity: 'medium',
    category: 'network',
    retryable: true,
    fallbackOptions: ['Try Again', 'Check Connection']
  },
  TIMEOUT_ERROR: {
    code: 'TIMEOUT_ERROR',
    message: 'Request timed out',
    userMessage: 'The request timed out. Please try again.',
    severity: 'medium',
    category: 'network',
    retryable: true,
    fallbackOptions: ['Try Again']
  },
  OFFLINE_ERROR: {
    code: 'OFFLINE_ERROR',
    message: 'Device is offline',
    userMessage: 'You appear to be offline. Please check your internet connection.',
    severity: 'medium',
    category: 'network',
    retryable: true,
    fallbackOptions: ['Check Connection', 'Try Again']
  },

  // Server Errors
  SERVER_ERROR: {
    code: 'SERVER_ERROR',
    message: 'Internal server error',
    userMessage: 'Something went wrong on our end. Please try again in a few moments.',
    severity: 'high',
    category: 'server',
    retryable: true,
    fallbackOptions: ['Try Again', 'Contact Support']
  },
  SERVICE_UNAVAILABLE: {
    code: 'SERVICE_UNAVAILABLE',
    message: 'Authentication service is temporarily unavailable',
    userMessage: 'Our authentication service is temporarily unavailable. Please try again in a few minutes.',
    severity: 'high',
    category: 'server',
    retryable: true,
    fallbackOptions: ['Try Again Later', 'Contact Support']
  },
  RATE_LIMITED: {
    code: 'RATE_LIMITED',
    message: 'Too many requests from this IP',
    userMessage: 'Too many attempts. Please wait a few minutes before trying again.',
    severity: 'medium',
    category: 'security',
    retryable: false,
    fallbackOptions: ['Wait and Try Again', 'Contact Support']
  },

  // Generic Errors
  UNKNOWN_ERROR: {
    code: 'UNKNOWN_ERROR',
    message: 'An unknown error occurred',
    userMessage: 'An unexpected error occurred. Please try again or contact support if the problem persists.',
    severity: 'medium',
    category: 'server',
    retryable: true,
    fallbackOptions: ['Try Again', 'Contact Support']
  }
};

/**
 * Authentication Error Manager Class
 */
export class AuthErrorManager {
  private errorLog: Array<{ error: AuthError; context: ErrorContext }> = [];
  private maxLogSize = 100;

  /**
   * Create an AuthError from various input types
   */
  createError(
    errorInput: string | Error | AuthError,
    context: Partial<ErrorContext> = {},
    metadata: Record<string, any> = {}
  ): AuthError {
    const fullContext: ErrorContext = {
      operation: 'unknown',
      timestamp: Date.now(),
      ...context
    };

    let baseError: AuthError;

    if (typeof errorInput === 'string') {
      // String error code
      baseError = AUTH_ERRORS[errorInput] || AUTH_ERRORS.UNKNOWN_ERROR;
    } else if (errorInput instanceof Error) {
      // JavaScript Error object
      baseError = this.mapJSErrorToAuthError(errorInput);
    } else {
      // Already an AuthError
      baseError = errorInput;
    }

    const error: AuthError = {
      ...baseError,
      metadata: { ...metadata, context: fullContext }
    };

    this.logError(error, fullContext);
    return error;
  }

  /**
   * Map JavaScript errors to AuthError types
   */
  private mapJSErrorToAuthError(jsError: Error): AuthError {
    const message = jsError.message.toLowerCase();

    if (message.includes('network') || message.includes('fetch')) {
      return AUTH_ERRORS.NETWORK_ERROR;
    }
    if (message.includes('timeout')) {
      return AUTH_ERRORS.TIMEOUT_ERROR;
    }
    if (message.includes('unauthorized') || message.includes('401')) {
      return AUTH_ERRORS.INVALID_CREDENTIALS;
    }
    if (message.includes('forbidden') || message.includes('403')) {
      return AUTH_ERRORS.ACCOUNT_DISABLED;
    }
    if (message.includes('not found') || message.includes('404')) {
      return AUTH_ERRORS.ACCOUNT_NOT_FOUND;
    }
    if (message.includes('rate limit') || message.includes('429')) {
      return AUTH_ERRORS.RATE_LIMITED;
    }
    if (message.includes('server') || message.includes('500')) {
      return AUTH_ERRORS.SERVER_ERROR;
    }
    if (message.includes('service unavailable') || message.includes('503')) {
      return AUTH_ERRORS.SERVICE_UNAVAILABLE;
    }

    return AUTH_ERRORS.UNKNOWN_ERROR;
  }

  /**
   * Log error for monitoring and debugging
   */
  private logError(error: AuthError, context: ErrorContext): void {
    const logEntry = { error, context };
    
    this.errorLog.unshift(logEntry);
    
    // Keep log size manageable
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(0, this.maxLogSize);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Auth Error:', {
        code: error.code,
        message: error.message,
        userMessage: error.userMessage,
        context
      });
    }

    // Send to monitoring service in production
    if (process.env.NODE_ENV === 'production' && error.severity === 'critical') {
      this.sendToMonitoring(error, context);
    }
  }

  /**
   * Send critical errors to monitoring service
   */
  private async sendToMonitoring(error: AuthError, context: ErrorContext): Promise<void> {
    try {
      await fetch('/api/monitoring/auth-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error, context })
      });
    } catch (monitoringError) {
      console.error('Failed to send error to monitoring:', monitoringError);
    }
  }

  /**
   * Get user-friendly error message with fallback options
   */
  getErrorDisplay(error: AuthError): {
    title: string;
    message: string;
    severity: string;
    fallbackOptions: string[];
    retryable: boolean;
  } {
    return {
      title: this.getErrorTitle(error),
      message: error.userMessage,
      severity: error.severity,
      fallbackOptions: error.fallbackOptions || [],
      retryable: error.retryable
    };
  }

  /**
   * Get appropriate error title based on category
   */
  private getErrorTitle(error: AuthError): string {
    switch (error.category) {
      case 'validation':
        return 'Validation Error';
      case 'network':
        return 'Connection Error';
      case 'server':
        return 'Server Error';
      case 'oauth':
        return 'Sign-In Error';
      case 'security':
        return 'Authentication Error';
      case 'session':
        return 'Session Error';
      default:
        return 'Error';
    }
  }

  /**
   * Get recent errors for debugging
   */
  getRecentErrors(limit = 10): Array<{ error: AuthError; context: ErrorContext }> {
    return this.errorLog.slice(0, limit);
  }

  /**
   * Clear error log
   */
  clearErrorLog(): void {
    this.errorLog = [];
  }

  /**
   * Get error statistics
   */
  getErrorStats(): {
    totalErrors: number;
    errorsByCategory: Record<string, number>;
    errorsBySeverity: Record<string, number>;
    recentErrorRate: number;
  } {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    
    const recentErrors = this.errorLog.filter(
      entry => entry.context.timestamp > oneHourAgo
    );

    const errorsByCategory: Record<string, number> = {};
    const errorsBySeverity: Record<string, number> = {};

    this.errorLog.forEach(({ error }) => {
      errorsByCategory[error.category] = (errorsByCategory[error.category] || 0) + 1;
      errorsBySeverity[error.severity] = (errorsBySeverity[error.severity] || 0) + 1;
    });

    return {
      totalErrors: this.errorLog.length,
      errorsByCategory,
      errorsBySeverity,
      recentErrorRate: recentErrors.length
    };
  }
}

// Global error manager instance
let authErrorManager: AuthErrorManager | null = null;

export function getAuthErrorManager(): AuthErrorManager {
  if (!authErrorManager) {
    authErrorManager = new AuthErrorManager();
  }
  return authErrorManager;
}

/**
 * Utility functions for common error scenarios
 */
export const authErrorUtils = {
  /**
   * Handle NextAuth.js errors
   */
  handleNextAuthError(error: string): AuthError {
    const errorManager = getAuthErrorManager();
    
    switch (error) {
      case 'CredentialsSignin':
        return errorManager.createError('INVALID_CREDENTIALS');
      case 'OAuthSignin':
      case 'OAuthCallback':
        return errorManager.createError('OAUTH_FAILED');
      case 'OAuthCreateAccount':
        return errorManager.createError('OAUTH_ACCOUNT_LINKING_FAILED');
      case 'EmailCreateAccount':
        return errorManager.createError('ACCOUNT_NOT_FOUND');
      case 'Callback':
        return errorManager.createError('SERVER_ERROR');
      case 'OAuthAccountNotLinked':
        return errorManager.createError('OAUTH_ACCOUNT_LINKING_FAILED');
      case 'EmailSignin':
        return errorManager.createError('INVALID_EMAIL');
      case 'CredentialsSignup':
        return errorManager.createError('SERVER_ERROR');
      case 'SessionRequired':
        return errorManager.createError('SESSION_EXPIRED');
      default:
        return errorManager.createError('UNKNOWN_ERROR', { operation: 'nextauth' });
    }
  },

  /**
   * Handle fetch/network errors
   */
  handleNetworkError(error: Error): AuthError {
    const errorManager = getAuthErrorManager();
    
    if (error.name === 'AbortError') {
      return errorManager.createError('TIMEOUT_ERROR');
    }
    if (error.message.includes('Failed to fetch')) {
      return errorManager.createError('NETWORK_ERROR');
    }
    
    return errorManager.createError(error);
  },

  /**
   * Handle API response errors
   */
  handleApiError(response: Response, responseData?: any): AuthError {
    const errorManager = getAuthErrorManager();
    
    switch (response.status) {
      case 400:
        return errorManager.createError('INVALID_CREDENTIALS');
      case 401:
        return errorManager.createError('INVALID_CREDENTIALS');
      case 403:
        return errorManager.createError('ACCOUNT_DISABLED');
      case 404:
        return errorManager.createError('ACCOUNT_NOT_FOUND');
      case 429:
        return errorManager.createError('RATE_LIMITED');
      case 500:
        return errorManager.createError('SERVER_ERROR');
      case 503:
        return errorManager.createError('SERVICE_UNAVAILABLE');
      default:
        return errorManager.createError('UNKNOWN_ERROR', {
          operation: 'api_call'
        }, {
          status: response.status,
          statusText: response.statusText,
          responseData
        });
    }
  },

  /**
   * Create validation error
   */
  createValidationError(field: string, message: string): AuthError {
    const errorManager = getAuthErrorManager();
    
    return errorManager.createError('REQUIRED_FIELD', {
      operation: 'validation'
    }, {
      field,
      validationMessage: message
    });
  }
};