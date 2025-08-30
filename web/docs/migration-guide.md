# User Migration Guide - Comprehensive Authentication System

## Overview

This guide outlines the migration process from the existing magic link authentication system to the new comprehensive authentication system that includes email/password and Google OAuth authentication.

## Migration Strategy

### Phase 1: Preparation (Pre-Migration)

#### 1. Database Schema Updates

The new authentication system requires additional database fields and tables:

```sql
-- New fields added to User table
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "emailVerified" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "emailVerificationToken" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "passwordHash" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "twoFactorSecret" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "backupCodes" TEXT[];
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastLoginAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "loginCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "accountStatus" TEXT NOT NULL DEFAULT 'active';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "securitySettings" JSONB DEFAULT '{}';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "preferences" JSONB DEFAULT '{}';
```

#### 2. User Communication Strategy

**Timeline: 2 weeks before migration**

1. **Email Notification Template**

```html
<!DOCTYPE html>
<html>
<head>
    <title>Important: Authentication System Update</title>
</head>
<body>
    <h2>We're Upgrading Your Account Security</h2>
    
    <p>Dear [User Name],</p>
    
    <p>We're excited to announce significant improvements to our authentication system that will make your account more secure and easier to access.</p>
    
    <h3>What's Changing?</h3>
    <ul>
        <li><strong>Password Authentication:</strong> You can now sign in with a password instead of waiting for email links</li>
        <li><strong>Google Sign-In:</strong> Quick and secure sign-in with your Google account</li>
        <li><strong>Enhanced Security:</strong> Better protection against unauthorized access</li>
        <li><strong>Mobile Optimization:</strong> Improved experience on mobile devices</li>
    </ul>
    
    <h3>What You Need to Do</h3>
    <p>On [Migration Date], you'll need to set up a password for your account:</p>
    <ol>
        <li>Visit our sign-in page</li>
        <li>Click "Set Up Password" next to your email</li>
        <li>Create a secure password</li>
        <li>Optionally, link your Google account for faster sign-ins</li>
    </ol>
    
    <h3>Important Dates</h3>
    <ul>
        <li><strong>[Migration Date]:</strong> New authentication system goes live</li>
        <li><strong>[Cutoff Date]:</strong> Magic link authentication will be discontinued</li>
    </ul>
    
    <p>Don't worry - your existing account and all your data will remain exactly the same. Only the way you sign in is changing.</p>
    
    <p>If you have any questions, please contact our support team at [support email].</p>
    
    <p>Thank you for your continued trust in our platform.</p>
    
    <p>Best regards,<br>The [Platform Name] Team</p>
</body>
</html>
```

2. **In-App Notification**

```javascript
// Add to existing dashboard/header component
const MigrationNotification = () => {
  const [dismissed, setDismissed] = useState(false);
  
  if (dismissed || user?.passwordHash) return null;
  
  return (
    <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <InfoIcon className="h-5 w-5 text-blue-400" />
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm text-blue-700">
            <strong>Security Upgrade Available:</strong> Set up a password for faster, more secure sign-ins.
            <a href="/auth/setup-password" className="font-medium underline ml-2">
              Set Up Now
            </a>
          </p>
        </div>
        <div className="ml-auto pl-3">
          <button
            onClick={() => setDismissed(true)}
            className="text-blue-400 hover:text-blue-600"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
```

### Phase 2: Dual Authentication Support (Migration Period)

#### 1. Hybrid Authentication Configuration

During the migration period, both authentication methods will be supported:

```javascript
// auth-config.ts - Hybrid configuration
export const authOptions = {
  providers: [
    // New password-based authentication
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });

        if (!user) {
          return null;
        }

        // Check if user has password set
        if (user.passwordHash) {
          const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
          if (!isValid) {
            return null;
          }
        } else {
          // Redirect to password setup for existing users
          throw new Error("PASSWORD_SETUP_REQUIRED");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      },
    }),

    // Google OAuth
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    // Legacy email provider (temporary)
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: process.env.EMAIL_SERVER_PORT,
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
    }),
  ],
  // ... rest of configuration
};
```

#### 2. Password Setup Flow

Create a dedicated password setup page for existing users:

```javascript
// pages/auth/setup-password.tsx
export default function SetupPasswordPage() {
  const { data: session } = useSession();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSetupPassword = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/setup-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        toast.success("Password set up successfully!");
        router.push("/dashboard");
      } else {
        toast.error("Failed to set up password");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  if (!session) {
    return <div>Please sign in first</div>;
  }

  return (
    <div className="max-w-md mx-auto mt-8">
      <h1 className="text-2xl font-bold mb-6">Set Up Your Password</h1>
      
      <form onSubmit={handleSetupPassword} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            New Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">
            Confirm Password
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            required
          />
        </div>
        
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? "Setting up..." : "Set Up Password"}
        </button>
      </form>
    </div>
  );
}
```

