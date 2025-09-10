# Vercel CLI Local Development Guide

## Why Use Vercel CLI?

Great suggestion! Using Vercel CLI locally helps us:
- ✅ Test the exact Vercel environment locally
- ✅ Sync production environment variables
- ✅ Test Edge Runtime compatibility (middleware, edge functions)
- ✅ Catch deployment issues before pushing to GitHub
- ✅ Faster iteration without waiting for GitHub → Vercel deployment

## Setup Steps

### 1. Install Vercel CLI (Already Done)
```bash
npm install vercel --save-dev
```

### 2. Link Your Project to Vercel
```bash
npm run vercel:link
```
This connects your local project to your Vercel deployment.

### 3. Pull Environment Variables
```bash
npm run vercel:env
```
This downloads your production environment variables to `.env.local`.

### 4. Run Local Vercel Development
```bash
npm run vercel:dev
```
This runs your app in the Vercel environment locally.

## Available Scripts

- `npm run vercel:dev` - Run local development with Vercel environment
- `npm run vercel:build` - Build locally using Vercel's build process
- `npm run vercel:deploy` - Deploy directly to production
- `npm run vercel:env` - Pull environment variables from Vercel
- `npm run vercel:link` - Link local project to Vercel project

## Benefits for LiverTracker

1. **Test Middleware Locally** - We can test Edge Runtime compatibility before deployment
2. **Environment Sync** - Ensure local environment matches production
3. **Database Testing** - Test with production database connection
4. **Build Validation** - Catch Prisma, TypeScript, and other build issues locally
5. **Faster Development** - No need to push to GitHub for every test

## Workflow

1. Make changes to your code
2. Test locally with `npm run vercel:dev`
3. If everything works, push to GitHub
4. Vercel auto-deploys from GitHub

This approach catches issues early and speeds up development!

## Next Steps

1. Run `npm run vercel:link` to connect to your Vercel project
2. Run `npm run vercel:env` to sync environment variables
3. Run `npm run vercel:dev` to start local development
4. Test your LiverTracker app in the Vercel environment locally

This is a much smarter approach than debugging deployment issues in production!