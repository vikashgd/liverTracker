#!/bin/bash

# Vercel CLI Local Debugging Setup Script
# This script sets up Vercel CLI for debugging production issues locally

echo "🚀 Setting up Vercel CLI for local debugging..."
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this from the web directory."
    exit 1
fi

# Install Vercel CLI if not installed
echo "1. Checking Vercel CLI installation..."
if ! command -v vercel &> /dev/null; then
    echo "   Installing Vercel CLI globally..."
    npm install -g vercel
    echo "   ✅ Vercel CLI installed"
else
    echo "   ✅ Vercel CLI already installed"
fi

# Check Vercel CLI version
echo "   📋 Vercel CLI version: $(vercel --version)"
echo ""

# Check if user is logged in
echo "2. Checking Vercel authentication..."
if vercel whoami &> /dev/null; then
    echo "   ✅ Already logged in as: $(vercel whoami)"
else
    echo "   🔐 Please log in to Vercel..."
    vercel login
fi
echo ""

# Check if project is linked
echo "3. Checking project linking..."
if [ -f ".vercel/project.json" ]; then
    echo "   ✅ Project already linked"
    PROJECT_NAME=$(cat .vercel/project.json | grep -o '"name":"[^"]*' | cut -d'"' -f4)
    echo "   📋 Linked to project: $PROJECT_NAME"
else
    echo "   🔗 Linking to Vercel project..."
    echo "   Please select your LiverTracker project or create a new one"
    vercel link
fi
echo ""

# Pull environment variables
echo "4. Pulling environment variables..."
if vercel env pull .env.local; then
    echo "   ✅ Environment variables pulled to .env.local"
else
    echo "   ⚠️  Could not pull environment variables (this is optional)"
fi
echo ""

# Check if .env.local was created/updated
if [ -f ".env.local" ]; then
    ENV_COUNT=$(grep -c "=" .env.local 2>/dev/null || echo "0")
    echo "   📋 Found $ENV_COUNT environment variables in .env.local"
fi
echo ""

echo "🎉 Setup complete!"
echo ""
echo "🔧 To start debugging with Vercel CLI:"
echo "   vercel dev"
echo ""
echo "🌐 Then visit: http://localhost:3000"
echo "📊 Watch terminal for detailed API route logs"
echo ""
echo "💡 Debugging tips:"
echo "   - Use 'vercel dev --debug' for verbose logging"
echo "   - Check both terminal logs and browser network tab"
echo "   - API routes run as serverless functions (like production)"
echo "   - Environment variables match production"
echo ""
echo "🐛 For your PDF.js worker issue:"
echo "   1. Run: vercel dev"
echo "   2. Test: curl http://localhost:3000/api/pdfjs/worker"
echo "   3. Check terminal for detailed error logs"
echo ""
echo "📋 Other useful commands:"
echo "   vercel logs --follow    # View live function logs"
echo "   vercel env ls          # List environment variables"
echo "   vercel inspect         # View project details"