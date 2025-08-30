# 🔐 Authentication System Testing Guide

## Pre-Testing Setup

### 1. Environment Preparation

First, let's ensure your environment is properly configured:

```bash
cd web

# Check if required environment variables are set
echo "Checking environment variables..."
grep -E "NEXTAUTH_URL|NEXTAUTH_SECRET|DATABASE_URL" .env.local

# Install dependencies if needed
npm install

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev
```

### 2. Start the Development Server

```bash
# Start the Next.js development server
npm run dev
```

The application should be running at `http://localhost:3000`

## 🧪 Testing Checklist

### Phase 1: Basic Authentication Flow

#### ✅ Test 1: Sign Up with Email/Password

1. **Navigate to Sign Up**
   - Go to `http://localhost:3000/auth/signup`
   - Verify the sign-up form loads correctly

2. **Test Form Validation**
   - Try submitting empty form → Should show validation errors
   - Enter invalid email → Should show email validation error
   - Enter weak password → Should show password strength requirements
   - Enter mismatched passwords → Should show password mismatch error

3. **Successful Sign Up**
   - Enter valid details:
     - Name: `Test User`
     - Email: `test@example.com`
     - Password: `SecurePassword123!`
     - Confirm Password: `SecurePassword123!`
   - Click "Sign Up"
   - Should redirect to dashboard or show success message

#### ✅ Test 2: Sign In with Email/Password

1. **Navigate to Sign In**
   - Go to `http://localhost:3000/auth/signin`
   - Verify the sign-in form loads correctly

2. **Test Invalid Credentials**
   - Enter wrong email → Should show error message
   - Enter wrong password → Should show error message
   - Try multiple failed attempts → Should trigger rate limiting

3. **Successful Sign In**
   - Enter correct credentials:
     - Email: `test@example.com`
     - Password: `SecurePassword123!`
   - Click "Sign In"
   - Should redirect to dashboard

#### ✅ Test 3: Password Reset Flow

1. **Request Password Reset**
   - Go to `http://localhost:3000/auth/forgot-password`
   - Enter your email: `test@example.com`
   - Click "Send Reset Link"
   - Check console logs for reset token (in development)

2. **Reset Password**
   - Go to `http://localhost:3000/auth/reset-password?token=YOUR_TOKEN`
   - Enter new password: `NewSecurePassword123!`
   - Confirm new password
   - Click "Reset Password"
   - Should redirect to sign-in page

3. **Test New Password**
   - Sign in with new password
   - Should work successfully

### Phase 2: Security Features Testing

#### ✅ Test 4: Account Lockout Protection

1. **Trigger Account Lockout**
   - Go to sign-in page
   - Enter correct email but wrong password 5 times
   - Should see account lockout message after 5 attempts

2. **Wait for Unlock**
   - Wait 30 minutes OR check database to manually unlock
   - Try signing in again with correct credentials

#### ✅ Test 5: Rate Limiting

1. **Test API Rate Limiting**
   ```bash
   # Test sign-in endpoint rate limiting
   for i in {1..10}; do
     curl -X POST http://localhost:3000/api/auth/signin \
       -H "Content-Type: application/json" \
       -d '{"email":"test@example.com","password":"wrong"}' \
       -w "Status: %{http_code}\n"
   done
   ```
   - Should see 429 status codes after hitting rate limit

#### ✅ Test 6: Session Management

1. **Test Session Persistence**
   - Sign in successfully
   - Close browser tab
   - Reopen and navigate to dashboard
   - Should still be signed in

2. **Test Session Expiration**
   - Sign in successfully
   - Wait for session to expire (or modify session timeout in config)
   - Try accessing protected page
   - Should redirect to sign-in

3. **Test Sign Out**
   - Click "Sign Out" in header
   - Try accessing protected page
   - Should redirect to sign-in

### Phase 3: Google OAuth Testing

#### ✅ Test 7: Google OAuth Setup

1. **Configure Google OAuth** (if not already done)
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create OAuth 2.0 credentials
   - Add to `.env.local`:
     ```
     GOOGLE_CLIENT_ID=your_client_id
     GOOGLE_CLIENT_SECRET=your_client_secret
     ```
   - Restart development server

#### ✅ Test 8: Google Sign In

1. **Test Google OAuth Flow**
   - Go to sign-in page
   - Click "Sign in with Google"
   - Complete Google OAuth flow
   - Should redirect back to application
   - Should be signed in with Google account

2. **Test Account Linking**
   - Sign up with email/password using same email as Google account
   - Try signing in with Google
   - Should link accounts properly

### Phase 4: Mobile Testing

#### ✅ Test 9: Mobile Responsiveness

1. **Test Mobile Sign In**
   - Open browser developer tools
   - Switch to mobile view (iPhone/Android)
   - Navigate to sign-in page
   - Verify form is mobile-friendly
   - Test touch interactions

