import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(
  process.env.NEXT_PUBLIC_CONVEX_URL || "https://greedy-mastiff-107.convex.cloud"
);

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    // ─── Google OAuth ───────────────────────────────────────────────────────────
    Google({
      clientId:
        process.env.GOOGLE_CLIENT_ID ||
        process.env.AUTH_GOOGLE_ID ||
        process.env.GOOGLE_ID ||
        undefined,
      clientSecret:
        process.env.GOOGLE_CLIENT_SECRET ||
        process.env.AUTH_GOOGLE_SECRET ||
        process.env.GOOGLE_SECRET ||
        undefined,
    }),

    // ─── GitHub OAuth ───────────────────────────────────────────────────────────
    GitHub({
      clientId:
        process.env.GITHUB_ID ||
        process.env.GITHUB_CLIENT_ID ||
        process.env.AUTH_GITHUB_ID ||
        undefined,
      clientSecret:
        process.env.GITHUB_SECRET ||
        process.env.GITHUB_CLIENT_SECRET ||
        process.env.AUTH_GITHUB_SECRET ||
        undefined,
    }),

    // ─── Email + Password ───────────────────────────────────────────────────────
    Credentials({
      name: "Email & Mot de passe",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          const cleanEmail = String(credentials.email).toLowerCase().trim();
          const user = await convex.query(api.users.getUserByEmail, {
            email: cleanEmail,
          });

          if (!user || !user.passwordHash) return null;

          const isValid = await bcrypt.compare(
            String(credentials.password),
            user.passwordHash
          );

          if (!isValid) return null;

          return {
            id: user.userId,
            name: user.name,
            email: user.email,
            image: user.avatarUrl,
          };
        } catch (err) {
          console.error("Credentials authorize error:", err);
          return null;
        }
      },
    }),
  ],

  callbacks: {
    // ─── Store user in Convex + sync with Cloudflare after OAuth sign-in ────────
    async signIn({ user, account }) {
      if (user?.email && account?.provider !== "credentials") {
        try {
          // 1. Upsert profile in Convex
          await convex.mutation(api.users.storeUser, {
            userId: user.id || `usr_${Date.now().toString(36)}`,
            name: user.name || "Utilisateur",
            email: user.email,
            avatarUrl: user.image || undefined,
            provider: account?.provider,
          });

          // 2. Sync with Cloudflare D1 backend (for API key creation etc.)
          const backendUrl =
            process.env.NEXT_PUBLIC_BACKEND_API_URL ||
            "https://lshorter-api.fiatechnologiecam.workers.dev";
          const secret = process.env.FRONTEND_API_SECRET || "lsh_secret_live_prod_2026";

          await fetch(`${backendUrl}/api/v1/users/sync`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Frontend-Secret": secret,
            },
            body: JSON.stringify({
              id: user.id || `usr_${Date.now().toString(36)}`,
              name: user.name || "Utilisateur",
              email: user.email,
              avatarUrl: user.image || undefined,
              provider: account?.provider,
            }),
          });
        } catch (error) {
          console.error("Post sign-in sync error:", error);
        }
      }
      return true;
    },

    // ─── Embed userId + plan + avatar from Convex into JWT token ───────────────
    async jwt({ token, user, account }) {
      if (user) {
        token.userId = user.id;
        token.provider = account?.provider;
        token.picture = user.image;
        token.avatarUrl = user.image;
      }

      // Enrich token with Convex profile (plan, quotas, avatar, onboarding status)
      if (token.userId || token.email) {
        try {
          let convexUser = null;
          if (token.userId) {
            convexUser = await convex.query(api.users.getCurrentUser, {
              userId: String(token.userId),
            });
          }
          if (!convexUser && token.email) {
            convexUser = await convex.query(api.users.getUserByEmail, {
              email: String(token.email),
            });
          }
          if (convexUser) {
            token.userId = convexUser.userId;
            token.plan = convexUser.plan;
            token.hasCompletedOnboarding = convexUser.hasCompletedOnboarding;
            token.clicksThisMonth = convexUser.clicksThisMonth;
            token.clicksLimit = convexUser.clicksLimit;
            if (convexUser.avatarUrl) {
              token.picture = convexUser.avatarUrl;
              token.avatarUrl = convexUser.avatarUrl;
            }
            if (convexUser.name) {
              token.name = convexUser.name;
            }
          }
        } catch {
          // Convex unavailable — continue with basic token
        }
      }

      return token;
    },

    // ─── Expose token data in useSession() client hook ───────────────────────────
    async session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.userId || token.sub || "");
        session.user.image = (token.avatarUrl as string) || (token.picture as string) || session.user.image;
        session.user.name = (token.name as string) || session.user.name;
        (session.user as any).avatarUrl = (token.avatarUrl as string) || (token.picture as string) || session.user.image;
        (session.user as any).plan = token.plan || "FREEMIUM";
        (session.user as any).hasCompletedOnboarding = token.hasCompletedOnboarding ?? false;
        (session.user as any).clicksThisMonth = token.clicksThisMonth ?? 0;
        (session.user as any).clicksLimit = token.clicksLimit ?? 100_000;
        (session.user as any).provider = token.provider;
      }
      return session;
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  secret:
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    "lshorter_nextauth_super_secret_key_prod_2026",

  trustHost: true,

  session: { strategy: "jwt" },
});
