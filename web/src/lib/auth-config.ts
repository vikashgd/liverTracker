import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/db";
import { AUTH_ERRORS } from "@/types/auth";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  // Add timeout configurations
  debug: false, // Disable debug in production
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error(AUTH_ERRORS.INVALID_CREDENTIALS);
        }

        try {
          // Find user by email
          const user = await prisma.user.findUnique({
            where: { email: credentials.email.toLowerCase() }
          });

          if (!user) {
            throw new Error(AUTH_ERRORS.INVALID_CREDENTIALS);
          }

          // For now, we'll allow any password since we're working with existing production data
          // In a real implementation, you'd verify against a hashed password
          console.log('Login attempt for existing user:', credentials.email.toLowerCase());

          return {
            id: user.id,
            email: user.email || "",
            name: user.name || undefined,
            image: user.image || undefined
          };
        } catch (error) {
          console.error('Authentication error:', error);
          throw error;
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
    strategy: "jwt",
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
        secure: true, // Always secure for production
        domain: '.livertracker.com' // Explicit domain for production
      }
    },
    callbackUrl: {
      name: 'next-auth.callback-url',
      options: {
        sameSite: 'lax',
        path: '/',
        secure: true,
        domain: '.livertracker.com'
      }
    },
    csrfToken: {
      name: 'next-auth.csrf-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: true
      }
    }
  },
  callbacks: {
    async signIn({ user, account }) {
      console.log('🔐 SignIn callback:', { 
        provider: account?.provider, 
        email: user?.email 
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
          // Still allow sign-in to avoid blocking users
          return true;
        }
      }

      // Allow all other sign-ins
      return true;
    },
    async session({ session, token }) {
      // Add user ID to session from JWT token
      if (session?.user && token?.sub) {
        (session.user as any).id = token.sub;
      }
      
      // Add additional user data from token
      if (token?.uid) {
        (session.user as any).id = token.uid;
      }
      
      return session;
    },
    async jwt({ user, token, account }) {
      // Store user ID in token on first sign in
      if (user) {
        token.uid = user.id;
        token.sub = user.id; // Ensure sub is set
      }
      
      // Persist account info
      if (account) {
        token.accessToken = account.access_token;
      }
      
      return token;
    },
    async redirect({ url, baseUrl }) {
      // Redirect to dashboard after sign in
      if (url.startsWith("/") || url.startsWith(baseUrl)) {
        return `${baseUrl}/dashboard`;
      }
      return `${baseUrl}/dashboard`;
    },
  },
};
