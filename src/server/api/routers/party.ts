import { customAlphabet } from "nanoid";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { gameRouter } from "./party/game";
const nanoid = customAlphabet("1234567890", 6);

export const partyRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        playlist_id: z.string().cuid(),
        inviteds: z.array(z.string().cuid()),
        max_round: z.number().min(10),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.$transaction(async (prisma) => {
        const party = await prisma.party.create({
          data: {
            max_round: input.max_round,
            playlist: {
              connect: {
                id: input.playlist_id,
              },
            },
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

  game: gameRouter,
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
});
