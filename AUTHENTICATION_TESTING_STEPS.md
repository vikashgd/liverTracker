# 🔐 Authentication System Testing Steps

## Quick Start Testing Guide

### Step 1: Database Setup

You have two options for testing:

#### Option A: Use Local PostgreSQL (Recommended for Testing)

1. **Install PostgreSQL locally:**
   ```bash
   # macOS with Homebrew
   brew install postgresql
   brew services start postgresql
   
   # Create a test database
   createdb livertracker_test
   ```

2. **Update your `.env.local` with local database:**
   ```bash
   DATABASE_URL="postgresql://username:password@localhost:5432/livertracker_test"
   ```

#### Option B: Use SQLite (Easiest for Testing)

1. **Update your `prisma/schema.prisma`:**
   ```prisma
   datasource db {
     provider = "sqlite"
     url      = "file:./dev.db"
   }
   ```

2. **Update your `.env.local`:**
   ```bash
   DATABASE_URL="file:./dev.db"
   ```

### Step 2: Initialize Database

```bash
cd web

# Generate Prisma client
npx prisma generate

# Push schema to database (creates tables)
npx prisma db push

# Optional: Open Prisma Studio to view data
npx prisma studio
```

### Step 3: Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Step 4: Test Authentication Flow

#### 🔹 Test 1: User Registration

1. **Navigate to Sign Up:**
   - Go to `http://localhost:3000/auth/signup`

2. **Create Test Account:**
   - Name: `Test User`
   - Email: `test@example.com`
   - Password: `TestPassword123!`
   - Confirm Password: `TestPassword123!`

3. **Expected Result:**
   - ✅ Form validation works
   - ✅ Password strength indicator shows
   - ✅ Account created successfully
   - ✅ Redirected to dashboard or success page

#### 🔹 Test 2: User Sign In

1. **Navigate to Sign In:**
   - Go to `http://localhost:3000/auth/signin`

2. **Test Invalid Credentials:**
   - Email: `test@example.com`
   - Password: `wrongpassword`
   - Expected: ❌ Error message shown

3. **Test Valid Credentials:**
   - Email: `test@example.com`
   - Password: `TestPassword123!`
   - Expected: ✅ Successfully signed in

#### 🔹 Test 3: Password Reset

1. **Request Password Reset:**
   - Go to `http://localhost:3000/auth/forgot-password`
   - Enter: `test@example.com`
   - Click "Send Reset Link"

2. **Check Console/Database:**
   - Look for reset token in console logs
   - Or check `PasswordReset` table in Prisma Studio

3. **Reset Password:**
   - Go to `http://localhost:3000/auth/reset-password?token=YOUR_TOKEN`
   - Enter new password: `NewPassword123!`
   - Expected: ✅ Password reset successfully

#### 🔹 Test 4: Protected Routes

1. **Test Without Authentication:**
   - Go to `http://localhost:3000/dashboard`
   - Expected: ❌ Redirected to sign-in page

2. **Test With Authentication:**
   - Sign in first
   - Go to `http://localhost:3000/dashboard`
   - Expected: ✅ Dashboard loads successfully

#### 🔹 Test 5: Session Management

1. **Test Sign Out:**
   - Click "Sign Out" in header
   - Try accessing dashboard
   - Expected: ❌ Redirected to sign-in

2. **Test Session Persistence:**
   - Sign in
   - Close browser tab
   - Reopen and go to dashboard
   - Expected: ✅ Still signed in

### Step 5: Test Security Features

#### 🔹 Test 6: Rate Limiting

1. **Test Failed Login Attempts:**
   - Try signing in with wrong password 5 times
   - Expected: ❌ Account locked after 5 attempts

2. **Test API Rate Limiting:**
   ```bash
   # Test multiple rapid requests
   for i in {1..10}; do
     curl -X POST http://localhost:3000/api/auth/signin \
       -H "Content-Type: application/json" \
       -d '{"email":"test@example.com","password":"wrong"}'
   done
   ```

#### 🔹 Test 7: Database Verification

1. **Open Prisma Studio:**
   ```bash
   npx prisma studio
   ```

2. **Check Tables:**
   - ✅ `User` table has your test user
   - ✅ Password is hashed (not plain text)
   - ✅ `SecurityEvent` table has login events
   - ✅ `PasswordReset` table has reset tokens

### Step 6: Test Mobile Experience

1. **Open Browser Developer Tools**
2. **Switch to Mobile View** (iPhone/Android simulation)
3. **Test Sign In/Sign Up Forms:**
   - ✅ Forms are responsive
   - ✅ Touch interactions work
   - ✅ Keyboard types are appropriate (email/password)

### Step 7: Test API Endpoints

```bash
# Test health endpoint
curl http://localhost:3000/api/health

# Test session endpoint (should return null if not signed in)
curl http://localhost:3000/api/auth/session

# Test providers endpoint
curl http://localhost:3000/api/auth/providers
```

## 🎯 Expected Results Summary

After completing all tests, you should have:

- ✅ **User Registration:** Working with validation
- ✅ **User Sign In:** Working with error handling
- ✅ **Password Reset:** Complete flow working
- ✅ **Protected Routes:** Properly secured
- ✅ **Session Management:** Persistent and secure
- ✅ **Rate Limiting:** Preventing abuse
- ✅ **Database Records:** Properly created and secured
- ✅ **Mobile Experience:** Responsive and functional
- ✅ **API Endpoints:** Responding correctly

## 🚨 Troubleshooting

### Issue: Database Connection Failed

**Solution:**
```bash
# Check database URL
echo $DATABASE_URL

# For SQLite (easiest)
DATABASE_URL="file:./dev.db"

# For local PostgreSQL
DATABASE_URL="postgresql://username:password@localhost:5432/dbname"
```

### Issue: Prisma Client Not Generated

**Solution:**
```bash
npx prisma generate
```

### Issue: Tables Don't Exist

**Solution:**
```bash
npx prisma db push
```

### Issue: NextAuth Configuration Error

**Solution:**
```bash
# Check environment variables
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-at-least-32-characters
```

### Issue: Password Hashing Error

**Solution:**
```bash
# Install bcryptjs
npm install bcryptjs
npm install @types/bcryptjs
```

## 📊 Testing Checklist

Use this checklist to track your progress:

```
Authentication Testing Checklist

Basic Functionality:
□ User can register with email/password
□ User can sign in with correct credentials
□ User gets error with wrong credentials
□ Password reset flow works end-to-end
□ User can sign out successfully

Security Features:
□ Account lockout after failed attempts
□ Rate limiting prevents abuse
□ Passwords are properly hashed
□ Sessions are secure and persistent
□ Protected routes require authentication

User Experience:
□ Forms have proper validation
□ Error messages are user-friendly
□ Mobile experience is responsive
□ Loading states work correctly
□ Success messages are clear

Technical:
□ Database tables created correctly
□ API endpoints respond properly
□ Security events are logged
□ Audit trail is maintained
□ Performance is acceptable

Issues Found:
□ [List any issues discovered]

Notes:
[Add any additional observations]
```

## 🎉 Success!

If all tests pass, your comprehensive authentication system is working correctly and ready for production use!

For production deployment, see: `web/docs/production-deployment-guide.md`