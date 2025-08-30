import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  AuthErrorManager,
  getAuthErrorManager,
  authErrorUtils,
  AUTH_ERRORS
} from '../auth-error-manager';

// Mock fetch for monitoring
global.fetch = vi.fn();

describe('AuthErrorManager', () => {
  let errorManager: AuthErrorManager;

  beforeEach(() => {
    errorManager = new AuthErrorManager();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createError', () => {
    it('should create error from string code', () => {
      const error = errorManager.createError('INVALID_CREDENTIALS');
      
      expect(error.code).toBe('INVALID_CREDENTIALS');
      expect(error.message).toBe(AUTH_ERRORS.INVALID_CREDENTIALS.message);
      expect(error.userMessage).toBe(AUTH_ERRORS.INVALID_CREDENTIALS.userMessage);
      expect(error.severity).toBe(AUTH_ERRORS.INVALID_CREDENTIALS.severity);
      expect(error.category).toBe(AUTH_ERRORS.INVALID_CREDENTIALS.category);
      expect(error.retryable).toBe(AUTH_ERRORS.INVALID_CREDENTIALS.retryable);
    });

    it('should create error from JavaScript Error object', () => {
      const jsError = new Error('Network connection failed');
      const error = errorManager.createError(jsError);
      
      expect(error.code).toBe('NETWORK_ERROR');
      expect(error.category).toBe('network');
      expect(error.metadata).toBeDefined();
    });

    it('should create error from AuthError object', () => {
      const authError = AUTH_ERRORS.SESSION_EXPIRED;
      const error = errorManager.createError(authError);
      
      expect(error.code).toBe('SESSION_EXPIRED');
      expect(error.message).toBe(authError.message);
    });

    it('should handle unknown error codes', () => {
      const error = errorManager.createError('UNKNOWN_CODE');
      
      expect(error.code).toBe('UNKNOWN_ERROR');
      expect(error.category).toBe('server');
    });

    it('should include context and metadata', () => {
      const context = {
        operation: 'test_operation',
        userId: 'user-123'
      };
      const metadata = { additional: 'data' };
      
      const error = errorManager.createError('INVALID_CREDENTIALS', context, metadata);
      
      expect(error.metadata?.context).toMatchObject(context);
      expect(error.metadata?.additional).toBe('data');
    });
  });

  describe('mapJSErrorToAuthError', () => {
    it('should map network errors correctly', () => {
      const networkError = new Error('fetch failed');
      const error = errorManager.createError(networkError);
      
      expect(error.code).toBe('NETWORK_ERROR');
      expect(error.category).toBe('network');
    });

    it('should map timeout errors correctly', () => {
      const timeoutError = new Error('Request timeout');
      const error = errorManager.createError(timeoutError);
      
      expect(error.code).toBe('TIMEOUT_ERROR');
      expect(error.category).toBe('network');
    });

    it('should map HTTP status errors correctly', () => {
      const unauthorizedError = new Error('401 Unauthorized');
      const error = errorManager.createError(unauthorizedError);
      
      expect(error.code).toBe('INVALID_CREDENTIALS');
      expect(error.category).toBe('security');
    });

    it('should map server errors correctly', () => {
      const serverError = new Error('500 Internal Server Error');
      const error = errorManager.createError(serverError);
      
      expect(error.code).toBe('SERVER_ERROR');
      expect(error.category).toBe('server');
    });
  });

  describe('getErrorDisplay', () => {
    it('should return formatted error display', () => {
      const error = errorManager.createError('INVALID_CREDENTIALS');
      const display = errorManager.getErrorDisplay(error);
      
      expect(display.title).toBe('Authentication Error');
      expect(display.message).toBe(error.userMessage);
      expect(display.severity).toBe(error.severity);
      expect(display.fallbackOptions).toEqual(error.fallbackOptions || []);
      expect(display.retryable).toBe(error.retryable);
    });

    it('should return appropriate titles for different categories', () => {
      const testCases = [
        { code: 'INVALID_EMAIL', expectedTitle: 'Validation Error' },
        { code: 'NETWORK_ERROR', expectedTitle: 'Connection Error' },
        { code: 'SERVER_ERROR', expectedTitle: 'Server Error' },
        { code: 'OAUTH_FAILED', expectedTitle: 'Sign-In Error' },
        { code: 'SESSION_EXPIRED', expectedTitle: 'Session Error' }
      ];

      testCases.forEach(({ code, expectedTitle }) => {
        const error = errorManager.createError(code);
        const display = errorManager.getErrorDisplay(error);
        expect(display.title).toBe(expectedTitle);
      });
    });
  });

  describe('error logging and statistics', () => {
    it('should track recent errors', () => {
      errorManager.createError('INVALID_CREDENTIALS');
      errorManager.createError('NETWORK_ERROR');
      errorManager.createError('SERVER_ERROR');
      
      const recentErrors = errorManager.getRecentErrors(5);
      
      expect(recentErrors).toHaveLength(3);
      expect(recentErrors[0].error.code).toBe('SERVER_ERROR'); // Most recent first
    });

    it('should generate error statistics', () => {
      errorManager.createError('INVALID_CREDENTIALS');
      errorManager.createError('INVALID_CREDENTIALS');
      errorManager.createError('NETWORK_ERROR');
      
      const stats = errorManager.getErrorStats();
      
      expect(stats.totalErrors).toBe(3);
      expect(stats.errorsByCategory.security).toBe(2);
      expect(stats.errorsByCategory.network).toBe(1);
      expect(stats.errorsBySeverity.medium).toBe(3);
    });

    it('should clear error log', () => {
      errorManager.createError('INVALID_CREDENTIALS');
      errorManager.createError('NETWORK_ERROR');
      
      expect(errorManager.getRecentErrors()).toHaveLength(2);
      
      errorManager.clearErrorLog();
      
      expect(errorManager.getRecentErrors()).toHaveLength(0);
    });
  });

  describe('monitoring integration', () => {
    it('should send critical errors to monitoring in production', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValue(new Response('OK'));
      
      errorManager.createError('SERVER_ERROR', {}, { severity: 'critical' });
      
      // Wait for async monitoring call
      await new Promise(resolve => setTimeout(resolve, 0));
      
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/monitoring/auth-error',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        })
      );
      
      process.env.NODE_ENV = originalEnv;
    });

    it('should not send to monitoring in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      const mockFetch = vi.mocked(fetch);
      
      errorManager.createError('SERVER_ERROR', {}, { severity: 'critical' });
      
      expect(mockFetch).not.toHaveBeenCalled();
      
      process.env.NODE_ENV = originalEnv;
    });
  });
});

