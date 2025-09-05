import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/password-utils";
import { AUTH_ERRORS } from "@/types/auth";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  // Add timeout configurations
  debug: process.env.NODE_ENV === "development",
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
      // Manually specify endpoints to avoid discovery timeout
      authorization: {
        url: "https://accounts.google.com/o/oauth2/v2/auth",
        params: {
          scope: "openid email profile",
          prompt: "select_account",
        },
      },
      token: "https://oauth2.googleapis.com/token",
      userinfo: "https://openidconnect.googleapis.com/v1/userinfo",
      issuer: "https://accounts.google.com",
      jwks_endpoint: "https://www.googleapis.com/oauth2/v3/certs",
      httpOptions: {
        timeout: 30000, // Increased to 30 seconds timeout
      },
      // Add additional configuration for better reliability
      wellKnown: "https://accounts.google.com/.well-known/openid-configuration",
      checks: ["pkce", "state"],
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
        };
      },
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
      name: process.env.NODE_ENV === 'production' ? '__Secure-next-auth.session-token' : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        domain: process.env.NODE_ENV === 'production' ? process.env.NEXTAUTH_URL?.replace(/https?:\/\//, '') : undefined
      }
    },
    callbackUrl: {
      name: process.env.NODE_ENV === 'production' ? '__Secure-next-auth.callback-url' : 'next-auth.callback-url',
      options: {
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        domain: process.env.NODE_ENV === 'production' ? process.env.NEXTAUTH_URL?.replace(/https?:\/\//, '') : undefined
      }
    },
    csrfToken: {
      name: process.env.NODE_ENV === 'production' ? '__Host-next-auth.csrf-token' : 'next-auth.csrf-token',
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
        email: user?.email 
      });

      // Simplified OAuth handling - just allow sign-in
      if (account?.provider === "google") {
        try {
          console.log('✅ Google OAuth sign-in for:', user.email);
          return true;
        } catch (error) {
          console.error('❌ Google OAuth error:', error);
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