2. **Test Mobile Keyboard Types**
   - Email field should show email keyboard
   - Password field should show secure keyboard
   - Test autofill functionality

### Phase 5: API Endpoints Testing

#### ✅ Test 10: Authentication APIs

1. **Test Health Check**
   ```bash
   curl http://localhost:3000/api/health
   ```
   Should return 200 OK

2. **Test Session API**
   ```bash
   curl http://localhost:3000/api/auth/session
   ```
   Should return session data if signed in

3. **Test Protected API**
   ```bash
   # Without authentication
   curl http://localhost:3000/api/reports
   
   # Should return 401 or redirect
   ```

### Phase 6: Database Verification

#### ✅ Test 11: Database Records

1. **Check User Creation**
   ```bash
   npx prisma studio
   ```
   - Open Prisma Studio
   - Check `User` table for created users
   - Verify password is hashed (not plain text)

2. **Check Security Events**
   - Check `SecurityEvent` table for logged events
   - Should see login attempts, failures, etc.

3. **Check Audit Logs**
   - Check `AuditLog` table for authentication events
   - Should see account creation, password changes, etc.

## 🚨 Troubleshooting Common Issues

### Issue 1: Database Connection Error

**Symptoms:** "Database connection failed" or Prisma errors

**Solutions:**
```bash
# Check database URL
echo $DATABASE_URL

# Reset database
npx prisma migrate reset

# Regenerate client
npx prisma generate
```

### Issue 2: NextAuth Configuration Error

**Symptoms:** "Configuration error" or OAuth not working

**Solutions:**
```bash
# Check environment variables
cat .env.local | grep NEXTAUTH

# Verify NEXTAUTH_SECRET is set
openssl rand -base64 32
```

### Issue 3: Google OAuth Not Working

**Symptoms:** OAuth redirect errors or "redirect_uri_mismatch"

**Solutions:**
1. Check Google Console redirect URIs
2. Verify `NEXTAUTH_URL` matches your domain
3. Ensure Google OAuth is enabled

### Issue 4: Rate Limiting Too Aggressive

**Symptoms:** Getting blocked too quickly

**Solutions:**
```bash
# Check rate limiting configuration in middleware
# Adjust limits in auth-security.ts
```

## 📊 Testing Results Template

Use this template to track your testing results:

```
## Authentication Testing Results

### Basic Authentication
- [ ] Sign Up: ✅ Pass / ❌ Fail
- [ ] Sign In: ✅ Pass / ❌ Fail  
- [ ] Password Reset: ✅ Pass / ❌ Fail

### Security Features
- [ ] Account Lockout: ✅ Pass / ❌ Fail
- [ ] Rate Limiting: ✅ Pass / ❌ Fail
- [ ] Session Management: ✅ Pass / ❌ Fail

### Google OAuth
- [ ] Google Sign In: ✅ Pass / ❌ Fail
- [ ] Account Linking: ✅ Pass / ❌ Fail

### Mobile Testing
- [ ] Mobile Responsiveness: ✅ Pass / ❌ Fail
- [ ] Touch Interactions: ✅ Pass / ❌ Fail

### API Testing
- [ ] Authentication APIs: ✅ Pass / ❌ Fail
- [ ] Protected Routes: ✅ Pass / ❌ Fail

### Database Verification
- [ ] User Records: ✅ Pass / ❌ Fail
- [ ] Security Logs: ✅ Pass / ❌ Fail

### Issues Found:
1. [Describe any issues]
2. [Describe any issues]

### Notes:
[Any additional observations]
```

## 🔧 Advanced Testing

### Load Testing

```bash
# Install artillery for load testing
npm install -g artillery

# Create load test config
cat > auth-load-test.yml << EOF
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10
scenarios:
  - name: "Sign in flow"
    requests:
      - post:
          url: "/api/auth/signin"
          json:
            email: "test@example.com"
            password: "SecurePassword123!"
EOF

# Run load test
artillery run auth-load-test.yml
```

### Security Testing

```bash
# Test for common vulnerabilities
# SQL Injection attempts
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com'\''OR 1=1--","password":"test"}'

# XSS attempts  
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"<script>alert(1)</script>","email":"test@example.com","password":"test"}'
```

## ✅ Success Criteria

Your authentication system passes testing if:

1. ✅ All basic authentication flows work
2. ✅ Security features prevent abuse
3. ✅ Google OAuth integration works
4. ✅ Mobile experience is smooth
5. ✅ APIs respond correctly
6. ✅ Database records are created properly
7. ✅ No security vulnerabilities found
8. ✅ Performance is acceptable under load

## 🎯 Next Steps After Testing

Once testing is complete:

1. **Fix any issues found**
2. **Update documentation with test results**
3. **Prepare for production deployment**
4. **Set up monitoring and alerting**
5. **Train support team on new features**

---

**Happy Testing! 🚀**

If you encounter any issues during testing, refer to the troubleshooting section or check the authentication system documentation.