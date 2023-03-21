import { pictureLink } from "@server/s3";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const playlistRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        description: z.string().optional(),
        s3key: z.string().optional(),
        tracks: z
          .array(
            z.object({
              id: z.string(),
              name: z.string(),
              preview_url: z.string().url().nullable(),
              album: z.object({
                id: z.string(),
                name: z.string(),
                images: z.array(
                  z.object({
                    url: z.string().url(),
                    width: z.number().positive(),
                    height: z.number().positive(),
                  })
                ),
              }),
              artists: z.array(
                z.object({
                  id: z.string(),
                  name: z.string(),
                })
              ),
            })
          )
          .min(1),
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
                album: {
                  connectOrCreate: {
                    where: {
                      id: track.album.id,
                    },
                    create: {
                      id: track.album.id,
                      name: track.album.name,
                      images: {
                        connectOrCreate: track.album.images.map((image) => ({
                          create: {
                            url: image.url,
                            width: image.width,
                            height: image.height,
                          },
                          where: {
                            url: image.url,
                          },
                        })),
                      },
                    },
                  },
                },
                artists: {
                  connectOrCreate:
                    track.artists.map((artist) => ({
                      create: {
                        id: artist.id,
                        name: artist.name,
                      },
                      where: {
                        id: artist.id,
                      },
                    })) ?? [],
                },
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
        tracks: z
          .array(
            z.object({
              id: z.string(),
              name: z.string(),
              preview_url: z.string().url().nullable(),
              album: z.object({
                id: z.string(),
                name: z.string(),
                images: z.array(
                  z.object({
                    url: z.string().url(),
                    width: z.number().positive(),
                    height: z.number().positive(),
                  })
                ),
              }),
              artists: z.array(
                z.object({
                  id: z.string(),
                  name: z.string(),
                })
              ),
            })
          )
          .min(1),
        removed_tracks: z.array(z.string()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const picture = pictureLink(input.s3key);

      return await ctx.prisma.playlist.update({
        where: {
          id: input.id,
        },
        data: {
          name: input.name,
          description: input.description,
          picture: picture,
          s3key: input.s3key,
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
                album: {
                  connectOrCreate: {
                    where: {
                      id: track.album.id,
                    },
                    create: {
                      id: track.album.id,
                      name: track.album.name,
                      images: {
                        connectOrCreate: track.album.images.map((image) => ({
                          create: {
                            url: image.url,
                            width: image.width,
                            height: image.height,
                          },
                          where: {
                            url: image.url,
                          },
                        })),
                      },
                    },
                  },
                },
                artists: {
                  connectOrCreate:
                    track.artists.map((artist) => ({
                      create: {
                        id: artist.id,
                        name: artist.name,
                      },
                      where: {
                        id: artist.id,
                      },
                    })) ?? [],
                },
              },
            })),
          },
        },
      });
    }),
  delete: protectedProcedure
    .input(
      z.object({
        id: z.string().cuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.playlist.deleteMany({
        where: {
          id: input.id,
          user: {
            some: {
              id: ctx.session.user.id,
            },
          },
        },
      });
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
  get_all: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.playlist.findMany({
      where: {
        user: {
          some: {
            id: ctx.session.user.id,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        _count: true,
        tracks: {
          take: 10,
          include: {
            album: {
              include: {
                images: true,
              },
            },
            artists: true,
          },
        },
      },
    });
  }),
  get_playlist: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.playlist.findFirst({
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
            include: {
              album: {
                include: {
                  images: true,
                },
              },
              artists: true,
            },
          },
        },
      });
    }),
  get_public: protectedProcedure
    .input(z.object({ field: z.string() }).optional())
    .mutation(async ({ ctx, input }) => {
      return input?.field
        ? ctx.prisma.playlist.findMany({
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
                            mode: "insensitive",
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
                include: {
                  album: {
                    include: {
                      images: true,
                    },
                  },
                  artists: true,
                },
              },
            },
          })
        : ctx.prisma.playlist.findMany({
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
                include: {
                  album: {
                    include: {
                      images: true,
                    },
                  },
                  artists: true,
                },
              },
            },
          });
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
              Party: true,
            },
          },
          tracks: {
            include: {
              album: {
                include: {
                  images: true,
                },
              },
              artists: true,
            },
          },
        },
      });

      if (!playlist) {
        throw new TRPCError({ code: "PRECONDITION_FAILED" });
      }

      return playlist;
    }),
});
