# 🚀 LiverTracker Vercel Deployment - Step by Step

Based on your current project setup with Next.js, Prisma, NextAuth, and Google Cloud Storage.

## Step 1: Prepare Your Environment Variables

Create `web/.env.production` with these exact variables from your `.env.local`:

```bash
# Copy these from your working .env.local and update URLs
DATABASE_URL="postgresql://username:password@your-neon-db.neon.tech/livertracker?sslmode=require"
DIRECT_URL="postgresql://username:password@your-neon-db.neon.tech/livertracker?sslmode=require"

NEXTAUTH_URL="https://your-app-name.vercel.app"
NEXTAUTH_SECRET="your-secret-here"

GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

GOOGLE_CLOUD_PROJECT_ID="your-project-id"
GOOGLE_CLOUD_STORAGE_BUCKET="your-bucket-name"
GOOGLE_CLOUD_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour-key-here\n-----END PRIVATE KEY-----"
GOOGLE_CLOUD_CLIENT_EMAIL="your-service-account@project.iam.gserviceaccount.com"
```

## Step 2: Push to GitHub

```bash
# In your project root
git add .
git commit -m "Ready for deployment"
git push origin main
```

## Step 3: Deploy on Vercel

1. **Go to [vercel.com](https://vercel.com)**
2. **Click "New Project"**
3. **Import from GitHub** - Select your repository
4. **Configure these settings:**
   - **Root Directory:** `web`
   - **Framework:** Next.js (auto-detected)
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next`

## Step 4: Add Environment Variables in Vercel

In the deployment screen, add these environment variables:

```
DATABASE_URL = [your production database URL]
DIRECT_URL = [same as DATABASE_URL]
NEXTAUTH_URL = https://your-app-name.vercel.app
NEXTAUTH_SECRET = [generate new secret for production]
GOOGLE_CLIENT_ID = [your Google OAuth client ID]
GOOGLE_CLIENT_SECRET = [your Google OAuth client secret]
GOOGLE_CLOUD_PROJECT_ID = [your GCP project ID]
GOOGLE_CLOUD_STORAGE_BUCKET = [your GCS bucket name]
GOOGLE_CLOUD_PRIVATE_KEY = [your service account private key]
GOOGLE_CLOUD_CLIENT_EMAIL = [your service account email]
```

## Step 5: Click Deploy

Wait 2-3 minutes for the build to complete.

## Step 6: Update Google OAuth

1. **Go to [Google Cloud Console](https://console.cloud.google.com)**
2. **APIs & Services > Credentials**
3. **Edit your OAuth 2.0 Client**
4. **Add authorized redirect URI:**
   ```
   https://your-app-name.vercel.app/api/auth/callback/google
   ```

## Step 7: Run Database Migration

```bash
# In your local web/ directory
cd web
npx prisma migrate deploy
```

## Step 8: Test Your Deployment

Visit `https://your-app-name.vercel.app` and test:
- ✅ Landing page loads
- ✅ Google OAuth login works
- ✅ File upload works
- ✅ Dashboard displays correctly

## Troubleshooting

**Build fails?**
- Check Vercel build logs
- Ensure all dependencies are in package.json

**OAuth errors?**
- Verify redirect URI in Google Console
- Check NEXTAUTH_URL matches your domain

**Database connection fails?**
- Verify DATABASE_URL format
- Ensure Neon database allows connections

**File upload doesn't work?**
- Check Google Cloud Storage permissions
- Verify service account key format

## Future Updates

Every time you push to `main` branch, Vercel automatically deploys:

```bash
git add .
git commit -m "Update feature"
git push origin main
```

That's it! Your LiverTracker app is now live on Vercel.