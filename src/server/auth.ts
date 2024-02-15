import { NextApiRequest, type GetServerSidePropsContext } from "next";
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
  return await getServerSession(
    ctx.req,
    ctx.res,
    authOptions(ctx.req, ctx.res)
  );
};

import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import DiscordProvider from "next-auth/providers/discord";
import GoogleProvider from "next-auth/providers/google";
import SpotifyProvider from "next-auth/providers/spotify";
import { DeezerProvider } from "./providers";

import { prisma } from "@server/db";
import { env } from "env/server.mjs";
import { nanoid } from "nanoid";
import { Adapter, AdapterSession, AdapterUser } from "next-auth/adapters";
import { decode, encode } from "next-auth/jwt";
import { v4 } from "uuid";

const adapter = {
  ...(PrismaAdapter(prisma) as Adapter),
  async getSessionAndUser(sessionToken: string) {
    const userAndSession = await prisma.session.findFirst({
      where: {
        sessionToken: sessionToken,
      },
      include: {
        user: true,
      },
    });
    if (!userAndSession) return null;
    const { user, ...session } = userAndSession;
    return { user: user, session: session } as {
      user: AdapterUser;
      session: AdapterSession;
    };
  },
};

export const authOptions: (
  req: GetServerSidePropsContext["req"],
  res: GetServerSidePropsContext["res"]
) => NextAuthOptions = (req, res) => ({
  debug: env.NODE_ENV !== "production",
  pages: {
    signIn: "/sign-in",
    newUser: "/dashboard",
    error: "/auth/error",
  },
  events: {
    async signIn({ user, account }) {
      if (account) {
        await prisma.user.update({
          where: {
            id: user.id,
          },
          data: {
            platform: account?.provider,
          },
        });
      }
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
    async signIn({ user }) {
      const request = req as NextApiRequest;
      if (
        request.query.nextauth?.includes("callback") &&
        request.query.nextauth?.includes("credentials") &&
        request.method === "POST"
      ) {
        if (user && "id" in user) {
          const session = await adapter.createSession!({
            sessionToken: v4(),
            userId: user.id,
            expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
          });

          res.setHeader(
            "Set-Cookie",
            `next-auth.session-token=${
              session.sessionToken
            };expires=${session.expires.toUTCString()};path=/`
          );
        }
      }
      return true;
    },
  },
  jwt: {
    encode(params) {
      const request = req as NextApiRequest;
      if (
        request.query.nextauth?.includes("callback") &&
        request.query.nextauth?.includes("credentials") &&
        request.method === "POST"
      ) {
        const cookie = request.cookies["next-auth.session-token"]!;
        if (cookie) return cookie;
        else return "";
      }
      return encode(params);
    },
    decode(params) {
      const request = req as NextApiRequest;
      if (
        request.query.nextauth?.includes("callback") &&
        request.query.nextauth?.includes("credentials") &&
        request.method === "POST"
      ) {
        return null;
      }
      return decode(params);
    },
  },
  adapter: adapter,
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
    CredentialsProvider({
      name: "anonymous",
      credentials: {},
      async authorize() {
        const name = ["Anon", nanoid(8)].join("");
        return await prisma.user.create({
          data: {
            email: `${name}@anon.blindparty.com`,
            name: name,
            image: "/api/og/avatar/" + Math.floor(Math.random() * 1024) + 1,
            role: "ANON",
          },
        });
      },
    }),
  ],
});
