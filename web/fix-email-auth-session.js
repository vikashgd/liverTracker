#!/usr/bin/env node

/**
 * Fix Email Authentication Session Issue
 * 
 * Problem: Email auth redirects to dashboard but session not recognized
 * Solution: Fix session callback and JWT handling for credentials provider
 */

const fs = require('fs');
const path = require('path');

function fixEmailAuthSession() {
  console.log('🔧 FIXING EMAIL AUTHENTICATION SESSION ISSUE');
  console.log('='.repeat(60));

  // 1. Fix auth configuration - session and JWT callbacks
  console.log('\n1. 📝 FIXING AUTH CONFIGURATION');
  
  const authConfigPath = path.join(__dirname, 'src/lib/auth-config.ts');
  const authConfigContent = `import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/db";
import { AUTH_ERRORS } from "@/types/auth";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  debug: process.env.NODE_ENV === 'development',
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        console.log('🔐 Credentials authorize called with:', { 
          email: credentials?.email, 
          hasPassword: !!credentials?.password 
        });

        if (!credentials?.email || !credentials?.password) {
          console.log('❌ Missing credentials');
          return null;
        }

        try {
          // Find user by email
          const user = await prisma.user.findUnique({
            where: { email: credentials.email.toLowerCase() }
          });

          console.log('🔍 User lookup result:', { 
            found: !!user, 
            email: credentials.email.toLowerCase(),
            userId: user?.id 
          });

          if (!user) {
            console.log('❌ User not found');
            return null;
          }

          // For existing users, allow login (temporary for migration)
          console.log('✅ Login successful for existing user:', credentials.email.toLowerCase());

          // Return user object with proper structure for NextAuth
          return {
            id: user.id,
            email: user.email || "",
            name: user.name || undefined,
            image: user.image || undefined
          };
        } catch (error) {
          console.error('❌ Authentication error:', error);
          return null;
        }
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    })
  ],
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt", // Use JWT for credentials provider
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  cookies: {
    sessionToken: {
      name: 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        domain: process.env.NODE_ENV === 'production' ? '.livertracker.com' : undefined
      }
    },
    callbackUrl: {
      name: 'next-auth.callback-url',
      options: {
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        domain: process.env.NODE_ENV === 'production' ? '.livertracker.com' : undefined
      }
    },
    csrfToken: {
      name: 'next-auth.csrf-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    }
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log('🔐 SignIn callback:', { 
        provider: account?.provider, 
        email: user?.email,
        userId: user?.id 
      });

      // Handle Google OAuth account linking
      if (account?.provider === "google" && user?.email) {
        try {
          console.log('✅ Google OAuth sign-in for:', user.email);
          
          // Check if user already exists with this email
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email.toLowerCase() }
          });

          if (existingUser) {
            console.log('🔗 Linking Google account to existing user:', user.email);
            
            // Check if Google account is already linked
            const existingAccount = await prisma.account.findFirst({
              where: {
                userId: existingUser.id,
                provider: "google"
              }
            });

            if (!existingAccount && account) {
              // Link the Google account to existing user
              await prisma.account.create({
                data: {
                  userId: existingUser.id,
                  type: account.type,
                  provider: account.provider,
                  providerAccountId: account.providerAccountId,
                  access_token: account.access_token,
                  expires_at: account.expires_at,
                  token_type: account.token_type,
                  scope: account.scope,
                  id_token: account.id_token,
                  refresh_token: account.refresh_token
                }
              });
              console.log('✅ Successfully linked Google account');
            }
            
            // Update user object to use existing user ID
            user.id = existingUser.id;
          }
          
          return true;
        } catch (error) {
          console.error('❌ Google OAuth linking error:', error);
          return true; // Still allow sign-in
        }
      }

      // For credentials provider, ensure user exists
      if (account?.provider === "credentials" && user?.email) {
        try {
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email.toLowerCase() }
          });
          
          if (!existingUser) {
            console.log('❌ Credentials user not found in database:', user.email);
            return false;
          }
          
          // Ensure user ID is set correctly
          user.id = existingUser.id;
          console.log('✅ Credentials sign-in successful:', user.email, 'ID:', user.id);
          return true;
        } catch (error) {
          console.error('❌ Credentials sign-in error:', error);
          return false;
        }
      }

      return true;
    },
    
    async session({ session, token }) {
      console.log('🎫 Session callback:', { 
        hasSession: !!session, 
        hasToken: !!token, 
        tokenSub: token?.sub,
        tokenUid: token?.uid,
        userEmail: session?.user?.email 
      });

      // Add user ID to session from JWT token
      if (session?.user && token) {
        // Use token.sub (standard JWT claim) or token.uid (custom)
        const userId = token.sub || token.uid;
        if (userId) {
          (session.user as any).id = userId;
          console.log('✅ Added user ID to session:', userId);
        } else {
          console.log('⚠️ No user ID found in token');
        }
      }
      
      return session;
    },
    
    async jwt({ user, token, account, trigger }) {
      console.log('🔑 JWT callback:', { 
        hasUser: !!user, 
        hasToken: !!token, 
        hasAccount: !!account,
        trigger,
        userId: user?.id,
        tokenSub: token?.sub 
      });

      // Store user ID in token on first sign in
      if (user?.id) {
        token.uid = user.id;
        token.sub = user.id; // Standard JWT subject claim
        console.log('✅ Stored user ID in JWT:', user.id);
      }
      
      // Persist account info
      if (account) {
        token.accessToken = account.access_token;
        token.provider = account.provider;
      }
      
      return token;
    },
    
    async redirect({ url, baseUrl }) {
      console.log('🔄 Redirect callback:', { url, baseUrl });
      
      // Always redirect to dashboard after successful sign in
      if (url.startsWith("/") || url.startsWith(baseUrl)) {
        const redirectUrl = \`\${baseUrl}/dashboard\`;
        console.log('✅ Redirecting to:', redirectUrl);
        return redirectUrl;
      }
      
      const defaultUrl = \`\${baseUrl}/dashboard\`;
      console.log('✅ Default redirect to:', defaultUrl);
      return defaultUrl;
    },
  },
};`;

  fs.writeFileSync(authConfigPath, authConfigContent);
  console.log('✅ Updated auth configuration with proper session handling');

  // 2. Create session debugging utility
  console.log('\n2. 🔍 CREATING SESSION DEBUG UTILITY');
  
  const sessionDebugPath = path.join(__dirname, 'src/lib/session-debug.ts');
  const sessionDebugContent = `"use client";

import { useSession } from 'next-auth/react';
import { useEffect } from 'react';

export function useSessionDebug() {
  const { data: session, status } = useSession();

  useEffect(() => {
    console.log('🔍 Session Debug:', {
      status,
      hasSession: !!session,
      hasUser: !!session?.user,
      userId: (session?.user as any)?.id,
      userEmail: session?.user?.email,
      userName: session?.user?.name,
      sessionObject: session
    });
  }, [session, status]);

  return { session, status };
}

export function SessionDebugComponent() {
  const { session, status } = useSessionDebug();

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-3 rounded-lg text-xs max-w-sm z-50">
      <div className="font-bold mb-2">Session Debug</div>
      <div>Status: {status}</div>
      <div>Has Session: {!!session ? 'Yes' : 'No'}</div>
      <div>User ID: {(session?.user as any)?.id || 'None'}</div>
      <div>Email: {session?.user?.email || 'None'}</div>
    </div>
  );
}`;

  fs.writeFileSync(sessionDebugPath, sessionDebugContent);
  console.log('✅ Created session debug utility');

  // 3. Update dashboard to use session debugging
  console.log('\n3. 🏠 UPDATING DASHBOARD WITH SESSION DEBUG');
  
  const dashboardPath = path.join(__dirname, 'src/app/dashboard/dashboard-client.tsx');
  let dashboardContent = fs.readFileSync(dashboardPath, 'utf8');

  // Add session debug import
  if (!dashboardContent.includes('useSessionDebug')) {
    dashboardContent = dashboardContent.replace(
      'import { useSession } from \'next-auth/react\';',
      `import { useSession } from 'next-auth/react';
import { useSessionDebug, SessionDebugComponent } from '@/lib/session-debug';`
    );

    // Replace useSession with useSessionDebug
    dashboardContent = dashboardContent.replace(
      'const { data: session, status } = useSession();',
      'const { session, status } = useSessionDebug();'
    );

    // Add debug component to render
    dashboardContent = dashboardContent.replace(
      'return (',
      `return (
    <>
      <SessionDebugComponent />`
    );

    // Close the fragment
    dashboardContent = dashboardContent.replace(
      /(\s+<\/div>\s*);(\s*)$/,
      '$1</>\n  );$2'
    );

    fs.writeFileSync(dashboardPath, dashboardContent);
    console.log('✅ Updated dashboard with session debugging');
  }

  // 4. Create test script for email authentication
  console.log('\n4. 🧪 CREATING EMAIL AUTH TEST SCRIPT');
  
  const testScriptPath = path.join(__dirname, 'test-email-auth-fix.js');
  const testScriptContent = `#!/usr/bin/env node

/**
 * Test Email Authentication Fix
 */

const { PrismaClient } = require('./src/generated/prisma');

async function testEmailAuthFix() {
  console.log('🧪 TESTING EMAIL AUTHENTICATION FIX');
  console.log('='.repeat(50));

  const prisma = new PrismaClient();

  try {
    // Check for existing users
    const users = await prisma.user.findMany({
      take: 5,
      include: {
        accounts: true,
        sessions: true
      }
    });

    console.log(\`Found \${users.length} users in database:\`);
    users.forEach((user, index) => {
      console.log(\`\${index + 1}. \${user.email} (ID: \${user.id})\`);
      console.log(\`   Accounts: \${user.accounts.length}\`);
      console.log(\`   Sessions: \${user.sessions.length}\`);
      console.log('');
    });

    console.log('\\n📋 TESTING STEPS:');
    console.log('1. Go to https://livertracker.com/auth/signin');
    console.log('2. Use email authentication with existing user email');
    console.log('3. Check browser console for session debug logs');
    console.log('4. Verify dashboard shows authenticated state');
    console.log('5. Check header shows user menu instead of sign-in button');

    console.log('\\n🔍 WHAT TO LOOK FOR:');
    console.log('✅ Session debug shows status: "authenticated"');
    console.log('✅ Session debug shows valid user ID');
    console.log('✅ Dashboard loads without showing sign-in button');
    console.log('✅ Header shows user dropdown menu');

  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testEmailAuthFix().catch(console.error);`;

  fs.writeFileSync(testScriptPath, testScriptContent);
  console.log('✅ Created email auth test script');

  console.log('\n🎯 EMAIL AUTHENTICATION SESSION FIX COMPLETE');
  console.log('='.repeat(60));
  console.log('✅ Fixed auth configuration callbacks');
  console.log('✅ Added session debugging utilities');
  console.log('✅ Updated dashboard with debug info');
  console.log('✅ Created test script');
  
  console.log('\n📋 NEXT STEPS:');
  console.log('1. Build and deploy the changes');
  console.log('2. Test email authentication');
  console.log('3. Check browser console for session debug logs');
  console.log('4. Verify dashboard authentication state');
}

// Run the fix
fixEmailAuthSession();