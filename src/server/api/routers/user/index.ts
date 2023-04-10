import { Socials } from "@server/types";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../../trpc";
import { tokensRouter } from "./tokens";

export const pictureLink = (key: string | undefined) =>
  key
    ? `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`
    : undefined;

const providersCanTrackApi = ["spotify", "deezer"] as const;
export type ProvidersCanTrackApi = typeof providersCanTrackApi;

export const userRouter = createTRPCRouter({
  tokens: tokensRouter,
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
  can_track_api: protectedProcedure.query(async ({ ctx }) => {
    const accounts = await ctx.prisma.user.findUniqueOrThrow({
      where: {
        id: ctx.session.user.id,
      },
      select: {
        accounts: true,
      },
    });

    const providers = accounts.accounts.map(
      (account) => account.provider as Socials
    );

    return Boolean(
      providers.length &&
        providers.some((provider) =>
          // @ts-expect-error
          providersCanTrackApi.includes(provider)
        )
    );
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
