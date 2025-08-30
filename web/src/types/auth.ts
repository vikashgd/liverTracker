// Authentication-related TypeScript types

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  image?: string;
  emailVerified?: Date;
}

export interface SignInCredentials {
  email: string;
  password: string;
}

export interface SignUpData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetData {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface AuthError {
  code: string;
  message: string;
  field?: string;
  retryAfter?: number;
}

export interface PasswordValidation {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong';
}

export interface LoginAttempt {
  email: string;
  success: boolean;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

// NextAuth session extension
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string;
      image?: string;
    };
  }

  interface User {
    id: string;
    email: string;
    name?: string;
    image?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    uid: string;
  }
}

// Authentication error codes
export const AUTH_ERRORS = {
  INVALID_CREDENTIALS: "invalid_credentials",
  ACCOUNT_LOCKED: "account_locked",
  WEAK_PASSWORD: "weak_password",
  EMAIL_EXISTS: "email_exists",
  EMAIL_NOT_FOUND: "email_not_found",
  OAUTH_ERROR: "oauth_error",
  SESSION_EXPIRED: "session_expired",
  RATE_LIMITED: "rate_limited",
  INVALID_TOKEN: "invalid_token",
  TOKEN_EXPIRED: "token_expired",
  PASSWORDS_DONT_MATCH: "passwords_dont_match",
  INVALID_EMAIL: "invalid_email",
} as const;

export type AuthErrorCode = typeof AUTH_ERRORS[keyof typeof AUTH_ERRORS];