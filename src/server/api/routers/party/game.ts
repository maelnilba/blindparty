import { TRPCError } from "@trpc/server";
import { prpc } from "server/api/prpc";
import { createTRPCRouter, enfonceSpotifyUserAuthed } from "server/api/trpc";
import { z } from "zod";

export const gameRouter = createTRPCRouter({
  join: prpc.game
    .data(
      z.object({
        joined: z.boolean(),
      })
    )
    .trigger(async ({ ctx, input }) => {
      if (input.joined) {
        await ctx.prisma.party.update({
          where: {
            id: input.prpc.channel_id,
          },
          data: {
            players: {
              connectOrCreate: {
                create: {
                  user: {
                    connect: {
                      id: ctx.session.user.id,
                    },
                  },
                },
                where: {
                  userId: ctx.session.user.id,
                },
              },
            },
          },
        });
      } else {
        await ctx.prisma.party.update({
          where: {
            id: input.prpc.channel_id,
          },
          data: {
            players: {
              delete: {
                id: ctx.session.user.id,
              },
            },
          },
        });
      }
      return ctx.pusher.trigger({ joined: input.joined, user: input.prpc.me });
    }),
  start: prpc.game.trigger(async ({ ctx, input }) => {
    const party = await ctx.prisma.party.updateMany({
      where: {
        id: input.prpc.channel_id,
        host: {
          id: ctx.session.user.id,
        },
      },
      data: {
        status: "RUNNING",
      },
    });

    return ctx.pusher.trigger({ running: !!party });
  }),
  round: prpc.game
    .use(enfonceSpotifyUserAuthed)
    .data(
      z.object({
        tracks: z.array(z.string().cuid()),
      })
    )
    .trigger(async ({ ctx, input }) => {
      const party = await ctx.prisma.party.findFirst({
        where: {
          id: input.prpc.channel_id,
          host: {
            id: ctx.session.user.id,
          },
        },
        select: {
          max_round: true,
          round: true,
          playlist: {
            select: {
              tracks: {
                select: {
                  album: {
                    select: {
                      images: {
                        select: {
                          url: true,
                          width: true,
                          height: true,
                        },
                      },
                    },
                  },
                  preview_url: true,
                  id: true,
                },
              },
            },
          },
        },
      });

      if (!party) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      if (party.round + 1 > party.max_round) {
        return ctx.pusher.trigger({ track: null, embed: false });
      }

      const tracks = party.playlist.tracks.filter(
        (t) => !input.tracks.includes(t.id)
      );

      let track = tracks[Math.floor(Math.random() * tracks.length)];

      if (!track) {
        // Means it's over?
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }

      let embed = false;
      if (!track.preview_url) {
        embed = true;
        track = {
          ...track,
          preview_url: "https://open.spotify.com/embed/track/" + track.id,
        };
      }

      await ctx.prisma.party.update({
        where: {
          id: input.prpc.channel_id,
        },
        data: {
          round: {
            increment: 1,
          },
        },
      });

      return ctx.pusher.trigger({ track: track, embed });
    }),
});
