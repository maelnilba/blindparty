import { type Account as PrismaAccount } from "@prisma/client";
import { createTRPCRouter, protectedProcedure } from "../../trpc";
import { TRPCError } from "@trpc/server";

const providers = ["spotify", "deezer"] as const;
export type Provider = (typeof providers)[number];

type Account = PrismaAccount & {
  provider: Provider;
};

export const tokensRouter = createTRPCRouter({
  token: protectedProcedure.query(async ({ ctx }) => {
    const { accounts: allAccounts, platform } =
      await ctx.prisma.user.findUniqueOrThrow({
        where: {
          id: ctx.session.user.id,
        },
        select: {
          accounts: true,
          platform: true,
        },
      });

    const accounts = allAccounts.filter((account) =>
      providers.includes(account.provider as Provider)
    );

    const account =
      platform && accounts.map((p) => p.provider).includes(platform as Provider)
        ? accounts.find((p) => p.provider === platform)
        : accounts.at(0);

    const expire_at = account?.expires_at;
    const accessToken = account?.access_token;
    const refreshToken = account?.refresh_token;
    const providerUserId = account?.providerAccountId;

    if (!account || !providerUserId || !accessToken || !expire_at) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    const tokenExpired = Math.floor(Date.now() / 1000) >= expire_at;

    if (account.provider === "spotify" && refreshToken) {
      ctx.spotify.setAccessToken(accessToken);
      ctx.spotify.setRefreshToken(refreshToken);

      if (tokenExpired) {
        ctx.spotify.setAccessToken(refreshToken);
        const {
          body: { access_token, refresh_token, expires_in },
        } = await ctx.spotify.refreshAccessToken();
        await ctx.prisma.account.update({
          where: {
            id: account.id,
          },
          data: {
            access_token: access_token,
            refresh_token: refresh_token,
            expires_at: Math.floor(Date.now() / 1000) + expires_in,
          },
        });
        return {
          provider: account.provider,
          accessToken: access_token,
        };
      }
    }

    if (account.provider === "deezer") {
      if (tokenExpired) {
        return {
          provider: account.provider,
          accessToken,
        };
        // throw new Error("Need to implement get new access token.");
      }
    }

    return {
      provider: account.provider,
      accessToken,
    };
  }),
  renew: protectedProcedure.mutation(async ({ ctx }) => {
    const { accounts: allAccounts, platform } =
      await ctx.prisma.user.findUniqueOrThrow({
        where: {
          id: ctx.session.user.id,
        },
        select: {
          accounts: true,
          platform: true,
        },
      });

    const accounts = allAccounts.filter((account) =>
      providers.includes(account.provider as Provider)
    );

    const account =
      platform && accounts.map((p) => p.provider).includes(platform as Provider)
        ? accounts.find((p) => p.provider === platform)
        : accounts.at(0);

    const expire_at = account?.expires_at;
    const accessToken = account?.access_token;
    const refreshToken = account?.refresh_token;
    const providerUserId = account?.providerAccountId;

    if (!account || !providerUserId || !accessToken || !expire_at) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    const tokenExpired = Math.floor(Date.now() / 1000) >= expire_at;

    if (account.provider === "spotify" && refreshToken) {
      ctx.spotify.setAccessToken(accessToken);
      ctx.spotify.setRefreshToken(refreshToken);

      if (tokenExpired) {
        ctx.spotify.setAccessToken(refreshToken);
        const {
          body: { access_token, refresh_token, expires_in },
        } = await ctx.spotify.refreshAccessToken();
        await ctx.prisma.account.update({
          where: {
            id: account.id,
          },
          data: {
            access_token: access_token,
            refresh_token: refresh_token,
            expires_at: Math.floor(Date.now() / 1000) + expires_in,
          },
        });
        return {
          provider: account.provider,
          accessToken: access_token,
        };
      }
    }

    if (account.provider === "deezer") {
      if (tokenExpired) {
        return {
          provider: account.provider,
          accessToken,
        };
        // throw new Error("Need to implement get new access token.");
      }
    }

    return {
      accessToken,
    };
  }),
});
