import { type CreateNextContextOptions } from "@trpc/server/adapters/next";
import { type Session } from "next-auth";

import { getServerAuthSession } from "../auth";
import { prisma } from "../db";
import { spotify } from "../spotify";

type ExtraSession = Session & {
  spotifyUserId?: string;
};

type CreateContextOptions = {
  session: ExtraSession | null;
};

const createInnerTRPCContext = (opts: CreateContextOptions) => {
  return {
    session: opts.session,
    prisma,
    spotify,
  };
};

export const createTRPCContext = async (opts: CreateNextContextOptions) => {
  const { req, res } = opts;

  // Get the session from the server using the unstable_getServerSession wrapper function
  const session = await getServerAuthSession({ req, res });

  return createInnerTRPCContext({
    session,
  });
};

import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { Account, Role } from "@prisma/client";
import { z } from "zod";
import { env } from "env/server.mjs";

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape }) {
    return shape;
  },
});

export const createTRPCRouter = t.router;

export const publicProcedure = t.procedure;

const enforceUserIsAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.session || !ctx.session.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      // infers the `session` as non-nullable
      session: { ...ctx.session, user: ctx.session.user },
    },
  });
});

export const protectedProcedure = t.procedure.use(enforceUserIsAuthed);

const enforceUserIsAdmin = t.middleware(async ({ ctx, next }) => {
  if (!ctx.session || !ctx.session.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  const user = await ctx.prisma.user.findUniqueOrThrow({
    where: {
      id: ctx.session.user.id,
    },
    select: {
      role: true,
    },
  });

  if (user.role !== Role.ADMIN) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  return next({
    ctx: {
      // infers the `session` as non-nullable
      session: { ...ctx.session, user: ctx.session.user },
    },
  });
});

export const protectedAdminProcedure =
  protectedProcedure.use(enforceUserIsAdmin);

export const enfonceSpotifyUserAuthed = t.middleware(async ({ ctx, next }) => {
  if (!ctx.session || !ctx.session.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  const { accounts } = await ctx.prisma.user.findUniqueOrThrow({
    where: {
      id: ctx.session.user.id,
    },
    select: {
      accounts: true,
    },
  });

  const spotifyAccount = accounts.filter(
    (account) => account.provider === "spotify"
  )[0] as Account;

  const expire_at = spotifyAccount?.expires_at;
  const accessToken = spotifyAccount?.access_token;
  const refreshToken = spotifyAccount?.refresh_token;
  const spotifyUserId = spotifyAccount?.providerAccountId;

  if (
    !spotifyAccount ||
    !accessToken ||
    !spotifyUserId ||
    !refreshToken ||
    !expire_at
  ) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  ctx.spotify.setAccessToken(accessToken);
  ctx.spotify.setRefreshToken(refreshToken);

  if (Math.floor(Date.now() / 1000) >= expire_at) {
    ctx.spotify.setAccessToken(refreshToken);
    const {
      body: { access_token, refresh_token, expires_in },
    } = await ctx.spotify.refreshAccessToken();
    await ctx.prisma.account.update({
      where: {
        id: spotifyAccount.id,
      },
      data: {
        access_token: access_token,
        refresh_token: refresh_token,
        expires_at: Math.floor(Date.now() / 1000) + expires_in,
      },
    });
  }

  return next({
    ctx: {
      session: {
        ...ctx.session,
        user: ctx.session.user,
        spotifyUserId: spotifyUserId,
      },
    },
  });
});

export const spotifyProcedure = protectedProcedure.use(
  enfonceSpotifyUserAuthed
);
