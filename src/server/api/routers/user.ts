import { pictureLink } from "@server/s3";
import { Socials } from "@server/types";
import { z } from "zod";
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
  me: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.user.findUnique({
      where: {
        id: ctx.session.user.id,
      },
      select: {
        name: true,
        image: true,
        s3key: true,
      },
    });
  }),
  edit: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        s3key: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const picture = pictureLink(input.s3key);

      return ctx.prisma.user.update({
        where: {
          id: ctx.session.user.id,
        },
        data: {
          name: input.name,
          s3key: input.s3key,
          image: picture,
        },
      });
    }),
});
