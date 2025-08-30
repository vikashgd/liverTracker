#!/bin/bash

# Setup Test Database for Authentication System
# This script sets up a local SQLite database for testing

echo "🗄️  Setting up test database for authentication system..."

# Check if we're in the correct directory
if [ ! -f "package.json" ]; then
    echo "❌ This script must be run from the web directory"
    exit 1
fi

# Backup current schema
if [ -f "prisma/schema.prisma" ]; then
    cp prisma/schema.prisma prisma/schema.prisma.backup
    echo "✅ Backed up current schema"
fi

# Create SQLite version of schema for testing
cat > prisma/schema.test.prisma << 'EOF'
generator client {
  provider = "prisma-client-js"
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "sqlite"
  url      = "file:./test.db"
}

model User {
  id            String          @id @default(cuid())
  email         String?         @unique
  name          String?
  password      String?
  emailVerified DateTime?
  image         String?
  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt
  
  // Security fields
  lastLoginAt   DateTime?
  loginAttempts Int             @default(0)
  lockedUntil   DateTime?
  
  // Authentication relationships
  passwordResets PasswordReset[]
  securityEvents SecurityEvent[]
  userSessions   UserSession[]
  accounts       Account[]
  sessions       Session[]
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

model PasswordReset {
  id        String   @id @default(cuid())
  userId    String
  token     String   @unique
  expires   DateTime
  used      Boolean  @default(false)
  createdAt DateTime @default(now())
  
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model SecurityEvent {
  id        String   @id @default(cuid())
  type      String
  userId    String?
  ipAddress String
  userAgent String?
  metadata  String?  // JSON as string for SQLite
  timestamp DateTime @default(now())
  severity  String   @default("medium")
  resolved  Boolean  @default(false)
  
  user      User?    @relation(fields: [userId], references: [id], onDelete: SetNull)
}

model UserSession {
  id           String    @id @default(cuid())
  userId       String
  sessionToken String    @unique
  deviceInfo   String?   // JSON as string for SQLite
  ipAddress    String?
  userAgent    String?
  createdAt    DateTime  @default(now())
  lastActiveAt DateTime  @default(now())
  expiresAt    DateTime
  revokedAt    DateTime?
  revokedReason String?
  
  user         User      @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model LoginAttempt {
  id        String   @id @default(cuid())
  email     String
  success   Boolean
  ipAddress String?
  userAgent String?
  createdAt DateTime @default(now())
}
EOF

echo "✅ Created test schema"

# Update environment for testing
cat > .env.test << 'EOF'
# Test Environment Configuration
DATABASE_URL="file:./test.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="test-secret-key-for-authentication-system-testing-only"

# Email Configuration (for testing - won't actually send emails)
EMAIL_SERVER_HOST="smtp.example.com"
EMAIL_SERVER_PORT="587"
EMAIL_SERVER_USER="test@example.com"
EMAIL_SERVER_PASSWORD="test-password"
EMAIL_FROM="test@example.com"

# Google OAuth (for testing - use dummy values)
GOOGLE_CLIENT_ID="test-google-client-id"
GOOGLE_CLIENT_SECRET="test-google-client-secret"
EOF

echo "✅ Created test environment file"

# Use test schema
cp prisma/schema.test.prisma prisma/schema.prisma

# Generate Prisma client
echo "🔄 Generating Prisma client..."
npx prisma generate

# Create database and tables
echo "🔄 Creating database tables..."
npx prisma db push --force-reset

echo "✅ Test database setup complete!"
echo ""
echo "🚀 Next steps:"
echo "1. Copy test environment: cp .env.test .env.local"
echo "2. Start development server: npm run dev"
echo "3. Open browser: http://localhost:3000/auth/signup"
echo "4. Create test account and test authentication"
echo ""
echo "📊 To view database: npx prisma studio"
echo "🔄 To restore original schema: cp prisma/schema.prisma.backup prisma/schema.prisma"