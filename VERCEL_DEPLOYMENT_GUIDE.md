# 🚀 LiverTracker Deployment to livertracker.com - Complete Guide

## Step 1: Create Production Environment Variables

Create `web/.env.production` with your exact values:

```bash
# Database (same as your current)
DATABASE_URL="postgresql://neondb_owner:npg_XYMsFlo3w0LR@ep-snowy-breeze-aeq72f7j-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# NextAuth - UPDATE THESE FOR PRODUCTION
NEXTAUTH_URL="https://livertracker.com"
NEXTAUTH_SECRET="AyTnFdTMWQDp5DUT55gBRvGO7XJ21nensTa77LMGG2g="

# Email (same as current)
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=vikashgd@gmail.com
EMAIL_SERVER_PASSWORD=tedwhkjfbaqtkrvk
EMAIL_FROM=vikashgd@gmail.com

# Google OAuth (same as current)
GOOGLE_CLIENT_ID="145819462545-86nc55rg1jbr51t6h921n5fgjev1agjk.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="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"

# Google Cloud Storage (same as current)
GCP_PROJECT_ID=livertracker-468816
GCS_BUCKET=livertrack-uploads
GCP_SA_KEY={"type":"service_account","project_id":"livertracker-468816","private_key_id":"373b2a39f21814c3c0da9f969e49bce7132a1675","private_key":"-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDF/RpuOjlwdDm1\nNdETOjqtiqsoEkcVX6jol8Q/Ytsjpq/kf0+3B3GffV5DEV87ARPnMJo3lEG5c2q1\n3vorCHVpxmLFAS1qXMrw5FQ3DiFe0xD+DWBTNoXqO6d+YiQhX5iV6k/48c91G8Mz\nguM3rVva2VgPLQShmtiO1rzBKk5qp8Qm+wBYM8W9bjSsT7r9U2wXYIRMmWSIJGT6\ncdaSF2e/xJdhTP5G/y7Xw//cYaVhdiqrB5f/WiCHcwllmG/lx4CkRlwU1qYmt9+Y\nAiWfGPjwZJ4y1C2NGGoSPess5H/O6qJmTruhSW+mQEv9MQpXkv5m2lmMAnQt7N0J\nH5xtSNKpAgMBAAECggEAEOJM4Dc1PG/07I1P10DBI0PZj7vAoG59dC8JFydiLQ/4\nclchtafmr9AG+1eJFE+QYnKkcXaXr5h2R6yMZKIT3TbZUm06HGwYXw2hruY/a0Y6\n7edhyQbedFis/Rv3x87Or4OBWWdJpqDSTIYYxAqTyZMnrXeh1vmNBoqtIxiYAllF\n5d9HjvIVKXBeI78T/3ZZjBttt8xW210gEg9Fzd9TuHiW5PVdNpmUPL5PUf4acnZY\n65VgOQiaMQTzVTIONMvKNhhT41V00UTQ9ymvsjx0WVTI7vkZTNpHi0dO2lbYaTmE\nO10kBupbZxK7hss17xOIKeqCsRM5Bj0lpj4gQRY/VwKBgQD8tMiLy2rIVTKw4/te\n0nhByai6UZGEVhZf4MLTqRwFCojOqag957C4KS8/kFev5QmMfXdjk/v2GZ6e3iPo\n5PeBKGdtq+MtuIjKu89G3Glic5ryPxXsfFVrEZQafMsqjWoDYWv7+ewIGLBMpy1S\npG6Nt51Jc+zan2Hm5Vx365rN/wKBgQDIkb3Mle6hKUlcGCikg/pZzlVmHSspcdcE\nnGO4hdJyRKjeYZfu64rT3coLB8LwqH23ZatUn/nZR16SmjPS4xHOGGzOrqLcYhum\nL+TWzyNbj4n/VFaPhHh/fBXy2DFU0zyAp8qo7n20r2oO4sOrvyMpcaMiwYX2z6m1\ntiT51iUvVwKBgQCft28tE7L4zQhNzrnYM3P4OIlgwR8UoghgLsFUX4SrFv5ih84i\n2iXSL42CQit5q2u+lKn5kNVltMmRJVtS3iwkQLImGcZq5j/myo71/WbJ58EdrIuh\nvO+LzT9rAkayLVC8tD04s7vfXiNHPz4hBnYtMcjCXPdtMeEBuyMXVByyZwKBgQCs\n8KXESx94jP35T8dzm2z5lKUkKFB4KvWovyRpDdKYvsURAvubgjOxXVMCUc3v7oh/\n40Vo8Yvgot5T8GxxEWPf3kWrrP82oc2PbUqXQgINx+XIaDM/Co1P93GBdJKMvpsz\nn/pp0UJI0tvTPApWA7hQ2vA8XruhRgviZ8zYM6LafwKBgFwfdEPaZZjyQBCjXUDB\ni8t1r4u9ttY9BnCMtfC22H06Czi2APH7UrPWrAxjWEMoH5oETD7WoOc3wVNzltAQ\naRt+I7uVULfZvA2QQr04FMKjIdQz9towa2J6OmXCDWs3a+upaCq4mFxCHi7Xd94f\nBvyn0VOvOkX0wklwSy/5XHPW\n-----END PRIVATE KEY-----\n","client_email":"livertrack-storage@livertracker-468816.iam.gserviceaccount.com","client_id":"113949390165142682748","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/livertrack-storage%40livertracker-468816.iam.gserviceaccount.com","universe_domain":"googleapis.com"}
GCS_SIGN_URL_EXPIRY=900

# OpenAI (same as current)
OPENAI_API_KEY=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
```

