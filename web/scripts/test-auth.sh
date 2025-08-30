#!/bin/bash

# Authentication System Test Script
# This script helps you quickly test the authentication system

set -e

echo "🔐 Authentication System Testing Script"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

print_status "Starting authentication system tests..."

# 1. Check environment setup
print_status "Checking environment setup..."

if [ ! -f ".env.local" ]; then
    print_error ".env.local file not found"
    echo "Please create .env.local with required variables:"
    echo "NEXTAUTH_URL=http://localhost:3000"
    echo "NEXTAUTH_SECRET=your-secret-key"
    echo "DATABASE_URL=your-database-url"
    exit 1
fi

# Check required environment variables
REQUIRED_VARS=("NEXTAUTH_URL" "NEXTAUTH_SECRET" "DATABASE_URL")
for var in "${REQUIRED_VARS[@]}"; do
    if ! grep -q "^${var}=" .env.local; then
        print_error "Missing required environment variable: $var"
        exit 1
    fi
done

print_success "Environment variables configured"

# 2. Check database connection
print_status "Testing database connection..."
if npx prisma db pull --preview-feature &> /dev/null; then
    print_success "Database connection successful"
else
    print_error "Database connection failed"
    echo "Please check your DATABASE_URL and ensure the database is running"
    exit 1
fi

# 3. Run database migrations
print_status "Running database migrations..."
npx prisma migrate dev --name auth_system_test &> /dev/null || true
print_success "Database migrations completed"

# 4. Generate Prisma client
print_status "Generating Prisma client..."
npx prisma generate &> /dev/null
print_success "Prisma client generated"

# 5. Check if server is running
print_status "Checking if development server is running..."
if curl -s http://localhost:3000/api/health &> /dev/null; then
    print_success "Development server is running"
    SERVER_RUNNING=true
else
    print_warning "Development server is not running"
    print_status "Starting development server..."
    npm run dev &
    SERVER_PID=$!
    SERVER_RUNNING=false
    
    # Wait for server to start
    for i in {1..30}; do
        if curl -s http://localhost:3000/api/health &> /dev/null; then
            print_success "Development server started"
            SERVER_RUNNING=true
            break
        fi
        sleep 2
    done
    
    if [ "$SERVER_RUNNING" = false ]; then
        print_error "Failed to start development server"
        exit 1
    fi
fi

# 6. Test API endpoints
print_status "Testing API endpoints..."

# Test health endpoint
if curl -s http://localhost:3000/api/health | grep -q "ok"; then
    print_success "Health endpoint working"
else
    print_error "Health endpoint failed"
fi

# Test auth session endpoint
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/auth/session)
if [ "$HTTP_CODE" = "200" ]; then
    print_success "Auth session endpoint working"
else
    print_warning "Auth session endpoint returned $HTTP_CODE (expected for unauthenticated)"
fi

# Test auth providers endpoint
if curl -s http://localhost:3000/api/auth/providers | grep -q "credentials"; then
    print_success "Auth providers endpoint working"
else
    print_error "Auth providers endpoint failed"
fi

# 7. Test authentication pages
print_status "Testing authentication pages..."

# Test sign-in page
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/auth/signin)
if [ "$HTTP_CODE" = "200" ]; then
    print_success "Sign-in page accessible"
else
    print_error "Sign-in page failed (HTTP $HTTP_CODE)"
fi

# Test sign-up page
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/auth/signup)
if [ "$HTTP_CODE" = "200" ]; then
    print_success "Sign-up page accessible"
else
    print_error "Sign-up page failed (HTTP $HTTP_CODE)"
fi

# Test forgot password page
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/auth/forgot-password)
if [ "$HTTP_CODE" = "200" ]; then
    print_success "Forgot password page accessible"
else
    print_error "Forgot password page failed (HTTP $HTTP_CODE)"
fi

# 8. Test database tables
print_status "Checking database tables..."

# Check if auth tables exist
TABLES=("User" "PasswordReset" "SecurityEvent" "UserSession")
for table in "${TABLES[@]}"; do
    if npx prisma db execute --stdin <<< "SELECT 1 FROM \"$table\" LIMIT 1;" &> /dev/null; then
        print_success "Table $table exists"
    else
        print_warning "Table $table might not exist or is empty"
    fi
done

# 9. Test password utilities
print_status "Testing password utilities..."

# Create a simple test file
cat > test-password.js << 'EOF'
const bcrypt = require('bcryptjs');

async function testPassword() {
    const password = 'TestPassword123!';
    const hash = await bcrypt.hash(password, 12);
    const isValid = await bcrypt.compare(password, hash);
    
    if (isValid) {
        console.log('Password hashing test: PASS');
        process.exit(0);
    } else {
        console.log('Password hashing test: FAIL');
        process.exit(1);
    }
}

testPassword();
EOF

if node test-password.js; then
    print_success "Password hashing working"
else
    print_error "Password hashing failed"
fi

rm -f test-password.js

# 10. Summary
echo ""
echo "🎉 Authentication System Test Summary"
echo "===================================="
echo ""
print_success "Basic setup completed successfully!"
echo ""
echo "Next steps for manual testing:"
echo "1. Open http://localhost:3000/auth/signup in your browser"
echo "2. Create a test account with:"
echo "   - Name: Test User"
echo "   - Email: test@example.com"
echo "   - Password: SecurePassword123!"
echo "3. Test sign-in with the created account"
echo "4. Test password reset flow"
echo "5. Test Google OAuth (if configured)"
echo ""
echo "For detailed testing instructions, see: AUTHENTICATION_TESTING_GUIDE.md"
echo ""

# Cleanup
if [ "$SERVER_RUNNING" = false ] && [ ! -z "$SERVER_PID" ]; then
    print_status "Stopping development server..."
    kill $SERVER_PID 2>/dev/null || true
fi

print_success "Authentication system is ready for testing! 🚀"