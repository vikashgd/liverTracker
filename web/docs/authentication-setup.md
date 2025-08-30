# Authentication System Setup Guide

## Overview

This guide covers the setup and configuration of the LiverTrack authentication system, which includes:
- Email/password authentication
- Google OAuth integration
- Password security and reset functionality
- Session management

## Dependencies Installed

### Core Packages
- `bcryptjs` - Password hashing and verification
- `@types/bcryptjs` - TypeScript types for bcryptjs
- `next-auth` - Authentication framework (already installed)
- `@next-auth/prisma-adapter` - Database adapter (already installed)

## Environment Variables

### Required Variables

Add these to your `.env.local` file:

```bash
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# NextAuth Configuration (already configured)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key

# Database (already configured)
DATABASE_URL=your-database-url
```

### Setting up Google OAuth

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/

2. **Create or Select Project**
   - Use existing project: `livertracker-468816`
   - Or create a new project for authentication

3. **Enable Google+ API**
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API" and enable it

4. **Create OAuth 2.0 Credentials**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Application type: "Web application"
   - Name: "LiverTrack Authentication"

5. **Configure Authorized URLs**
   - Authorized JavaScript origins:
     - `http://localhost:3000` (development)
     - `https://your-production-domain.com` (production)
   - Authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback/google` (development)
     - `https://your-production-domain.com/api/auth/callback/google` (production)

6. **Copy Credentials**
   - Copy the Client ID and Client Secret
   - Add them to your `.env.local` file

## TypeScript Configuration

### Types Created
- `web/src/types/auth.ts` - Authentication-related types
- Extended NextAuth session and user types
- Error codes and validation interfaces

### Key Types
```typescript
interface AuthUser {
  id: string;
  email: string;
  name?: string;
  image?: string;
}

interface SignInCredentials {
  email: string;
  password: string;
}

interface PasswordValidation {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong';
}
```

## Security Configuration

### Password Requirements
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter  
- At least one number
- Special characters recommended

### Password Hashing
- Using bcryptjs with 12 salt rounds
- Secure password storage in database
- No plain text password logging

### Session Security
- JWT strategy for sessions
- 30-day session expiration
- Secure cookie settings for production
- Automatic session cleanup

## Next Steps

1. **Database Migration** (Task 2)
   - Add password field to User model
   - Create PasswordReset and LoginAttempt tables

2. **Password Utilities** (Task 3)
   - Implement hashing and validation functions
   - Create password reset token system

3. **NextAuth Configuration** (Task 4)
   - Update auth config with credentials provider
   - Add Google OAuth provider

4. **Authentication Pages** (Task 5)
   - Create sign-in/sign-up forms
   - Build password reset flow

## Testing

### Development Testing
```bash
# Start development server
npm run dev

# Test authentication endpoints
curl http://localhost:3000/api/auth/session
```

### Google OAuth Testing
1. Ensure Google credentials are configured
2. Test sign-in flow with Google account
3. Verify account creation and linking

## Troubleshooting

### Common Issues
1. **Google OAuth errors**: Check redirect URIs match exactly
2. **Session issues**: Verify NEXTAUTH_SECRET is set
3. **Database errors**: Ensure Prisma schema is up to date
4. **Password hashing**: Check bcryptjs installation

### Debug Mode
Set `NEXTAUTH_DEBUG=true` in development for detailed logs.

## Production Deployment

### Environment Variables
- Update `NEXTAUTH_URL` to production domain
- Use strong `NEXTAUTH_SECRET` (32+ characters)
- Configure production Google OAuth credentials
- Enable HTTPS for all authentication endpoints

### Security Checklist
- [ ] HTTPS enabled
- [ ] Secure cookie settings
- [ ] Rate limiting configured
- [ ] Password policies enforced
- [ ] Session expiration set appropriately
- [ ] Google OAuth production credentials configured