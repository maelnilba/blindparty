import { type GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";

/**
 * Wrapper for unstable_getServerSession, used in trpc createContext and the
 * restricted API route
 *
 * Don't worry too much about the "unstable", it's safe to use but the syntax
 * may change in future versions
 *
 * @see https://next-auth.js.org/configuration/nextjs
 */

export const getServerAuthSession = async (ctx: {
  req: GetServerSidePropsContext["req"];
  res: GetServerSidePropsContext["res"];
}) => {
  return await getServerSession(ctx.req, ctx.res, authOptions);
};

import { type NextAuthOptions } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import GoogleProvider from "next-auth/providers/google";
import SpotifyProvider from "next-auth/providers/spotify";

// Prisma adapter for NextAuth, optional and can be removed
import { PrismaAdapter } from "@next-auth/prisma-adapter";

import { prisma } from "@server/db";
import { env } from "env/server.mjs";
import { DeezerProvider } from "./providers";

// Prisma adapter for NextAuth, optional and can be removed

export const authOptions: NextAuthOptions = {
  debug: env.NODE_ENV !== "production",
  pages: {
    signIn: "/sign-in",
    newUser: "/dashboard",
    error: "/auth/error",
  },
  events: {
    async signIn({ user, account }) {
      await prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          platform: account?.provider,
        },
      });
    },
  },
  callbacks: {
    session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        session.user.role = user.role;
      }
      return session;
    },
  },
  adapter: PrismaAdapter(prisma),
  providers: [
    SpotifyProvider({
      clientId: env.SPOTIFY_CLIENT_ID,
      clientSecret: env.SPOTIFY_CLIENT_SECRET,
      authorization: {
        params: { scope: "playlist-read-private playlist-read-collaborative" },
      },
    }),
    DiscordProvider({
      clientId: env.DISCORD_CLIENT_ID,
      clientSecret: env.DISCORD_CLIENT_SECRET,
    }),
    GoogleProvider({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
    DeezerProvider({
      clientId: env.DEEZER_CLIENT_ID,
      clientSecret: env.DEEZER_CLIENT_SECRET,
      authorization: {
        params: {
          perms: "basic_access,email,offline_access",
          scope: "basic_access,email,offline_access",
        },
      },
    }),
  ],
};
