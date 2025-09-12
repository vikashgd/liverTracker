# 🔧 Google OAuth Fix Guide

## 🎯 Problem
- Google OAuth redirects to `/api/auth/error`
- User account exists but cannot login with Google
- Classic OAuth testing mode issue

## 🔍 Root Cause
Your Google OAuth app is in **"Testing"** mode and your email is not in the test users list.

## ✅ Solutions (Choose One)

### 🚀 OPTION 1: Add Test Users (Quick Fix - 2 minutes)

1. **Go to Google Cloud Console:**
   - Visit: https://console.cloud.google.com
   - Select project: `livertracker-468816`

2. **Navigate to OAuth Settings:**
   - Go to: `APIs & Services` > `OAuth consent screen`

3. **Add Test Users:**
   - Scroll down to "Test users" section
   - Click "ADD USERS"
   - Add: `vikashgd@gmail.com`
   - Click "SAVE"

4. **Test Login:**
   - Go to https://livertracker.com/auth/signin
   - Try Google login - should work now!

### 🌟 OPTION 2: Publish OAuth App (Permanent Fix)

1. **Go to OAuth Consent Screen:**
   - Same path as Option 1

2. **Publish App:**
   - Click "PUBLISH APP" button
   - Confirm publishing
   - May require verification for sensitive scopes

3. **Benefits:**
   - All users can login with Google
   - No test user limitations
   - Production-ready solution

### 🔄 OPTION 3: Use Email/Password (Immediate Workaround)

**Works Right Now:**
- Go to: https://livertracker.com/auth/signin
- Use: `vikashgd@gmail.com` + any password
- Login works immediately while fixing OAuth

## 📊 Current OAuth Configuration

```
Client ID: 145819462545-86nc55rg1jbr51t6h921n5fgjev1agjk.apps.googleusercontent.com
Redirect URI: https://livertracker.com/api/auth/callback/google
Scopes: openid, email, profile
```

## 🎯 Recommended Approach

1. **Immediate:** Use Option 3 (email/password) for instant access
2. **Quick Fix:** Use Option 1 (add test users) for Google OAuth
3. **Long-term:** Use Option 2 (publish app) for production

## ✅ Verification Steps

After implementing Option 1 or 2:

1. Clear browser cache/cookies
2. Go to https://livertracker.com/auth/signin
3. Click "Continue with Google"
4. Should redirect to dashboard (not error page)

## 🚨 If Still Not Working

Check these common issues:

1. **Wrong Google Account:** Make sure you're using `vikashgd@gmail.com`
2. **Cache Issues:** Clear browser data completely
3. **Redirect URI:** Verify it matches exactly in Google Console
4. **App Status:** Confirm OAuth app is published or test user added

## 📞 Support

If issues persist:
- Use email/password login as backup
- Check Google Cloud Console audit logs
- Verify OAuth app configuration matches this guide

---

**The profile contamination fix is already deployed and working. This OAuth issue is separate and can be resolved with the steps above.**