## Step 2: Deploy to Vercel

1. **Go to [vercel.com](https://vercel.com)** and login
2. **Click "New Project"**
3. **Import from GitHub** - Select `vikashgd/liverTracker`
4. **Configure Project Settings:**
   - **Root Directory:** `web`
   - **Framework:** Next.js (auto-detected)
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next`
   - **Install Command:** `npm install`

## Step 3: Add Environment Variables in Vercel

Copy these EXACT values into Vercel environment variables:

```
DATABASE_URL = postgresql://neondb_owner:npg_XYMsFlo3w0LR@ep-snowy-breeze-aeq72f7j-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require

NEXTAUTH_URL = https://livertracker.com
NEXTAUTH_SECRET = AyTnFdTMWQDp5DUT55gBRvGO7XJ21nensTa77LMGG2g=

EMAIL_SERVER_HOST = smtp.gmail.com
EMAIL_SERVER_PORT = 587
EMAIL_SERVER_USER = vikashgd@gmail.com
EMAIL_SERVER_PASSWORD = tedwhkjfbaqtkrvk
EMAIL_FROM = vikashgd@gmail.com

GOOGLE_CLIENT_ID = 145819462545-86nc55rg1jbr51t6h921n5fgjev1agjk.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET = 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

GCP_PROJECT_ID = livertracker-468816
GCS_BUCKET = livertrack-uploads
GCP_SA_KEY = {"type":"service_account","project_id":"livertracker-468816","private_key_id":"373b2a39f21814c3c0da9f969e49bce7132a1675","private_key":"-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDF/RpuOjlwdDm1\nNdETOjqtiqsoEkcVX6jol8Q/Ytsjpq/kf0+3B3GffV5DEV87ARPnMJo3lEG5c2q1\n3vorCHVpxmLFAS1qXMrw5FQ3DiFe0xD+DWBTNoXqO6d+YiQhX5iV6k/48c91G8Mz\nguM3rVva2VgPLQShmtiO1rzBKk5qp8Qm+wBYM8W9bjSsT7r9U2wXYIRMmWSIJGT6\ncdaSF2e/xJdhTP5G/y7Xw//cYaVhdiqrB5f/WiCHcwllmG/lx4CkRlwU1qYmt9+Y\nAiWfGPjwZJ4y1C2NGGoSPess5H/O6qJmTruhSW+mQEv9MQpXkv5m2lmMAnQt7N0J\nH5xtSNKpAgMBAAECggEAEOJM4Dc1PG/07I1P10DBI0PZj7vAoG59dC8JFydiLQ/4\nclchtafmr9AG+1eJFE+QYnKkcXaXr5h2R6yMZKIT3TbZUm06HGwYXw2hruY/a0Y6\n7edhyQbedFis/Rv3x87Or4OBWWdJpqDSTIYYxAqTyZMnrXeh1vmNBoqtIxiYAllF\n5d9HjvIVKXBeI78T/3ZZjBttt8xW210gEg9Fzd9TuHiW5PVdNpmUPL5PUf4acnZY\n65VgOQiaMQTzVTIONMvKNhhT41V00UTQ9ymvsjx0WVTI7vkZTNpHi0dO2lbYaTmE\nO10kBupbZxK7hss17xOIKeqCsRM5Bj0lpj4gQRY/VwKBgQD8tMiLy2rIVTKw4/te\n0nhByai6UZGEVhZf4MLTqRwFCojOqag957C4KS8/kFev5QmMfXdjk/v2GZ6e3iPo\n5PeBKGdtq+MtuIjKu89G3Glic5ryPxXsfFVrEZQafMsqjWoDYWv7+ewIGLBMpy1S\npG6Nt51Jc+zan2Hm5Vx365rN/wKBgQDIkb3Mle6hKUlcGCikg/pZzlVmHSspcdcE\nnGO4hdJyRKjeYZfu64rT3coLB8LwqH23ZatUn/nZR16SmjPS4xHOGGzOrqLcYhum\nL+TWzyNbj4n/VFaPhHh/fBXy2DFU0zyAp8qo7n20r2oO4sOrvyMpcaMiwYX2z6m1\ntiT51iUvVwKBgQCft28tE7L4zQhNzrnYM3P4OIlgwR8UoghgLsFUX4SrFv5ih84i\n2iXSL42CQit5q2u+lKn5kNVltMmRJVtS3iwkQLImGcZq5j/myo71/WbJ58EdrIuh\nvO+LzT9rAkayLVC8tD04s7vfXiNHPz4hBnYtMcjCXPdtMeEBuyMXVByyZwKBgQCs\n8KXESx94jP35T8dzm2z5lKUkKFB4KvWovyRpDdKYvsURAvubgjOxXVMCUc3v7oh/\n40Vo8Yvgot5T8GxxEWPf3kWrrP82oc2PbUqXQgINx+XIaDM/Co1P93GBdJKMvpsz\n/pp0UJI0tvTPApWA7hQ2vA8XruhRgviZ8zYM6LafwKBgFwfdEPaZZjyQBCjXUDB\ni8t1r4u9ttY9BnCMtfC22H06Czi2APH7UrPWrAxjWEMoH5oETD7WoOc3wVNzltAQ\naRt+I7uVULfZvA2QQr04FMKjIdQz9towa2J6OmXCDWs3a+upaCq4mFxCHi7Xd94f\nBvyn0VOvOkX0wklwSy/5XHPW\n-----END PRIVATE KEY-----\n","client_email":"livertrack-storage@livertracker-468816.iam.gserviceaccount.com","client_id":"113949390165142682748","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/livertrack-storage%40livertracker-468816.iam.gserviceaccount.com","universe_domain":"googleapis.com"}
GCS_SIGN_URL_EXPIRY = 900

OPENAI_API_KEY = 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
```

## Step 4: Deploy and Get Vercel URL

1. **Click "Deploy"** and wait 2-3 minutes
2. **Note your Vercel URL** (e.g., `livertracker-xyz.vercel.app`)

## Step 5: Update Google OAuth for Both URLs

1. **Go to [Google Cloud Console](https://console.cloud.google.com)**
2. **Navigate to:** APIs & Services > Credentials
3. **Edit your OAuth 2.0 Client ID:** `145819462545-86nc55rg1jbr51t6h921n5fgjev1agjk`
4. **Add BOTH redirect URIs:**
   ```
   https://your-vercel-url.vercel.app/api/auth/callback/google
   https://livertracker.com/api/auth/callback/google
   ```

## Step 6: Add Custom Domain in Vercel

1. **In Vercel Dashboard** > Your Project > Settings > Domains
2. **Add Domain:** `livertracker.com`
3. **Add Domain:** `www.livertracker.com` (redirect to main)
4. **Follow DNS instructions** to point your domain to Vercel

## Step 7: Update DNS Records

In your domain registrar (where you bought livertracker.com):

**Add these DNS records:**
```
Type: A
Name: @
Value: 76.76.19.19

Type: CNAME  
Name: www
Value: cname.vercel-dns.com
```

## Step 8: Update Environment Variables for Custom Domain

1. **In Vercel** > Your Project > Settings > Environment Variables
2. **Update NEXTAUTH_URL:**
   ```
   NEXTAUTH_URL = https://livertracker.com
   ```
3. **Redeploy** the project

## Step 9: Test Everything

Visit both URLs and test:
- ✅ `https://your-vercel-url.vercel.app` (temporary)
- ✅ `https://livertracker.com` (your domain)
- ✅ Google OAuth login works on both
- ✅ File upload works
- ✅ Dashboard displays correctly

## Important Notes:

### NextAuth Configuration:
- ✅ **NEXTAUTH_URL** is set to your custom domain
- ✅ **Google OAuth** has both URLs as redirect URIs
- ✅ **Environment variables** are identical to your local setup

### Domain Setup:
- ✅ **Custom domain** points to Vercel
- ✅ **SSL certificate** automatically provided by Vercel
- ✅ **www redirect** to main domain

### Google Services:
- ✅ **OAuth** works with both Vercel URL and custom domain
- ✅ **Cloud Storage** uses same service account
- ✅ **Email** uses same Gmail SMTP

## Troubleshooting:

**OAuth errors?**
- Verify both URLs are in Google Console redirect URIs
- Check NEXTAUTH_URL matches your domain

**Domain not working?**
- DNS changes take 24-48 hours to propagate
- Use Vercel URL while waiting

**Build fails?**
- Check Vercel build logs
- Ensure all environment variables are set

Your LiverTracker app will be live at **https://livertracker.com** 🚀