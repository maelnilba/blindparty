import { Socials } from "@server/types";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const userRouter = createTRPCRouter({
  provider: protectedProcedure.query(async ({ ctx }) => {
    const { accounts } = await ctx.prisma.user.findUniqueOrThrow({
      where: {
        id: ctx.session.user.id,
      },
      select: {
        accounts: true,
      },
    });
    return accounts.map((account) => account.provider as Socials);
  }),
});
