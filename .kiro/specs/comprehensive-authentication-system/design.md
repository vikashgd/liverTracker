# Design Document

## Overview

This design document outlines the implementation of a practical authentication system for LiverTrack that replaces the current magic link system with standard email/password authentication and Google OAuth integration. The system will provide users with familiar, convenient authentication methods while maintaining security for medical data access.

## Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Client App    │    │   NextAuth.js    │    │   Database      │
│                 │    │                  │    │                 │
│ • Sign-in Form  │◄──►│ • Credentials    │◄──►│ • User Table    │
│ • Google Button │    │ • Google OAuth   │    │ • Account Table │
│ • Session Mgmt  │    │ • Session Mgmt   │    │ • Session Table │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │   Google OAuth   │
                       │                  │
                       │ • OAuth 2.0 Flow │
                       │ • User Profile   │
                       └──────────────────┘
```

### Authentication Flow

1. **Email/Password Flow:**
   - User enters email and password
   - NextAuth validates credentials against database
   - Session created with JWT token
   - User redirected to dashboard

2. **Google OAuth Flow:**
   - User clicks "Sign in with Google"
   - Redirect to Google OAuth consent
   - Google returns user profile data
   - Account created/linked based on email
   - Session created and user redirected

## Components and Interfaces

### 1. Authentication Provider Configuration

**File:** `src/lib/auth-config.ts`

```typescript
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Credential validation logic
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    })
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth/signin",
    signUp: "/auth/signup",
    error: "/auth/error"
  },
  callbacks: {
    // JWT and session callbacks
  }
};
```

### 2. Authentication Pages

**Sign-In Page:** `src/app/auth/signin/page.tsx`
- Email/password form
- Google sign-in button
- Link to sign-up page
- Password reset link
- Error message display

**Sign-Up Page:** `src/app/auth/signup/page.tsx`
- Registration form (name, email, password, confirm password)
- Password strength indicator
- Terms of service acceptance
- Link back to sign-in
- Google sign-up option

**Password Reset:** `src/app/auth/reset-password/page.tsx`
- Email input for reset request
- Reset token validation
- New password form
- Success/error messaging

### 3. Authentication Components

**SignInForm Component:**
```typescript
interface SignInFormProps {
  callbackUrl?: string;
  error?: string;
}

export function SignInForm({ callbackUrl, error }: SignInFormProps) {
  // Form handling with react-hook-form
  // Email/password validation
  // NextAuth signIn integration
  // Error display
}
```

**GoogleSignInButton Component:**
```typescript
interface GoogleSignInButtonProps {
  callbackUrl?: string;
  text?: "signin" | "signup";
}

export function GoogleSignInButton({ callbackUrl, text }: GoogleSignInButtonProps) {
  // Google OAuth integration
  // Loading states
  // Error handling
}
```

### 4. Authentication Utilities

**File:** `src/lib/auth.ts`

```typescript
// Enhanced authentication utilities
export async function getCurrentUser(): Promise<User | null>;
export async function requireAuth(): Promise<string>; // Returns userId
export async function hashPassword(password: string): Promise<string>;
export async function verifyPassword(password: string, hash: string): Promise<boolean>;
export async function validatePasswordStrength(password: string): Promise<ValidationResult>;
export async function generatePasswordResetToken(email: string): Promise<string>;
export async function validatePasswordResetToken(token: string): Promise<{ valid: boolean; email?: string }>;
```

### 5. Password Security

**Password Requirements:**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- Optional: Special characters for enhanced security

**Password Hashing:**
- Use bcryptjs with salt rounds of 12
- Store only hashed passwords in database
- Never log or expose plain text passwords

## Data Models

### Enhanced User Model

```prisma
model User {
  id            String          @id @default(cuid())
  email         String?         @unique
  name          String?
  password      String?         // Hashed password for credentials auth
  emailVerified DateTime?
  image         String?
  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt
  
  // Security fields
  lastLoginAt   DateTime?
  loginAttempts Int             @default(0)
  lockedUntil   DateTime?
  
  // Existing relationships
  accounts      Account[]
  profile       PatientProfile?
  reportFiles   ReportFile[]
  sessions      Session[]
  timeline      TimelineEvent[]
  pdfExports    PdfExport[]
  auditLogs     AuditLog[]
  
  // New authentication-related models
  passwordResets PasswordReset[]
}

