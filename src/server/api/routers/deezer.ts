import { TRPCError } from "@trpc/server";
import { type Account } from "next-auth";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const deezerRouter = createTRPCRouter({
  token: protectedProcedure.query(async ({ ctx }) => {
    const { accounts } = await ctx.prisma.user.findUniqueOrThrow({
      where: {
        id: ctx.session.user.id,
      },
      select: {
        accounts: true,
      },
    });

    const deezerAccount = accounts.filter(
      (account) => account.provider === "deezer"
    )[0] as Account;

    const expire_at = deezerAccount?.expires_at;
    const accessToken = deezerAccount?.access_token;
    const deezerUserId = deezerAccount?.providerAccountId;

    if (!deezerAccount || !accessToken || !deezerUserId || !expire_at) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    if (Math.floor(Date.now() / 1000) >= expire_at) {
      throw new Error("Need to implement refresh token.");
    } else {
      return { accessToken: accessToken };
    }
  }),
});
