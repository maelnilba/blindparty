import { TRPCError } from "@trpc/server";
import { customAlphabet } from "nanoid";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
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
      return ctx.prisma.party.create({
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
            connect: [...input.inviteds, ctx.session.user.id].map((userId) => ({
              id: userId,
            })),
          },
          link: {
            create: {
              url: nanoid(),
            },
          },
        },
      });
    }),
  join: protectedProcedure
    .input(
      z.object({
        id: z.string().cuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const party = await ctx.prisma.party.findUniqueOrThrow({
        where: {
          id: input.id,
        },
        include: {
          inviteds: true,
        },
      });

      if (
        !party.inviteds
          .map((invited) => invited.id)
          .includes(ctx.session.user.id)
      ) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      return ctx.prisma.party.update({
        where: {
          id: input.id,
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
    }),
  start: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(() => {}),
  get_all_invite: protectedProcedure.query(async ({ ctx }) => {
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
    });
  }),
});
