import { protectedAdminProcedure } from "@server/api/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter } from "../../trpc";

export const pictureLink = (key: string | undefined) =>
  key
    ? `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`
    : undefined;

export const playlistRouter = createTRPCRouter({
  create: protectedAdminProcedure
    .input(
      z.object({
        name: z.string(),
        description: z.string().optional(),
        s3key: z.string().optional(),
        generated: z.boolean(),
        tracks: z
          .array(
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
          )
          .min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const picture = pictureLink(input.s3key);

      return await ctx.prisma.playlist.create({
        data: {
          name: input.name,
          description: input.description,
          picture: picture,
          s3key: input.s3key,
          generated: input.generated,
          public: true,
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
                artists: track.artists.map((artist) => artist.name).join("|"),
                images: track.album.images.map((image) => image.url).join("|"),
              },
            })),
          },
        },
      });
    }),
  edit: protectedAdminProcedure
    .input(
      z.object({
        id: z.string().cuid(),
        name: z.string(),
        description: z.string().optional(),
        s3key: z.string().optional(),
        generated: z.boolean(),
        tracks: z.array(
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
        ),
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
                artists: track.artists.map((artist) => artist.name).join("|"),
                images: track.album.images.map((image) => image.url).join("|"),
              },
            })),
          },
        },
      });
    }),
  delete: protectedAdminProcedure
    .input(
      z.object({
        id: z.string().cuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.playlist.deleteMany({
        where: {
          id: input.id,
          public: true,
        },
      });
    }),
  get_all: protectedAdminProcedure.query(async ({ ctx }) => {
    return (
      await ctx.prisma.playlist.findMany({
        where: {
          public: true,
        },
        orderBy: {
          createdAt: "desc",
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
      tracks: playlist.tracks.map(({ images, ...track }) => ({
        ...track,
        album: {
          name: track.album,
          images: images.split("|").map((image) => ({
            url: image,
          })),
        },
        artists: track.artists.split("|").map((artist) => ({ name: artist })),
      })),
    }));
  }),
  get_playlist: protectedAdminProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const playlist = await ctx.prisma.playlist.findFirst({
        where: {
          id: input.id,
          public: true,
        },
        include: {
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
        tracks: playlist?.tracks.map(({ images, ...track }) => ({
          ...track,
          album: {
            name: track.album,
            images: images.split("|").map((image) => ({
              url: image,
            })),
          },
          artists: track.artists.split("|").map((artist) => ({ name: artist })),
        })),
      };
    }),
});
