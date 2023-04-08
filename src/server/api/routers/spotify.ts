import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { type Account } from "@prisma/client";

export const spotifyRouter = createTRPCRouter({
  token: protectedProcedure.query(async ({ ctx }) => {
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
      return {
        accessToken: access_token,
      };
    } else {
      return {
        accessToken,
      };
    }
  }),
  renew: protectedProcedure.mutation(async ({ ctx }) => {
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

      return { accessToken: access_token };
    } else {
      return { accessToken: accessToken };
    }
  }),
});
