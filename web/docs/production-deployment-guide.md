# Production Deployment Guide - Comprehensive Authentication System

## Overview

This guide provides step-by-step instructions for deploying the comprehensive authentication system to production. The system includes email/password authentication, Google OAuth, security features, and mobile optimization.

## Pre-Deployment Requirements

### 1. Environment Setup

#### Required Environment Variables

```bash
# Core NextAuth Configuration
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=your-super-secure-secret-at-least-32-characters

# Google OAuth (Production Credentials)
GOOGLE_CLIENT_ID=your-production-google-client-id
GOOGLE_CLIENT_SECRET=your-production-google-client-secret

# Database Configuration
DATABASE_URL=postgresql://user:password@host:port/database

# Email Service (Production SMTP)
EMAIL_SERVER_HOST=smtp.youremailprovider.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your-smtp-username
EMAIL_SERVER_PASSWORD=your-smtp-password
EMAIL_FROM=noreply@yourdomain.com

# Security Configuration
BCRYPT_ROUNDS=12
SESSION_MAX_AGE=86400
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX_ATTEMPTS=5
ACCOUNT_LOCKOUT_DURATION=1800000
```

#### Optional but Recommended

```bash
# Redis for Session Storage (Recommended)
REDIS_URL=redis://user:password@host:port

# Monitoring and Logging
SENTRY_DSN=your-sentry-dsn
LOG_LEVEL=info

# Additional Security
CORS_ORIGIN=https://yourdomain.com
TRUSTED_HOSTS=yourdomain.com,www.yourdomain.com
```

### 2. Google OAuth Setup

1. **Create Production OAuth Application**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Enable Google+ API
   - Create OAuth 2.0 credentials

2. **Configure Authorized Domains**
   ```
   Authorized JavaScript origins:
   - https://yourdomain.com
   
   Authorized redirect URIs:
   - https://yourdomain.com/api/auth/callback/google
   ```

3. **Update Environment Variables**
   - Copy Client ID and Client Secret to production environment

### 3. Database Preparation

#### Production Database Setup

1. **Create Production Database**
   ```sql
   CREATE DATABASE your_production_db;
   CREATE USER your_db_user WITH PASSWORD 'secure_password';
   GRANT ALL PRIVILEGES ON DATABASE your_production_db TO your_db_user;
   ```

2. **Configure Connection Pooling**
   ```bash
   # Example for PgBouncer
   DATABASE_URL="postgresql://user:password@pgbouncer-host:6543/database?pgbouncer=true"
   ```

3. **Set Up SSL Connection**
   ```bash
   DATABASE_URL="postgresql://user:password@host:port/database?sslmode=require"
   ```

## Deployment Process

### Step 1: Pre-Deployment Validation

Run the production setup script:

```bash
cd web
./scripts/production-setup.sh
```

This script will:
- Validate all environment variables
- Test database connection
- Check security configurations
- Generate deployment artifacts

### Step 2: Database Migration

```bash
# Generate Prisma client
npx prisma generate

# Apply migrations to production database
npx prisma migrate deploy

# Verify migration success
npx prisma db pull
```

### Step 3: Application Build

```bash
# Install production dependencies
npm ci --only=production

# Build the application
npm run build

# Verify build success
ls -la .next/
```

### Step 4: Security Configuration

