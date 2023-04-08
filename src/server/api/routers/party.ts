import { TRPCError } from "@trpc/server";
import { customAlphabet } from "nanoid";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { gameRouter } from "./party/game";
const nanoid = customAlphabet("1234567890", 6);

export const partyRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        playlists_id: z.array(z.string().cuid()),
        inviteds: z.array(z.string().cuid()),
        max_round: z.number().min(10),
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
  get_all_invite: protectedProcedure
    .input(z.object({ take: z.number().optional() }).optional())
    .query(async ({ ctx, input }) => {
      return ctx.prisma.party.findMany({
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
  game: gameRouter,
});