#### 3. Migration Tracking

Track migration progress with a dedicated table:

```sql
CREATE TABLE "UserMigration" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "migratedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "migrationMethod" TEXT NOT NULL, -- 'password_setup', 'google_oauth'
    "previousAuthMethod" TEXT NOT NULL DEFAULT 'magic_link',
    "ipAddress" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "UserMigration_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserMigration_userId_key" ON "UserMigration"("userId");
```

### Phase 3: Migration Execution

#### 1. Migration Monitoring Dashboard

Create an admin dashboard to monitor migration progress:

```javascript
// pages/admin/migration-dashboard.tsx
export default function MigrationDashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchMigrationStats();
  }, []);

  const fetchMigrationStats = async () => {
    const response = await fetch("/api/admin/migration-stats");
    const data = await response.json();
    setStats(data);
  };

  if (!stats) return <div>Loading...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Migration Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Total Users</h3>
          <p className="text-3xl font-bold text-blue-600">{stats.totalUsers}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Migrated Users</h3>
          <p className="text-3xl font-bold text-green-600">{stats.migratedUsers}</p>
          <p className="text-sm text-gray-600">
            {((stats.migratedUsers / stats.totalUsers) * 100).toFixed(1)}%
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Pending Migration</h3>
          <p className="text-3xl font-bold text-orange-600">{stats.pendingUsers}</p>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Migration Methods</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Password Setup:</span>
            <span className="font-semibold">{stats.passwordMigrations}</span>
          </div>
          <div className="flex justify-between">
            <span>Google OAuth:</span>
            <span className="font-semibold">{stats.googleMigrations}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
```

#### 2. Automated Migration Reminders

Set up automated reminders for users who haven't migrated:

```javascript
// lib/migration-reminders.ts
export async function sendMigrationReminders() {
  const unmigrated = await prisma.user.findMany({
    where: {
      passwordHash: null,
      UserMigration: null,
      createdAt: {
        lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
      }
    }
  });

  for (const user of unmigrated) {
    await sendEmail({
      to: user.email,
      subject: "Action Required: Set Up Your Password",
      template: "migration-reminder",
      data: {
        name: user.name,
        email: user.email,
        setupUrl: `${process.env.NEXTAUTH_URL}/auth/setup-password`,
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()
      }
    });
  }
}

// Schedule this to run daily
```

### Phase 4: Legacy System Deprecation

#### 1. Gradual Deprecation Timeline

**Week 1-2: Soft Deprecation**
- Show migration prompts on every login
- Send weekly reminder emails
- Display countdown timer

**Week 3-4: Hard Deprecation Warning**
- Block magic link authentication for new sign-ins
- Allow existing sessions to continue
- Send final migration notices

**Week 5: Full Deprecation**
- Disable magic link authentication completely
- Redirect all authentication to new system
- Provide emergency contact for migration issues

#### 2. Emergency Migration Support

Create an emergency migration endpoint for users who need assistance:

```javascript
// pages/api/admin/emergency-migration.ts
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Verify admin authentication
  const session = await getServerSession(req, res, authOptions);
  if (!session || !isAdmin(session.user)) {
    return res.status(403).json({ error: "Unauthorized" });
  }

  const { email, temporaryPassword } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Set temporary password
    const hashedPassword = await bcrypt.hash(temporaryPassword, 12);
    
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashedPassword,
        accountStatus: 'password_reset_required'
      }
    });

    // Log the emergency migration
    await prisma.auditLog.create({
      data: {
        action: 'emergency_migration',
        entityType: 'user',
        entityId: user.id,
        userId: session.user.id,
        metadata: {
          targetUser: email,
          reason: 'emergency_migration_support'
        }
      }
    });

    // Send notification to user
    await sendEmail({
      to: email,
      subject: "Emergency Password Setup Completed",
      template: "emergency-migration",
      data: {
        name: user.name,
        temporaryPassword,
        changePasswordUrl: `${process.env.NEXTAUTH_URL}/auth/change-password`
      }
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Emergency migration error:", error);
    res.status(500).json({ error: "Migration failed" });
  }
}
```

### Phase 5: Post-Migration Cleanup

#### 1. Remove Legacy Code

After successful migration, remove legacy authentication code:

```bash
# Remove legacy email provider configuration
# Remove magic link related components
# Clean up temporary migration tables
# Update documentation
```

#### 2. Migration Success Analysis

Generate a comprehensive migration report:

