import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { noop } from "helpers/noop";
import { SEPARATOR } from "../root";

export const pictureLink = (key: string | undefined) =>
  key
    ? `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`
    : undefined;

const trackSchema = z.array(
  z.object({
    id: z.string(),
    name: z.string(),
    preview_url: z.string().url().nullable(),
    album: z.object({
      name: z.string(),
      images: z.array(
        z.object({
          url: z.string().url(),
        })
      ),
    }),
    artists: z.array(
      z.object({
        name: z.string(),
      })
    ),
  })
);

const mapped = (
  tracks: {
    id: string;
    name: string;
    preview_url: string | null;
    album: string;
    images: string;
    artists: string;
  }[]
) =>
  tracks.map(({ images, ...track }) => ({
    ...track,
    album: {
      name: track.album,
      images: images.split(SEPARATOR.PRISMA).map((image) => ({
        url: image,
      })),
    },
    artists: track.artists
      .split(SEPARATOR.PRISMA)
      .map((artist) => ({ name: artist })),
  }));

export const playlistRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        description: z.string().optional(),
        s3key: z.string().optional(),
        generated: z.boolean(),
        tracks: trackSchema.min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const picture = pictureLink(input.s3key);

      return await ctx.prisma.playlist.create({
        data: {
          user: {
            connect: {
              id: ctx.session.user.id,
            },
          },
          name: input.name,
          description: input.description,
          picture: picture,
          s3key: input.s3key,
          generated: input.generated,
          public: false,
          tracks: {
            connectOrCreate: input.tracks.map((track) => ({
              where: {
                id: track.id,
              },
              create: {
                id: track.id,
                name: track.name,
                preview_url: track.preview_url ?? undefined,
                album: track.album.name,
                artists: track.artists
                  .map((artist) => artist.name)
                  .join(SEPARATOR.PRISMA),
                images: track.album.images
                  .map((image) => image.url)
                  .join(SEPARATOR.PRISMA),
              },
            })),
          },
        },
      });
    }),
  edit: protectedProcedure
    .input(
      z.object({
        id: z.string().cuid(),
        name: z.string(),
        description: z.string().optional(),
        s3key: z.string().optional(),
        generated: z.boolean(),
        tracks: trackSchema,
        removed_tracks: z.array(z.string()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const picture = pictureLink(input.s3key);

      return await ctx.prisma.$transaction(async (prisma) => {
        const playlist = await prisma.playlist.findFirstOrThrow({
          where: {
            id: input.id,
            user: {
              some: {
                id: ctx.session.user.id,
              },
            },
          },
        });

        return await prisma.playlist.update({
          where: {
            id: playlist.id,
          },
          data: {
            name: input.name,
            description: input.description,
            picture: picture,
            s3key: input.s3key,
            generated: input.generated,
            tracks: {
              disconnect: input.removed_tracks.map((track_id) => ({
                id: track_id,
              })),
              connectOrCreate: input.tracks.map((track) => ({
                where: {
                  id: track.id,
                },
                create: {
                  id: track.id,
                  name: track.name,
                  preview_url: track.preview_url ?? undefined,
                  album: track.album.name,
                  artists: track.artists
                    .map((artist) => artist.name)
                    .join(SEPARATOR.PRISMA),
                  images: track.album.images
                    .map((image) => image.url)
                    .join(SEPARATOR.PRISMA),
                },
              })),
            },
          },
        });
      });
    }),
  create_empty: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        description: z.string().optional(),
        s3key: z.string().optional(),
        generated: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const picture = pictureLink(input.s3key);

      return await ctx.prisma.playlist.create({
        data: {
          user: {
            connect: {
              id: ctx.session.user.id,
            },
          },
          name: input.name,
          description: input.description,
          picture: picture,
          s3key: input.s3key,
          generated: input.generated,
          public: false,
        },
      });
    }),
  edit_empty: protectedProcedure
    .input(
      z.object({
        id: z.string().cuid(),
        name: z.string(),
        description: z.string().optional(),
        s3key: z.string().optional(),
        generated: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const picture = pictureLink(input.s3key);

      const playlist = await ctx.prisma.playlist.findFirstOrThrow({
        where: {
          id: input.id,
          user: {
            some: {
              id: ctx.session.user.id,
            },
          },
        },
      });

      return await ctx.prisma.playlist.update({
        where: {
          id: playlist.id,
        },
        data: {
          name: input.name,
          description: input.description,
          picture: picture,
          s3key: input.s3key,
          generated: input.generated,
        },
      });
    }),
  remove_tracks: protectedProcedure
    .input(
      z.object({
        id: z.string().cuid(),
        removed_tracks: z.array(z.string()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const playlist = await ctx.prisma.playlist.findFirstOrThrow({
        where: {
          id: input.id,
          user: {
            some: {
              id: ctx.session.user.id,
            },
          },
        },
      });

      await ctx.prisma.playlist.update({
        where: {
          id: playlist.id,
        },
        data: {
          tracks: {
            disconnect: input.removed_tracks.map((track_id) => ({
              id: track_id,
            })),
          },
        },
      });

      return true;
    }),
  insert_tracks: protectedProcedure
    .input(
      z.object({
        id: z.string().cuid(),
        tracks: trackSchema.min(1).max(20),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const playlist = await ctx.prisma.playlist.findFirstOrThrow({
        where: {
          id: input.id,
          user: {
            some: {
              id: ctx.session.user.id,
            },
          },
        },
      });

      await ctx.prisma.playlist.update({
        where: {
          id: playlist.id,
        },
        data: {
          tracks: {
            connectOrCreate: input.tracks.map((track) => ({
              where: {
                id: track.id,
              },
              create: {
                id: track.id,
                name: track.name,
                preview_url: track.preview_url ?? undefined,
                album: track.album.name,
                artists: track.artists
                  .map((artist) => artist.name)
                  .join(SEPARATOR.PRISMA),
                images: track.album.images
                  .map((image) => image.url)
                  .join(SEPARATOR.PRISMA),
              },
            })),
          },
        },
      });
      return true;
    }),
  delete: protectedProcedure
    .input(
      z.object({
        id: z.string().cuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const playlist = await ctx.prisma.playlist.findFirstOrThrow({
        where: {
          id: input.id,
          user: {
            some: {
              id: ctx.session.user.id,
            },
          },
        },
      });

      if (playlist.s3key)
        ctx.s3.deleteObject(
          {
            Bucket: process.env.AWS_S3_BUCKET_NAME!,
            Key: playlist.s3key,
          },
          noop
        );

      return ctx.prisma.playlist.delete({ where: { id: playlist.id } });
    }),
  disconnect: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.playlist.update({
        where: {
          id: input.id,
        },
        data: {
          user: {
            disconnect: {
              id: ctx.session.user.id,
            },
          },
        },
      });
    }),
  get_all: protectedProcedure
    .input(
      z
        .object({
          take: z.number().min(1),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      return (
        await ctx.prisma.playlist.findMany({
          where: {
            user: {
              some: {
                id: ctx.session.user.id,
              },
            },
          },
          take: input?.take,
          orderBy: {
            createdAt: "desc",
          },
          include: {
            _count: true,
            tracks: {
              take: 10,
              select: {
                id: true,
                preview_url: true,
                name: true,
                album: true,
                artists: true,
                images: true,
              },
            },
          },
        })
      ).map((playlist) => ({
        ...playlist,
        tracks: mapped(playlist.tracks),
      }));
    }),
  get_playlist: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const playlist = await ctx.prisma.playlist.findFirst({
        where: {
          id: input.id,
          user: {
            some: {
              id: ctx.session.user.id,
            },
          },
        },
        include: {
          tracks: {
            select: {
              id: true,
              name: true,
              preview_url: true,
              album: true,
              artists: true,
              images: true,
            },
          },
        },
      });

      if (!playlist) throw new TRPCError({ code: "NOT_FOUND" });

      return {
        ...playlist,
        tracks: mapped(playlist.tracks),
      };
    }),

  get_public: protectedProcedure
    .input(z.object({ field: z.string() }).optional())
    .mutation(async ({ ctx, input }) => {
      return input?.field
        ? (
            await ctx.prisma.playlist.findMany({
              where: {
                public: true,
                AND: [
                  {
                    NOT: {
                      user: {
                        some: {
                          id: ctx.session.user.id,
                        },
                      },
                    },
                  },
                  {
                    OR: [
                      {
                        name: {
                          contains: input?.field,
                        },
                      },
                      {
                        tracks: {
                          some: {
                            name: {
                              contains: input?.field,
                            },
                          },
                        },
                      },
                    ],
                  },
                ],
              },
              orderBy: {
                updatedAt: "desc",
              },
              include: {
                _count: true,
                tracks: {
                  take: 10,
                  select: {
                    id: true,
                    name: true,
                    preview_url: true,
                    album: true,
                    images: true,
                    artists: true,
                  },
                },
              },
            })
          ).map((playlist) => ({
            ...playlist,
            tracks: mapped(playlist.tracks),
          }))
        : (
            await ctx.prisma.playlist.findMany({
              where: {
                public: true,
                AND: {
                  NOT: {
                    user: {
                      some: {
                        id: ctx.session.user.id,
                      },
                    },
                  },
                },
              },
              take: 10,
              orderBy: {
                updatedAt: "desc",
              },
              include: {
                _count: true,
                tracks: {
                  take: 10,
                  select: {
                    id: true,
                    name: true,
                    preview_url: true,
                    album: true,
                    images: true,
                    artists: true,
                  },
                },
              },
            })
          ).map((playlist) => ({
            ...playlist,
            tracks: mapped(playlist.tracks),
          }));
    }),
  connect_playlist: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.playlist.update({
        where: {
          id: input.id,
        },
        data: {
          user: {
            connect: {
              id: ctx.session.user.id,
            },
          },
        },
      });
    }),
  discover: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const playlist = await ctx.prisma.playlist.findFirst({
        where: {
          AND: [
            {
              id: input.id,
            },
            {
              OR: [
                {
                  user: {
                    some: {
                      id: ctx.session.user.id,
                    },
                  },
                  public: false,
                },
                {
                  public: true,
                },
              ],
            },
          ],
        },
        include: {
          _count: {
            select: {
              user: true,
            },
          },
          tracks: {
            select: {
              id: true,
              name: true,
              preview_url: true,
              album: true,
              images: true,
              artists: true,
            },
          },
        },
      });

      if (!playlist) throw new TRPCError({ code: "NOT_FOUND" });

      return {
        ...playlist,
        tracks: mapped(playlist.tracks),
      };
    }),
});