model PasswordReset {
  id        String   @id @default(cuid())
  userId    String
  token     String   @unique
  expires   DateTime
  used      Boolean  @default(false)
  createdAt DateTime @default(now())
  
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model LoginAttempt {
  id        String   @id @default(cuid())
  email     String
  success   Boolean
  ipAddress String?
  userAgent String?
  createdAt DateTime @default(now())
}
```

## Error Handling

### Authentication Errors

1. **Invalid Credentials:**
   - Generic message: "Invalid email or password"
   - No indication of which field is incorrect
   - Rate limiting after multiple attempts

2. **Account Lockout:**
   - Clear message about temporary lockout
   - Instructions for password reset
   - Lockout duration information

3. **Google OAuth Errors:**
   - Network connectivity issues
   - OAuth consent denied
   - Account linking conflicts
   - Fallback to email/password option

4. **Session Errors:**
   - Expired session handling
   - Invalid token detection
   - Automatic redirect to sign-in

### Error Response Format

```typescript
interface AuthError {
  code: string;
  message: string;
  field?: string;
  retryAfter?: number;
}

// Example error codes
const AUTH_ERRORS = {
  INVALID_CREDENTIALS: "invalid_credentials",
  ACCOUNT_LOCKED: "account_locked",
  WEAK_PASSWORD: "weak_password",
  EMAIL_EXISTS: "email_exists",
  OAUTH_ERROR: "oauth_error",
  SESSION_EXPIRED: "session_expired"
};
```

## Testing Strategy

### Unit Tests

1. **Password Utilities:**
   - Password hashing and verification
   - Password strength validation
   - Reset token generation and validation

2. **Authentication Logic:**
   - Credential validation
   - Account lockout logic
   - Session management

3. **Form Validation:**
   - Email format validation
   - Password requirements
   - Form submission handling

### Integration Tests

1. **Authentication Flows:**
   - Complete sign-in process
   - Sign-up with email verification
   - Password reset flow
   - Google OAuth integration

2. **Session Management:**
   - Session creation and validation
   - Session expiration handling
   - Cross-device session behavior

3. **Security Features:**
   - Rate limiting effectiveness
   - Account lockout behavior
   - Password security enforcement

### End-to-End Tests

1. **User Journeys:**
   - New user registration and first login
   - Existing user sign-in
   - Password reset and recovery
   - Google OAuth sign-in/sign-up

2. **Error Scenarios:**
   - Invalid credential handling
   - Network failure recovery
   - OAuth error handling

## Security Considerations

### Password Security

1. **Storage:**
   - Never store plain text passwords
   - Use bcrypt with appropriate salt rounds
   - Regular security audits of password handling

2. **Transmission:**
   - HTTPS only for all authentication endpoints
   - Secure cookie settings (httpOnly, secure, sameSite)
   - No password data in URL parameters or logs

### Session Security

1. **Token Management:**
   - JWT tokens with appropriate expiration
   - Secure token storage (httpOnly cookies)
   - Token rotation on sensitive operations

2. **Session Validation:**
   - Server-side session validation
   - Protection against session fixation
   - Proper session cleanup on logout

### Rate Limiting

1. **Login Attempts:**
   - Progressive delays after failed attempts
   - IP-based and account-based limiting
   - Temporary account lockout after threshold

2. **Password Reset:**
   - Limit reset requests per email/IP
   - Token expiration and single-use enforcement
   - Monitoring for abuse patterns

## Performance Optimizations

### Database Queries

1. **User Lookups:**
   - Indexed email field for fast lookups
   - Efficient password verification queries
   - Cached session validation where appropriate

2. **Authentication Checks:**
   - Minimize database hits for session validation
   - Efficient JWT token verification
   - Optimized user profile loading

### Frontend Performance

1. **Form Handling:**
   - Client-side validation for immediate feedback
   - Debounced input validation
   - Progressive enhancement for JavaScript-disabled users

2. **OAuth Integration:**
   - Lazy loading of Google OAuth scripts
   - Efficient redirect handling
   - Proper loading states and error boundaries

## Migration Strategy

### From Magic Link to Email/Password

1. **Database Migration:**
   - Add password field to User model
   - Create PasswordReset and LoginAttempt tables
   - Migrate existing users to new system

2. **User Communication:**
   - Email notification about authentication changes
   - Clear instructions for setting up passwords
   - Temporary support for both systems during transition

3. **Gradual Rollout:**
   - Feature flag for new authentication system
   - A/B testing with user segments
   - Monitoring and rollback capabilities

### Implementation Phases

**Phase 1: Core Infrastructure**
- Update NextAuth configuration
- Implement password utilities
- Create new authentication pages

**Phase 2: User Interface**
- Build sign-in/sign-up forms
- Implement Google OAuth integration
- Add password reset functionality

**Phase 3: Security & Testing**
- Implement rate limiting
- Add comprehensive error handling
- Complete testing suite

**Phase 4: Migration & Deployment**
- Migrate existing users
- Deploy with feature flags
- Monitor and optimize performance