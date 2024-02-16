import { SEPARATOR } from "@server/api/root";
import { TRPCError } from "@trpc/server";
import stringSimilarity from "helpers/string-similarty";
import { prpc } from "server/api/prpc";
import { createTRPCRouter, enforceUserIsHost } from "server/api/trpc";
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
                partyId: input.prpc.members,
              },
            },
          },
        });
      }
      return await ctx.pusher.trigger({
        joined: input.joined,
        user: input.prpc.me,
      });
    }),
  "host-leave": prpc.game.trigger(async ({ ctx, input }) => {
    const leaved = Object.values(input.prpc.members).every(
      (m) => !(m as { isHost: boolean }).isHost
    );

    if (!leaved) throw new TRPCError({ code: "PRECONDITION_FAILED" });

    await ctx.prisma.party.updateMany({
      where: {
        id: input.prpc.channel_id,
        players: {
          some: {
            user: {
              id: ctx.session.user.id,
            },
          },
        },
      },
      data: {
        status: "CANCELED",
        endedAt: new Date().toISOString(),
      },
    });
    return ctx.pusher.trigger({});
  }),
  leave: prpc.game
    .data(
      z.object({
        id: z.string(),
      })
    )
    .trigger(async ({ ctx, input }) => {
      await ctx.prisma.party.update({
        where: {
          id: input.prpc.channel_id,
        },
        data: {
          players: {
            deleteMany: {
              userId: input.id,
              partyId: input.prpc.channel_id,
            },
          },
        },
      });

      return await ctx.pusher.trigger({ id: input.id });
    }),
  ban: prpc.game
    .use(enforceUserIsHost)
    .data(
      z.object({
        id: z.string(),
      })
    )
    .trigger(async ({ ctx, input }) => {
      const [id, user] = Object.entries<{ id: string }>(
        input.prpc.members
      ).find(([_, user]) => user.id === input.id) ?? [undefined, undefined];

      if (!user) throw new TRPCError({ code: "NOT_FOUND" });

      return ctx.pusher.trigger({ id: user.id });
    }),
  start: prpc.game.use(enforceUserIsHost).trigger(async ({ ctx, input }) => {
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

    return await ctx.pusher.trigger({ running: !!party });
  }),
  over: prpc.game.use(enforceUserIsHost).trigger(async ({ ctx, input }) => {
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
        endedAt: new Date().toISOString(),
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
            album: true,
            artists: true,
            name: true,
          },
        },
      },
    });

    if (!track || !track.track) throw new TRPCError({ code: "NOT_FOUND" });

    const trackname = [
      track.track.name,
      track.track.artists[0],
      track.track.album,
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

    return await ctx.pusher.trigger({ track: track.track, name: trackname });
  }),
  round: prpc.game
    .use(enforceUserIsHost)
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
          id: true,
          max_round: true,
          round: true,
          tracks: {
            select: {
              images: true,
              preview_url: true,
              id: true,
            },
          },
        },
      });

      if (!party) throw new TRPCError({ code: "UNAUTHORIZED" });

      if (party.round > party.max_round) {
        await ctx.prisma.party.update({
          where: { id: party.id },
          data: { status: "ENDED" },
        });

        await ctx.pusher.trigger({}, "over");
        throw new TRPCError({ code: "CONFLICT" });
      }

      const tracks = party.tracks.filter((t) => !input.tracks.includes(t.id));

      let track = tracks[Math.floor(Math.random() * tracks.length)];

      if (!track) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await ctx.prisma.party.update({
        where: {
          id: party.id,
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

      return await ctx.pusher.trigger({
        track: {
          ...track,
          images: track.images
            .split(SEPARATOR.PRISMA)
            .map((image) => ({ url: image })),
        },
      });
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
              album: true,
              images: true,
              artists: true,
              name: true,
            },
          },
        },
      });

      if (!party || !party.track)
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      if (party.status !== "RUNNING" || party.view !== "GUESS")
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // TODO: Take case of name like Music (feat. dude) / Music (with dude) / Music name - dude Remix
      const nameSimilarity = stringSimilarity(input.guess, party.track.name);
      const artistSimilarity = stringSimilarity(
        input.guess,
        party.track.artists[0]!
      );
      const albumSimilarity = stringSimilarity(input.guess, party.track.album);

      if (
        !(
          nameSimilarity >= 0.7 ||
          artistSimilarity >= 0.8 ||
          albumSimilarity >= 0.8
        )
      ) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

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

      const points = await ctx.prisma.party.findUniqueOrThrow({
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

      return await ctx.pusher.trigger({
        players: points.players,
        name: [party.track.name, party.track.artists[0], party.track.album]
          .filter((v) => Boolean(v))
          .join(" - "),
        winner: points.players.find((p) => p.user.id === ctx.session.user.id),
      });
    }),
  "force-stop": prpc.game.trigger(async ({ ctx }) => {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }),
});