```javascript
// lib/migration-report.ts
export async function generateMigrationReport() {
  const stats = await prisma.$transaction([
    // Total users before migration
    prisma.user.count(),
    
    // Successfully migrated users
    prisma.userMigration.count(),
    
    // Migration methods breakdown
    prisma.userMigration.groupBy({
      by: ['migrationMethod'],
      _count: true
    }),
    
    // Migration timeline
    prisma.userMigration.groupBy({
      by: ['migratedAt'],
      _count: true,
      orderBy: { migratedAt: 'asc' }
    }),
    
    // Users who needed emergency assistance
    prisma.auditLog.count({
      where: { action: 'emergency_migration' }
    })
  ]);

  return {
    totalUsers: stats[0],
    migratedUsers: stats[1],
    migrationMethods: stats[2],
    migrationTimeline: stats[3],
    emergencyMigrations: stats[4],
    successRate: (stats[1] / stats[0]) * 100
  };
}
```

## Communication Templates

### 1. Pre-Migration Announcement

**Subject:** Important: We're Upgrading Your Account Security

**Content:** [See HTML template above]

### 2. Migration Reminder

**Subject:** Reminder: Set Up Your Password (Action Required)

```
Hi [Name],

This is a friendly reminder that our new authentication system is now live, and you haven't set up your password yet.

Setting up a password takes less than 2 minutes and gives you:
✓ Faster sign-ins (no more waiting for emails)
✓ Better security for your account
✓ Option to sign in with Google

Set up your password now: [Setup Link]

Need help? Reply to this email or contact support at [support email].

Thanks,
The [Platform] Team
```

### 3. Final Migration Notice

**Subject:** Final Notice: Magic Link Authentication Ending Soon

```
Hi [Name],

This is your final reminder that magic link authentication will be discontinued on [Date].

To continue accessing your account, you must set up a password before [Date].

Set up your password now: [Setup Link]

After [Date], you won't be able to sign in without a password.

If you need assistance, please contact our support team immediately at [support email].

Thanks,
The [Platform] Team
```

### 4. Migration Success Confirmation

**Subject:** Welcome to Our New Authentication System!

```
Hi [Name],

Great news! You've successfully set up your new password and your account is now more secure than ever.

Here's what you can do now:
✓ Sign in instantly with your email and password
✓ Use Google Sign-In for even faster access
✓ Enjoy enhanced security features

Your next sign-in: [Sign-in Link]

Thanks for making the switch!

The [Platform] Team
```

## Rollback Plan

### Emergency Rollback Procedure

If critical issues arise during migration:

1. **Immediate Actions**
   - Revert to previous authentication configuration
   - Restore magic link functionality
   - Notify users of temporary rollback

2. **Database Rollback**
   ```sql
   -- Restore previous auth configuration
   UPDATE "User" SET 
     "passwordHash" = NULL,
     "emailVerified" = NULL
   WHERE "passwordHash" IS NOT NULL;
   
   -- Clear migration tracking
   DELETE FROM "UserMigration";
   ```

3. **Communication**
   - Send immediate notification to all users
   - Explain the temporary rollback
   - Provide new timeline for migration

### Rollback Communication Template

**Subject:** Temporary Return to Previous Sign-In Method

```
Hi [Name],

We've temporarily returned to our previous sign-in method (magic links) while we resolve some technical issues with our new authentication system.

What this means for you:
- Continue signing in with magic links as before
- Your account and data are completely safe
- We'll notify you when the new system is ready

We apologize for any inconvenience and appreciate your patience.

The [Platform] Team
```

## Success Metrics

### Key Performance Indicators

1. **Migration Rate**
   - Target: 95% of active users migrated within 4 weeks
   - Measurement: Daily migration tracking

2. **User Experience**
   - Target: <2% increase in support tickets
   - Measurement: Support ticket volume and categories

3. **Security Improvements**
   - Target: 50% reduction in authentication-related security events
   - Measurement: Security event monitoring

4. **Performance**
   - Target: <500ms authentication response time
   - Measurement: API response time monitoring

### Migration Timeline

```
Week -2: Pre-migration communication begins
Week -1: Final preparations and testing
Week 0: Migration launch (dual authentication)
Week 1-2: Active migration period with prompts
Week 3-4: Deprecation warnings
Week 5: Legacy system shutdown
Week 6: Post-migration analysis and cleanup
```

## Support and Troubleshooting

### Common Migration Issues

1. **User Can't Remember Email**
   - Solution: Email verification process
   - Escalation: Manual verification by support

2. **Password Setup Fails**
   - Solution: Clear browser cache, try different browser
   - Escalation: Emergency migration by admin

3. **Google OAuth Issues**
   - Solution: Check browser settings, disable ad blockers
   - Escalation: Alternative authentication method

4. **Lost Access During Migration**
   - Solution: Emergency password reset
   - Escalation: Admin-assisted account recovery

### Support Team Training

Ensure support team is trained on:
- New authentication system features
- Migration process and timeline
- Common troubleshooting steps
- Emergency migration procedures
- Escalation protocols

---

This migration guide ensures a smooth transition from the legacy magic link system to the comprehensive authentication system while maintaining user trust and minimizing disruption.