// lib/auth.ts
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        username: { label: "Email or Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          throw new Error("Please enter email/username and password");
        }

        const loginInput = credentials.username.toLowerCase().trim();

        // Find user by email OR username
        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { email: loginInput },
              { username: loginInput },
            ],
            isActive: true,
          },
          include: {
            business: true,
          },
        });

        if (!user) {
          throw new Error("Invalid email/username or password");
        }

        // Verify password
        const isValid = await bcrypt.compare(credentials.password, user.passwordHash);

        if (!isValid) {
          throw new Error("Invalid email/username or password");
        }

        // Check if temp password has expired (staff invites have 72hr expiry)
        if (
          user.mustChangePassword &&
          user.tempPasswordExpiresAt &&
          new Date() > user.tempPasswordExpiresAt
        ) {
          throw new Error(
            "Temporary password has expired. Please contact your salon administrator."
          );
        }

        // Return user data
        return {
          id: user.id,
          email: user.email,
          name: user.firstName ? `${user.firstName} ${user.lastName}` : user.username,
          username: user.username,
          role: user.role,
          businessId: user.businessId,
          businessName: user.business.name,
          businessSlug: user.business.slug,
          onboardingComplete: user.business.onboardingComplete,
          isPlatform: user.business.isPlatform ?? false,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.role = user.role;
        token.businessId = user.businessId;
        token.businessName = user.businessName;
        token.businessSlug = user.businessSlug;
        token.onboardingComplete = user.onboardingComplete;
        token.isPlatform = user.isPlatform;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
        session.user.role = token.role as string;
        session.user.businessId = token.businessId as string;
        session.user.businessName = token.businessName as string;
        session.user.businessSlug = token.businessSlug as string;
        // Treat undefined as true for backward compat with existing sessions
        session.user.onboardingComplete = token.onboardingComplete ?? true;
        session.user.isPlatform = (token.isPlatform as boolean) ?? false;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
};
