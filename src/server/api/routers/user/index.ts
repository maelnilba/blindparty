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
  accounts: protectedProcedure.query(async ({ ctx }) => {
    const { accounts, platform } = await ctx.prisma.user.findUniqueOrThrow({
      where: {
        id: ctx.session.user.id,
      },
      select: {
        email: true,
        platform: true,
        accounts: true,
      },
    });

    return {
      providers: accounts.map((account) => account.provider as Socials),
      platform: (platform ?? accounts.at(0)?.provider) as Socials,
    };
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
        s3Key: true,
      },
    });
  }),
  edit: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        s3Key: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const picture = pictureLink(input.s3Key);

      return await ctx.prisma.user.update({
        where: {
          id: ctx.session.user.id,
        },
        data: {
          name: input.name,
          s3Key: input.s3Key,
          image: picture,
        },
      });
    }),
});
