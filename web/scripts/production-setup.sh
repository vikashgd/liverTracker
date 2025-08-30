#!/bin/bash

# Production Setup Script for Comprehensive Authentication System
# This script prepares the authentication system for production deployment

set -e  # Exit on any error

echo "🚀 Starting Production Setup for Authentication System..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the correct directory
if [ ! -f "package.json" ]; then
    print_error "This script must be run from the web directory containing package.json"
    exit 1
fi

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    print_error ".env.local file not found. Please create it with required environment variables."
    exit 1
fi

print_status "Validating environment variables..."

# Required environment variables for production
REQUIRED_VARS=(
    "NEXTAUTH_URL"
    "NEXTAUTH_SECRET"
    "GOOGLE_CLIENT_ID"
    "GOOGLE_CLIENT_SECRET"
    "DATABASE_URL"
    "EMAIL_SERVER_HOST"
    "EMAIL_SERVER_PORT"
    "EMAIL_SERVER_USER"
    "EMAIL_SERVER_PASSWORD"
    "EMAIL_FROM"
)

# Check each required variable
missing_vars=()
for var in "${REQUIRED_VARS[@]}"; do
    if ! grep -q "^${var}=" .env.local; then
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -ne 0 ]; then
    print_error "Missing required environment variables:"
    for var in "${missing_vars[@]}"; do
        echo "  - $var"
    done
    print_error "Please add these variables to your .env.local file"
    exit 1
fi

print_success "All required environment variables are present"

