# 🔐 Manual Authentication Testing Guide

## Quick Setup for Manual Testing

### Step 1: Prepare Database
```bash
cd web

# Generate Prisma client
npx prisma generate

# Push schema to database (creates/updates tables)
npx prisma db push

# Verify database connection
npx prisma db pull
```

### Step 2: Start Development Server
```bash
npm run dev
```

### Step 3: Manual Testing Checklist

#### ✅ Test 1: User Registration
1. **Go to:** `http://localhost:3000/auth/signup`
2. **Fill out form:**
   - Name: `Test User`
   - Email: `test@example.com`
   - Password: `TestPassword123!`
   - Confirm Password: `TestPassword123!`
3. **Expected:** Account created, redirected to dashboard

#### ✅ Test 2: User Sign In
1. **Go to:** `http://localhost:3000/auth/signin`
2. **Sign in with:**
   - Email: `test@example.com`
   - Password: `TestPassword123!`
3. **Expected:** Successfully signed in, redirected to dashboard

#### ✅ Test 3: Test Wrong Password
1. **Go to:** `http://localhost:3000/auth/signin`
2. **Try wrong password:**
   - Email: `test@example.com`
   - Password: `wrongpassword`
3. **Expected:** Error message displayed

#### ✅ Test 4: Test Account Lockout
1. **Try wrong password 5 times in a row**
2. **Expected:** Account locked message after 5 attempts

#### ✅ Test 5: Password Reset
1. **Go to:** `http://localhost:3000/auth/forgot-password`
2. **Enter email:** `test@example.com`
3. **Check console logs for reset token**
4. **Go to:** `http://localhost:3000/auth/reset-password?token=YOUR_TOKEN`
5. **Set new password:** `NewPassword123!`

#### ✅ Test 6: Protected Routes
1. **Sign out first**
2. **Try to access:** `http://localhost:3000/dashboard`
3. **Expected:** Redirected to sign-in page

#### ✅ Test 7: Session Persistence
1. **Sign in**
2. **Close browser tab**
3. **Reopen and go to dashboard**
4. **Expected:** Still signed in

## Database Verification

### View Data in Prisma Studio
```bash
npx prisma studio
```

Check these tables:
- **User** - Should have your test user with hashed password
- **SecurityEvent** - Should log login attempts
- **PasswordReset** - Should have reset tokens
- **UserSession** - Should track sessions

## Troubleshooting

### Issue: Database Connection Error
```bash
# Check your DATABASE_URL in .env.local
echo $DATABASE_URL

# Try regenerating client
npx prisma generate
npx prisma db push
```

### Issue: NextAuth Error
```bash
# Check environment variables
grep NEXTAUTH .env.local

# Should have:
# NEXTAUTH_URL=http://localhost:3000
# NEXTAUTH_SECRET=your-secret-key
```

### Issue: Password Not Hashing
```bash
# Check if bcryptjs is installed
npm list bcryptjs

# If not installed:
npm install bcryptjs @types/bcryptjs
```

## Expected Results

After testing, you should see:
- ✅ User can register and sign in
- ✅ Wrong passwords show errors
- ✅ Account lockout works after 5 failed attempts
- ✅ Password reset flow works
- ✅ Protected routes require authentication
- ✅ Sessions persist across browser sessions
- ✅ Database records are created properly
- ✅ Passwords are hashed (not plain text)

## Test Account Details

Use these for consistent testing:
- **Name:** Test User
- **Email:** test@example.com
- **Password:** TestPassword123!

## Next Steps

Once manual testing passes:
1. Test on mobile devices
2. Test with different browsers
3. Test Google OAuth (if configured)
4. Load test with multiple users
5. Security test with penetration testing tools