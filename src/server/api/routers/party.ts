import { TRPCError } from "@trpc/server";
import { setChannelName } from "modules/prpc/shared/utils";
import { customAlphabet } from "nanoid";
import { z } from "zod";
import { pusherClient as pusher } from "../prpc";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { trackMapped } from "./admin/playlist";
import { gameRouter } from "./party/game";

const nanoid = customAlphabet("1234567890", 6);
const channelMembers = z.object({
  users: z.array(z.object({ id: z.string() })),
});

export const partyRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        playlists_id: z.array(z.string().cuid()).min(1),
        inviteds: z.array(z.string().cuid()),
        max_round: z.number().min(1),
        private: z.boolean().default(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.$transaction(async (prisma) => {
        const playlists = await prisma.playlist.findMany({
          where: {
            id: {
              in: input.playlists_id,
            },
          },
          include: {
            tracks: true,
          },
        });

        if (!playlists) throw new TRPCError({ code: "PRECONDITION_FAILED" });

        const tracks = playlists
          .map((p) => p.tracks)
          .flat()
          .map((t) => ({ id: t.id }))
          .filter(
            (value, index, self) =>
              index === self.findIndex((t) => t.id === value.id)
          );

        const party = await prisma.party.create({
          data: {
            tracks: {
              connect: tracks,
            },
            access_mode: input.private ? "PRIVATE" : "PUBLIC",
            max_round:
              input.max_round <= tracks.length
                ? input.max_round
                : tracks.length,
            host: {
              connect: {
                id: ctx.session.user.id,
              },
            },
            inviteds: {
              connect: [...input.inviteds, ctx.session.user.id].map(
                (userId) => ({
                  id: userId,
                })
              ),
            },
          },
          include: {
            link: true,
          },
        });

        const link = await prisma.partyLink.create({
          data: {
            party: {
              connect: {
                id: party.id,
              },
            },
            url: nanoid(),
          },
        });

        return { ...party, link: link };
      });
    }),
  get_all: protectedProcedure.query(async ({ ctx, input }) => {
    const partys = await ctx.prisma.party.findMany({
      where: {
        inviteds: {
          some: {
            id: ctx.session.user.id,
          },
        },
      },
      select: {
        id: true,
        updatedAt: true,
        createdAt: true,
        status: true,
        round: true,
        max_round: true,
        access_mode: true,
        host: {
          select: {
            id: true,
            name: true,
            image: true,
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
        inviteds: {
          select: { id: true, name: true, image: true },
        },
        players: {
          include: {
            user: true,
          },
        },
        _count: {
          select: {
            inviteds: true,
            tracks: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const channels = await Promise.all(
      partys.map((party) => {
        return pusher
          .get({
            path: `/channels/presence-game-${party.id}/users`,
          })
          .then((members) =>
            members
              .json()
              .then(channelMembers.parseAsync)
              .then((members) => ({
                count: Math.max(0, members.users.length - 1),
                party: party,
              }))
          );
      })
    );

    return partys.map((party) => ({
      ...party,
      members: {
        count: channels.find((c) => c.party.id === party.id)?.count,
      },
      tracks: trackMapped(party.tracks),
    }));
  }),
  get_all_invite: protectedProcedure
    .input(z.object({ take: z.number().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const partys = await ctx.prisma.party.findMany({
        where: {
          inviteds: {
            some: {
              id: ctx.session.user.id,
            },
          },
          status: "PENDING",
        },
        include: {
          host: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          _count: {
            select: {
              inviteds: true,
            },
          },
        },
        orderBy: {
          updatedAt: "desc",
        },
        take: input?.take,
      });

      const channels = await Promise.all(
        partys.map((party) => {
          return pusher
            .get({
              path: `/channels/presence-game-${party.id}/users`,
            })
            .then((members) =>
              members
                .json()
                .then(channelMembers.parseAsync)
                .then((members) => ({
                  count: Math.max(0, members.users.length - 1),
                  party: party,
                }))
            );
        })
      );

      return partys.map((party) => ({
        ...party,
        members: {
          count: channels.find((c) => c.party.id === party.id)?.count,
        },
      }));
    }),
  replay: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.$transaction(async (prisma) => {
        const copy = await prisma.party.findUniqueOrThrow({
          where: {
            id: input.id,
          },
          include: {
            tracks: true,
            inviteds: true,
          },
        });

        const party = await prisma.party.create({
          data: {
            tracks: {
              connect: copy.tracks.map((t) => ({ id: t.id })),
            },
            max_round: copy.max_round,
            host: {
              connect: {
                id: ctx.session.user.id,
              },
            },
            inviteds: {
              connect: copy.inviteds.map((i) => ({ id: i.id })),
            },
          },
          include: {
            link: true,
          },
        });

        const link = await prisma.partyLink.create({
          data: {
            party: {
              connect: {
                id: party.id,
              },
            },
            url: nanoid(),
          },
        });

        return { id: party.id };
      });
    }),
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      await ctx.prisma.party.deleteMany({
        where: {
          id: input.id,
          host: { id: ctx.session.user.id },
          status: {
            in: ["PENDING", "CANCELED"],
          },
        },
      });

      await pusher.trigger(
        setChannelName("presence", "game", input.id),
        "force-stop",
        {}
      );
    }),
  game: gameRouter,
});