#### 1. Configure Reverse Proxy (Nginx Example)

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' accounts.google.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' accounts.google.com;";

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=auth:10m rate=5r/m;
    
    location /api/auth/ {
        limit_req zone=auth burst=10 nodelay;
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### 2. Configure Firewall Rules

```bash
# Allow HTTP and HTTPS
sudo ufw allow 80
sudo ufw allow 443

# Allow SSH (adjust port as needed)
sudo ufw allow 22

# Block all other incoming traffic
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Enable firewall
sudo ufw enable
```

### Step 5: Application Deployment

#### Option A: PM2 Deployment

```bash
# Install PM2 globally
npm install -g pm2

# Create PM2 ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'auth-system',
    script: 'npm',
    args: 'start',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
EOF

# Start application
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup
```

#### Option B: Docker Deployment

```dockerfile
# Dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --only=production

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npx prisma generate
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    env_file:
      - .env.local
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: your_db
      POSTGRES_USER: your_user
      POSTGRES_PASSWORD: your_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    restart: unless-stopped

volumes:
  postgres_data:
```

### Step 6: Post-Deployment Verification

#### 1. Health Checks

```bash
# Test application health
curl -f https://yourdomain.com/api/health

# Test authentication endpoints
curl -f https://yourdomain.com/api/auth/providers

# Test database connection
curl -f https://yourdomain.com/api/auth/session
```

#### 2. Authentication Flow Testing

1. **Email/Password Authentication**
   - Sign up with new account
   - Sign in with credentials
   - Test password reset flow
   - Verify account lockout after failed attempts

2. **Google OAuth**
   - Test Google sign-in
   - Verify account linking
   - Test OAuth error handling

3. **Security Features**
   - Test rate limiting
   - Verify session expiration
   - Test CSRF protection
   - Verify secure cookie settings

#### 3. Mobile Testing

- Test on iOS Safari
- Test on Android Chrome
- Verify touch interactions
- Test autofill functionality
- Verify responsive design

## Monitoring and Maintenance

### 1. Set Up Monitoring

#### Application Monitoring

```javascript
// Add to your monitoring service (e.g., Sentry)
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});

// Custom authentication metrics
export function trackAuthEvent(event, userId, metadata) {
  Sentry.addBreadcrumb({
    message: `Auth event: ${event}`,
    category: 'auth',
    data: { userId, ...metadata },
  });
}
```

#### Database Monitoring

```sql
-- Monitor authentication events
SELECT 
  DATE_TRUNC('hour', timestamp) as hour,
  type,
  COUNT(*) as event_count
FROM "SecurityEvent"
WHERE timestamp > NOW() - INTERVAL '24 hours'
GROUP BY hour, type
ORDER BY hour DESC;

-- Monitor failed login attempts
SELECT 
  "ipAddress",
  COUNT(*) as failed_attempts,
  MAX(timestamp) as last_attempt
FROM "SecurityEvent"
WHERE type = 'login_failed'
  AND timestamp > NOW() - INTERVAL '1 hour'
GROUP BY "ipAddress"
HAVING COUNT(*) > 5
ORDER BY failed_attempts DESC;
```

### 2. Backup Strategy

#### Database Backups

```bash
#!/bin/bash
# backup-db.sh

BACKUP_DIR="/backups/postgres"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_$DATE.sql"

# Create backup
pg_dump $DATABASE_URL > $BACKUP_FILE

# Compress backup
gzip $BACKUP_FILE

# Remove backups older than 30 days
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_FILE.gz"
```

#### Application Backups

```bash
#!/bin/bash
# backup-app.sh

BACKUP_DIR="/backups/app"
DATE=$(date +%Y%m%d_%H%M%S)

# Create application backup
tar -czf "$BACKUP_DIR/app_$DATE.tar.gz" \
  --exclude=node_modules \
  --exclude=.next \
  --exclude=logs \
  /path/to/your/app

echo "Application backup completed: app_$DATE.tar.gz"
```

### 3. Log Management

#### Log Rotation

```bash
# /etc/logrotate.d/auth-system
/path/to/your/app/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        pm2 reload auth-system
    endscript
}
```

#### Log Analysis

```bash
# Monitor authentication failures
tail -f /path/to/logs/auth.log | grep "authentication_failed"

# Monitor rate limiting
tail -f /var/log/nginx/access.log | grep "429"

# Monitor OAuth errors
tail -f /path/to/logs/oauth.log | grep "ERROR"
```

## Rollback Procedures

### 1. Application Rollback

```bash
#!/bin/bash
# rollback.sh

if [ -z "$1" ]; then
    echo "Usage: ./rollback.sh <git-commit-hash>"
    exit 1
fi

COMMIT_HASH=$1

echo "Rolling back to commit: $COMMIT_HASH"

# Stop application
pm2 stop auth-system

# Checkout previous version
git checkout $COMMIT_HASH

# Install dependencies
npm ci --only=production

# Build application
npm run build

# Start application
pm2 start auth-system

echo "Rollback completed"
```

### 2. Database Rollback

```bash
#!/bin/bash
# rollback-db.sh

if [ -z "$1" ]; then
    echo "Usage: ./rollback-db.sh <backup-file>"
    exit 1
fi

BACKUP_FILE=$1

echo "Rolling back database from: $BACKUP_FILE"

# Stop application
pm2 stop auth-system

# Restore database
psql $DATABASE_URL < $BACKUP_FILE

# Start application
pm2 start auth-system

echo "Database rollback completed"
```

## Troubleshooting

### Common Issues

#### 1. Google OAuth Not Working

**Symptoms:**
- OAuth redirect fails
- "redirect_uri_mismatch" error

**Solutions:**
- Verify NEXTAUTH_URL matches OAuth configuration
- Check Google Console redirect URIs
- Ensure HTTPS is used in production

#### 2. Session Issues

**Symptoms:**
- Users logged out unexpectedly
- Session not persisting

**Solutions:**
- Check NEXTAUTH_SECRET configuration
- Verify cookie settings
- Check Redis connection (if using Redis)

#### 3. Database Connection Issues

**Symptoms:**
- Authentication fails
- Database timeout errors

**Solutions:**
- Check DATABASE_URL format
- Verify connection pooling settings
- Monitor database connections

#### 4. Rate Limiting Issues

**Symptoms:**
- Legitimate users blocked
- 429 errors

**Solutions:**
- Adjust rate limiting thresholds
- Implement IP whitelisting
- Check reverse proxy configuration

### Performance Issues

#### 1. Slow Authentication

**Diagnosis:**
```bash
# Check database query performance
EXPLAIN ANALYZE SELECT * FROM "User" WHERE email = 'user@example.com';

# Monitor authentication endpoint response times
curl -w "@curl-format.txt" -o /dev/null -s https://yourdomain.com/api/auth/session
```

**Solutions:**
- Add database indexes
- Implement caching
- Optimize Prisma queries

#### 2. High Memory Usage

**Diagnosis:**
```bash
# Monitor Node.js memory usage
pm2 monit

# Check for memory leaks
node --inspect server.js
```

**Solutions:**
- Implement connection pooling
- Optimize session storage
- Add memory limits

## Security Checklist

### Pre-Production Security Review

- [ ] All environment variables use secure values
- [ ] NEXTAUTH_SECRET is cryptographically secure
- [ ] Database uses SSL connections
- [ ] Rate limiting is properly configured
- [ ] CORS is restricted to production domains
- [ ] Security headers are implemented
- [ ] Input validation is comprehensive
- [ ] Error messages don't leak sensitive information
- [ ] Logging excludes sensitive data
- [ ] Session cookies are secure and httpOnly
- [ ] CSRF protection is enabled
- [ ] SQL injection protection is verified
- [ ] XSS protection is implemented

### Ongoing Security Maintenance

- [ ] Regular security updates
- [ ] Monitor authentication logs
- [ ] Review failed login patterns
- [ ] Update OAuth credentials periodically
- [ ] Audit user permissions
- [ ] Test backup and recovery procedures
- [ ] Review and update security policies

## Support and Maintenance

### Regular Maintenance Tasks

#### Daily
- Monitor error logs
- Check authentication metrics
- Verify backup completion

#### Weekly
- Review security events
- Update dependencies
- Performance analysis

#### Monthly
- Security audit
- Capacity planning
- Disaster recovery testing

### Emergency Contacts

```
Production Issues: [Your team contact]
Database Issues: [DBA contact]
Security Issues: [Security team contact]
Infrastructure: [DevOps contact]
```

### Documentation Updates

Keep this guide updated with:
- Environment changes
- New security requirements
- Performance optimizations
- Lessons learned from incidents

---

## Conclusion

This comprehensive authentication system provides enterprise-grade security with user-friendly features. Following this deployment guide ensures a secure, scalable, and maintainable production environment.

For additional support or questions, refer to the project documentation or contact the development team.