# Validate NEXTAUTH_SECRET strength
print_status "Validating NEXTAUTH_SECRET strength..."
NEXTAUTH_SECRET=$(grep "^NEXTAUTH_SECRET=" .env.local | cut -d'=' -f2- | tr -d '"')
if [ ${#NEXTAUTH_SECRET} -lt 32 ]; then
    print_warning "NEXTAUTH_SECRET should be at least 32 characters long for production"
    print_status "Generating a new secure NEXTAUTH_SECRET..."
    NEW_SECRET=$(openssl rand -base64 32)
    print_status "Consider updating your NEXTAUTH_SECRET to: $NEW_SECRET"
fi

# Validate NEXTAUTH_URL
print_status "Validating NEXTAUTH_URL..."
NEXTAUTH_URL=$(grep "^NEXTAUTH_URL=" .env.local | cut -d'=' -f2- | tr -d '"')
if [[ ! $NEXTAUTH_URL =~ ^https:// ]]; then
    print_warning "NEXTAUTH_URL should use HTTPS in production: $NEXTAUTH_URL"
fi

# Check database connection
print_status "Testing database connection..."
if command -v npx &> /dev/null; then
    if npx prisma db pull --preview-feature &> /dev/null; then
        print_success "Database connection successful"
    else
        print_error "Database connection failed. Please check your DATABASE_URL"
        exit 1
    fi
else
    print_warning "npx not found. Skipping database connection test"
fi

# Install dependencies
print_status "Installing production dependencies..."
npm ci --only=production

# Generate Prisma client
print_status "Generating Prisma client..."
npx prisma generate

# Run database migrations
print_status "Running database migrations..."
npx prisma migrate deploy

# Build the application
print_status "Building application for production..."
npm run build

# Validate build output
if [ ! -d ".next" ]; then
    print_error "Build failed - .next directory not found"
    exit 1
fi

print_success "Application built successfully"

# Security checks
print_status "Running security checks..."

# Check for development dependencies in production
if npm list --depth=0 --only=dev 2>/dev/null | grep -q "devDependencies"; then
    print_warning "Development dependencies found. Consider using npm ci --only=production"
fi

# Check for sensitive files
SENSITIVE_FILES=(".env" ".env.development" ".env.test" "*.log")
for pattern in "${SENSITIVE_FILES[@]}"; do
    if ls $pattern 1> /dev/null 2>&1; then
        print_warning "Sensitive files found: $pattern - ensure these are not deployed"
    fi
done

# Create production environment checklist
print_status "Creating production deployment checklist..."
cat > production-checklist.md << EOF
# Production Deployment Checklist

## Pre-deployment
- [ ] All environment variables are set correctly
- [ ] NEXTAUTH_SECRET is at least 32 characters
- [ ] NEXTAUTH_URL uses HTTPS
- [ ] Google OAuth credentials are configured for production domain
- [ ] Database migrations have been applied
- [ ] Application builds successfully
- [ ] SSL certificate is configured
- [ ] Domain DNS is properly configured

## Security
- [ ] Rate limiting is enabled
- [ ] CORS is properly configured
- [ ] Security headers are set
- [ ] Session cookies are secure
- [ ] Password policies are enforced
- [ ] Account lockout is configured

## Monitoring
- [ ] Error tracking is configured
- [ ] Authentication logs are being collected
- [ ] Performance monitoring is active
- [ ] Uptime monitoring is configured

## Testing
- [ ] Sign-in with email/password works
- [ ] Sign-up with email/password works
- [ ] Google OAuth sign-in works
- [ ] Password reset flow works
- [ ] Account lockout works after failed attempts
- [ ] Session expiration works correctly
- [ ] Mobile authentication works
- [ ] All protected routes require authentication

## Rollback Plan
- [ ] Database backup is available
- [ ] Previous version deployment is ready
- [ ] Rollback procedure is documented
- [ ] Team is notified of deployment window

## Post-deployment
- [ ] Smoke tests pass
- [ ] Authentication metrics are normal
- [ ] Error rates are acceptable
- [ ] User feedback is monitored
EOF

print_success "Production checklist created: production-checklist.md"

# Create production environment template
print_status "Creating production environment template..."
cat > .env.production.template << EOF
# Production Environment Variables Template
# Copy this file to .env.local and fill in the actual values

# NextAuth Configuration
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=your-super-secure-secret-at-least-32-characters-long

# Google OAuth (Production)
GOOGLE_CLIENT_ID=your-production-google-client-id
GOOGLE_CLIENT_SECRET=your-production-google-client-secret

# Database
DATABASE_URL=your-production-database-url

# Email Configuration (Production SMTP)
EMAIL_SERVER_HOST=your-smtp-host
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your-smtp-username
EMAIL_SERVER_PASSWORD=your-smtp-password
EMAIL_FROM=noreply@yourdomain.com

# Optional: Redis for session storage (recommended for production)
REDIS_URL=your-redis-url

# Optional: Monitoring and logging
SENTRY_DSN=your-sentry-dsn
LOG_LEVEL=info

# Security Settings
BCRYPT_ROUNDS=12
SESSION_MAX_AGE=86400
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX_ATTEMPTS=5
ACCOUNT_LOCKOUT_DURATION=1800000
EOF

print_success "Production environment template created: .env.production.template"

# Create deployment script
print_status "Creating deployment script..."
cat > deploy.sh << 'EOF'
#!/bin/bash

# Production Deployment Script
set -e

echo "🚀 Starting production deployment..."

# Pull latest code
git pull origin main

# Install dependencies
npm ci --only=production

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Build application
npm run build

# Restart application (adjust for your deployment method)
# pm2 restart all
# systemctl restart your-app
# docker-compose restart

echo "✅ Deployment completed successfully"
EOF

chmod +x deploy.sh
print_success "Deployment script created: deploy.sh"

# Create rollback script
print_status "Creating rollback script..."
cat > rollback.sh << 'EOF'
#!/bin/bash

# Rollback Script
set -e

if [ -z "$1" ]; then
    echo "Usage: ./rollback.sh <git-commit-hash>"
    exit 1
fi

COMMIT_HASH=$1

echo "🔄 Starting rollback to commit: $COMMIT_HASH"

# Checkout previous version
git checkout $COMMIT_HASH

# Install dependencies for that version
npm ci --only=production

# Generate Prisma client
npx prisma generate

# Build application
npm run build

# Restart application
# pm2 restart all
# systemctl restart your-app
# docker-compose restart

echo "✅ Rollback completed successfully"
echo "⚠️  Remember to check if database migrations need to be reverted"
EOF

chmod +x rollback.sh
print_success "Rollback script created: rollback.sh"

# Performance optimization recommendations
print_status "Creating performance optimization guide..."
cat > performance-optimization.md << EOF
# Performance Optimization for Production

## Database Optimizations
- Enable connection pooling
- Set appropriate connection limits
- Use read replicas for read-heavy operations
- Implement database query optimization
- Set up proper indexing for auth tables

## Caching Strategy
- Implement Redis for session storage
- Cache user profile data
- Use CDN for static assets
- Enable browser caching headers

## Security Optimizations
- Enable rate limiting at load balancer level
- Use fail2ban for IP blocking
- Implement CAPTCHA for repeated failures
- Set up Web Application Firewall (WAF)

## Monitoring and Alerting
- Set up authentication failure alerts
- Monitor session creation/destruction rates
- Track password reset request patterns
- Monitor OAuth provider response times

## Scaling Considerations
- Use horizontal scaling for auth services
- Implement session affinity if needed
- Consider microservices architecture
- Plan for OAuth provider rate limits
EOF

print_success "Performance optimization guide created: performance-optimization.md"

# Final summary
echo ""
echo "🎉 Production setup completed successfully!"
echo ""
echo "Files created:"
echo "  - production-checklist.md"
echo "  - .env.production.template"
echo "  - deploy.sh"
echo "  - rollback.sh"
echo "  - performance-optimization.md"
echo ""
echo "Next steps:"
echo "1. Review and complete the production checklist"
echo "2. Configure your production environment variables"
echo "3. Set up Google OAuth for your production domain"
echo "4. Test the authentication system in staging"
echo "5. Execute the deployment using deploy.sh"
echo ""
print_success "Ready for production deployment! 🚀"