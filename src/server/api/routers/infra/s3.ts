import { noop } from "@lib/helpers/noop";
import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import { createTRPCRouter, protectedProcedure } from "server/api/trpc";
import { z } from "zod";

const s3prefix = ["playlist", "user"] as const;
export type S3Prefix = (typeof s3prefix)[number];
const seperator = ":::";
export const s3Router = createTRPCRouter({
  presigned: protectedProcedure
    .input(
      z.object({
        expires: z.number().max(600).default(60),
        maxSize: z.number().max(200).default(10),
        prefix: z.enum(s3prefix),
      })
    )
    .mutation(({ ctx, input }) => {
      const key = [input.prefix, nanoid()].join(seperator);
      const post = ctx.s3.createPresignedPost({
        Bucket: process.env.AWS_S3_BUCKET_NAME!,
        Fields: {
          key: key,
        },
        Expires: input.expires,
        Conditions: [["content-length-range", 0, 5048576 * input.maxSize]],
      });

      return { key, post };
    }),
  delete: protectedProcedure
    .input(
      z.object({
        key: z.string(),
        prefix: z.enum(s3prefix),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [_prefix, _] = input.key.split(seperator) as [
        S3Prefix | undefined,
        string | undefined
      ];
      if (!_ || !_prefix || !s3prefix.includes(_prefix)) {
        throw new TRPCError({ code: "PRECONDITION_FAILED" });
      }

      if (_prefix === "playlist") {
        const playlist = await ctx.prisma.playlist.findFirst({
          where: {
            user: {
              every: {
                id: ctx.session.user.id,
              },
            },
            s3key: input.key,
          },
        });
        if (!playlist) throw new TRPCError({ code: "PRECONDITION_FAILED" });
      } else if (_prefix === "user") {
        const user = await ctx.prisma.user.findFirst({
          where: {
            id: ctx.session.user.id,
            s3key: input.key,
          },
        });

        if (!user) throw new TRPCError({ code: "PRECONDITION_FAILED" });
      }

      ctx.s3.deleteObject(
        {
          Bucket: process.env.AWS_S3_BUCKET_NAME!,
          Key: input.key,
        },
        noop
      );
    }),
});
