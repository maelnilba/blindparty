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
              create: {
                user: {
                  connect: {
                    id: ctx.session.user.id,
                  },
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
              deleteMany: {
                userId: ctx.session.user.id,
                partyId: input.prpc.channel_id,
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
  over: prpc.game.trigger(async ({ ctx, input }) => {
    await ctx.prisma.party.updateMany({
      where: {
        id: input.prpc.channel_id,
        host: {
          id: ctx.session.user.id,
        },
      },
      data: {
        view: "NONE",
        status: "ENDED",
        endedAt: new Date(),
      },
    });
  }),
  next: prpc.game.trigger(async ({ ctx, input }) => {
    const track = await ctx.prisma.party.findFirst({
      where: {
        id: input.prpc.channel_id,
        host: {
          id: ctx.session.user.id,
        },
      },
      select: {
        track: {
          select: {
            id: true,
            album: {
              select: {
                name: true,
              },
            },
            artists: {
              select: {
                name: true,
              },
            },
            name: true,
          },
        },
      },
    });

    if (!track || !track.track) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    }

    const trackname = [
      track.track.name,
      track.track.artists[0]?.name,
      track.track.album.name,
    ]
      .filter((v) => Boolean(v))
      .join(" - ");

    await ctx.prisma.party.updateMany({
      where: {
        id: input.prpc.channel_id,
        host: {
          id: ctx.session.user.id,
        },
      },
      data: {
        view: "SCORE",
      },
    });

    return ctx.pusher.trigger({ track: track.track, name: trackname });
  }),
  round: prpc.game
    .use(enfonceSpotifyUserAuthed)
    .data(
      z.object({
        tracks: z.array(z.string()),
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
        ctx.pusher.trigger({}, "over");
        throw new TRPCError({ code: "CONFLICT" });
      }

      const tracks = party.playlist.tracks.filter(
        (t) => !input.tracks.includes(t.id)
      );

      let track = tracks[Math.floor(Math.random() * tracks.length)];

      if (!track) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }

      await ctx.prisma.party.update({
        where: {
          id: input.prpc.channel_id,
        },
        data: {
          view: "GUESS",
          round: {
            increment: 1,
          },
          track: {
            connect: {
              id: track.id,
            },
          },
        },
      });

      return ctx.pusher.trigger({ track: track });
    }),
  guess: prpc.game
    .data(z.object({ guess: z.string() }))
    .trigger(async ({ ctx, input }) => {
      const party = await ctx.prisma.party.findUnique({
        where: {
          id: input.prpc.channel_id,
        },
        select: {
          status: true,
          view: true,
          track: {
            select: {
              album: {
                select: {
                  name: true,
                },
              },
              artists: {
                select: {
                  name: true,
                },
              },
              name: true,
            },
          },
        },
      });

      if (!party || !party.track) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
      if (party.status !== "RUNNING" || party.view !== "GUESS") {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }

      const trackname = [
        party.track.name,
        party.track.artists[0]?.name,
        party.track.album.name,
      ]
        .filter((v) => Boolean(v))
        .join(" - ");

      const album = party.track.album.name.toLocaleLowerCase();
      const artists = party.track.artists.map((a) =>
        a.name.toLocaleLowerCase()
      );
      const name = party.track.name.toLocaleLowerCase();

      const toGuessA = [
        ...album.split(" ").map((a) => ({
          score: 1.5,
          name: a.toLocaleLowerCase(),
          total: album.split(" ").length,
        })),
        ...artists.flat().map((a) => ({
          score: 2,
          name: a.toLocaleLowerCase(),
          total: artists.flat().length,
        })),
        ...name.split(" ").map((a) => ({
          score: 4,
          name: a.toLocaleLowerCase(),
          total: name.split(" ").length,
        })),
      ];

      const RATIO = 20;
      const SCORE_WIN = 5;
      const length = (str1: string, str2: string) =>
        (Math.abs(str1.length - str2.length) /
          ((str1.length + str2.length) / 2)) *
        100;

      let score = 0;
      toGuessA.forEach((toGuess) => {
        input.guess.split(" ").forEach((word) => {
          if (toGuess.name.includes(word) && toGuess.name.length > 2) {
            score +=
              toGuess.score /
              (length(word, toGuess.name) / RATIO || 1) /
              (toGuess.total || 1);
          }
        });
      });

      if (
        true ||
        input.guess === name ||
        input.guess === album ||
        artists.includes(input.guess) ||
        score >= SCORE_WIN
      ) {
        await ctx.prisma.party.update({
          where: {
            id: input.prpc.channel_id,
          },
          data: {
            view: "SCORE",
            players: {
              updateMany: {
                where: {
                  userId: ctx.session.user.id,
                },
                data: {
                  points: {
                    increment: 1,
                  },
                },
              },
            },
          },
        });

        const points = await ctx.prisma.party.findUnique({
          where: {
            id: input.prpc.channel_id,
          },
          select: {
            players: {
              select: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    image: true,
                  },
                },
                points: true,
              },
            },
          },
        });

        if (!points) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        }

        return ctx.pusher.trigger({
          players: points.players,
          name: trackname,
        });
      }
    }),
});