describe('authErrorUtils', () => {
  describe('handleNextAuthError', () => {
    it('should map NextAuth errors correctly', () => {
      const testCases = [
        { nextAuthError: 'CredentialsSignin', expectedCode: 'INVALID_CREDENTIALS' },
        { nextAuthError: 'OAuthSignin', expectedCode: 'OAUTH_FAILED' },
        { nextAuthError: 'OAuthCallback', expectedCode: 'OAUTH_FAILED' },
        { nextAuthError: 'OAuthCreateAccount', expectedCode: 'OAUTH_ACCOUNT_LINKING_FAILED' },
        { nextAuthError: 'EmailCreateAccount', expectedCode: 'ACCOUNT_NOT_FOUND' },
        { nextAuthError: 'SessionRequired', expectedCode: 'SESSION_EXPIRED' }
      ];

      testCases.forEach(({ nextAuthError, expectedCode }) => {
        const error = authErrorUtils.handleNextAuthError(nextAuthError);
        expect(error.code).toBe(expectedCode);
      });
    });

    it('should handle unknown NextAuth errors', () => {
      const error = authErrorUtils.handleNextAuthError('UnknownError');
      expect(error.code).toBe('UNKNOWN_ERROR');
    });
  });

  describe('handleNetworkError', () => {
    it('should handle AbortError as timeout', () => {
      const abortError = new Error('Request aborted');
      abortError.name = 'AbortError';
      
      const error = authErrorUtils.handleNetworkError(abortError);
      expect(error.code).toBe('TIMEOUT_ERROR');
    });

    it('should handle fetch failures as network error', () => {
      const fetchError = new Error('Failed to fetch');
      
      const error = authErrorUtils.handleNetworkError(fetchError);
      expect(error.code).toBe('NETWORK_ERROR');
    });

    it('should handle generic network errors', () => {
      const genericError = new Error('Connection refused');
      
      const error = authErrorUtils.handleNetworkError(genericError);
      expect(error.code).toBe('UNKNOWN_ERROR');
    });
  });

  describe('handleApiError', () => {
    it('should map HTTP status codes correctly', () => {
      const testCases = [
        { status: 400, expectedCode: 'INVALID_CREDENTIALS' },
        { status: 401, expectedCode: 'INVALID_CREDENTIALS' },
        { status: 403, expectedCode: 'ACCOUNT_DISABLED' },
        { status: 404, expectedCode: 'ACCOUNT_NOT_FOUND' },
        { status: 429, expectedCode: 'RATE_LIMITED' },
        { status: 500, expectedCode: 'SERVER_ERROR' },
        { status: 503, expectedCode: 'SERVICE_UNAVAILABLE' }
      ];

      testCases.forEach(({ status, expectedCode }) => {
        const mockResponse = {
          status,
          statusText: 'Test Status'
        } as Response;
        
        const error = authErrorUtils.handleApiError(mockResponse);
        expect(error.code).toBe(expectedCode);
      });
    });

    it('should handle unknown status codes', () => {
      const mockResponse = {
        status: 418,
        statusText: "I'm a teapot"
      } as Response;
      
      const error = authErrorUtils.handleApiError(mockResponse);
      expect(error.code).toBe('UNKNOWN_ERROR');
    });

    it('should include response data in metadata', () => {
      const mockResponse = {
        status: 500,
        statusText: 'Internal Server Error'
      } as Response;
      
      const responseData = { details: 'Server overloaded' };
      
      const error = authErrorUtils.handleApiError(mockResponse, responseData);
      expect(error.metadata?.status).toBe(500);
      expect(error.metadata?.statusText).toBe('Internal Server Error');
      expect(error.metadata?.responseData).toEqual(responseData);
    });
  });

  describe('createValidationError', () => {
    it('should create validation error with field information', () => {
      const error = authErrorUtils.createValidationError('email', 'Invalid email format');
      
      expect(error.code).toBe('REQUIRED_FIELD');
      expect(error.category).toBe('validation');
      expect(error.metadata?.field).toBe('email');
      expect(error.metadata?.validationMessage).toBe('Invalid email format');
    });
  });
});

