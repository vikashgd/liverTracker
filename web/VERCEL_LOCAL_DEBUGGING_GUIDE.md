# Vercel CLI Local Debugging Guide

## 🎯 **Why Use Vercel CLI Locally**

Using Vercel CLI locally helps debug production issues because:
- **Same environment** as production deployment
- **Real serverless functions** instead of Next.js dev server
- **Production-like routing** and middleware
- **Environment variables** from Vercel
- **Edge runtime** behavior matches production
- **API routes** behave exactly like deployed version

## 🚀 **Setup Instructions**

### **1. Install Vercel CLI**
```bash
# Install globally
npm install -g vercel

# Or use with npx (no global install)
npx vercel --version
```

### **2. Login to Vercel**
```bash
vercel login
# Follow prompts to authenticate
```

### **3. Link Your Project**
```bash
# In your web directory
cd web
vercel link

# Select your existing project or create new one
# Choose: livertracker.com (or your project name)
```

### **4. Pull Environment Variables**
```bash
# Download production environment variables
vercel env pull .env.local

# This creates/updates .env.local with production values
```

## 🔧 **Running Locally with Vercel**

### **Development Mode (Recommended)**
```bash
# Start Vercel dev server (mirrors production)
vercel dev

# Or specify port
vercel dev --listen 3000
```

### **Production Build Locally**
```bash
# Build for production
vercel build

# Serve production build locally
vercel dev --prod
```

## 🐛 **Debugging Production Issues**

### **1. PDF.js Worker Issue**
```bash
# Start with Vercel dev
vercel dev

# Test the problematic endpoint
curl http://localhost:3000/api/pdfjs/worker

# Check logs in terminal for detailed errors
```

### **2. Upload Form Issues**
```bash
# Run with Vercel dev
vercel dev

# Upload a file and watch terminal logs
# Vercel dev shows detailed API route logs
```

### **3. Database Connection Issues**
```bash
# Vercel dev uses production database
vercel dev

# Test database endpoints
curl http://localhost:3000/api/health
```

## 📊 **Vercel Dev vs Next.js Dev**

| Feature | `npm run dev` | `vercel dev` |
|---------|---------------|--------------|
| **Environment** | Development | Production-like |
| **API Routes** | Node.js runtime | Serverless functions |
| **Environment Variables** | Local .env files | Vercel environment |
| **Edge Functions** | Simulated | Real Edge runtime |
| **Middleware** | Development mode | Production behavior |
| **Build Process** | Development build | Production build |
| **Error Handling** | Development errors | Production errors |

## 🔍 **Advanced Debugging**

### **1. Function Logs**
```bash
# Run with verbose logging
vercel dev --debug

# Or check function logs
vercel logs --follow
```

### **2. Environment Inspection**
```bash
# Check which environment variables are loaded
vercel env ls

# Pull specific environment
vercel env pull .env.production --environment=production
```

### **3. Build Analysis**
```bash
# Analyze build output
vercel build --debug

# Check build logs
vercel inspect
```

## 🛠 **Common Commands**

### **Project Management**
```bash
# Link to existing project
vercel link

# Check project status
vercel ls

# View project settings
vercel inspect
```

### **Environment Variables**
```bash
# List all environment variables
vercel env ls

# Add new environment variable
vercel env add

# Remove environment variable
vercel env rm VARIABLE_NAME
```

### **Deployment**
```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod

# Check deployment status
vercel ls
```

## 🎯 **Debugging Your Current Issues**

### **For PDF.js Worker Error:**
```bash
# 1. Start Vercel dev
vercel dev

# 2. Test the worker endpoint
curl -v http://localhost:3000/api/pdfjs/worker

# 3. Check terminal for detailed error logs
# 4. Compare behavior with production
```

### **For Upload Form Issues:**
```bash
# 1. Run with Vercel dev
vercel dev

# 2. Open browser to http://localhost:3000
# 3. Try uploading a PDF file
# 4. Watch terminal for API route logs
# 5. Check network tab for exact error responses
```

## 📋 **Quick Setup Script**

Let me create a quick setup script for you:

```bash
#!/bin/bash
# setup-vercel-debug.sh

echo "🚀 Setting up Vercel CLI for local debugging..."

# Install Vercel CLI if not installed
if ! command -v vercel &> /dev/null; then
    echo "Installing Vercel CLI..."
    npm install -g vercel
fi

# Check if already linked
if [ ! -f ".vercel/project.json" ]; then
    echo "Linking to Vercel project..."
    vercel link
fi

# Pull environment variables
echo "Pulling environment variables..."
vercel env pull .env.local

echo "✅ Setup complete!"
echo ""
echo "🔧 To start debugging:"
echo "   vercel dev"
echo ""
echo "🌐 Then visit: http://localhost:3000"
echo "📊 Watch terminal for detailed logs"
```

## 💡 **Pro Tips**

### **1. Use Vercel Dev for Production Issues**
- Always use `vercel dev` when debugging production-specific issues
- Regular `npm run dev` won't catch serverless function issues

### **2. Environment Variables**
- Use `vercel env pull` to get exact production environment
- Don't mix local and production environment variables

### **3. Logging**
- Vercel dev shows detailed function logs
- Use `console.log` in API routes for debugging
- Check both terminal and browser network tab

### **4. Hot Reloading**
- Vercel dev supports hot reloading like Next.js dev
- Changes to API routes restart the function
- Frontend changes update immediately

## 🚨 **When to Use Each**

### **Use `npm run dev` for:**
- General development
- Frontend changes
- Component development
- Quick iterations

### **Use `vercel dev` for:**
- Production issue debugging
- API route problems
- Environment-specific issues
- Deployment preparation
- Testing with production data

Would you like me to create the setup script and help you get started with Vercel CLI debugging?