describe('getAuthErrorManager', () => {
  it('should return singleton instance', () => {
    const manager1 = getAuthErrorManager();
    const manager2 = getAuthErrorManager();
    
    expect(manager1).toBe(manager2);
  });

  it('should return AuthErrorManager instance', () => {
    const manager = getAuthErrorManager();
    
    expect(manager).toBeInstanceOf(AuthErrorManager);
  });
});

describe('AUTH_ERRORS constants', () => {
  it('should have all required error definitions', () => {
    const requiredErrors = [
      'INVALID_EMAIL',
      'WEAK_PASSWORD',
      'INVALID_CREDENTIALS',
      'ACCOUNT_NOT_FOUND',
      'ACCOUNT_LOCKED',
      'SESSION_EXPIRED',
      'OAUTH_FAILED',
      'NETWORK_ERROR',
      'SERVER_ERROR',
      'UNKNOWN_ERROR'
    ];

    requiredErrors.forEach(errorCode => {
      expect(AUTH_ERRORS[errorCode]).toBeDefined();
      expect(AUTH_ERRORS[errorCode].code).toBe(errorCode);
      expect(AUTH_ERRORS[errorCode].message).toBeDefined();
      expect(AUTH_ERRORS[errorCode].userMessage).toBeDefined();
      expect(AUTH_ERRORS[errorCode].severity).toBeDefined();
      expect(AUTH_ERRORS[errorCode].category).toBeDefined();
      expect(typeof AUTH_ERRORS[errorCode].retryable).toBe('boolean');
    });
  });

  it('should have valid severity levels', () => {
    const validSeverities = ['low', 'medium', 'high', 'critical'];
    
    Object.values(AUTH_ERRORS).forEach(error => {
      expect(validSeverities).toContain(error.severity);
    });
  });

  it('should have valid categories', () => {
    const validCategories = ['validation', 'network', 'server', 'oauth', 'security', 'session'];
    
    Object.values(AUTH_ERRORS).forEach(error => {
      expect(validCategories).toContain(error.category);
    });
  });
});