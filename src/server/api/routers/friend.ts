import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const friendRouter = createTRPCRouter({
  get_all: protectedProcedure
    .input(
      z
        .object({
          take: z.number().min(1),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUniqueOrThrow({
        where: {
          id: ctx.session.user.id,
        },
        select: {
          friends: {
            take: input?.take,
            select: {
              id: true,
              friendId: true,
              image: true,
              name: true,
            },
          },
        },
      });
      return user.friends;
    }),
  get_invitations: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.friendInvitation.findMany({
      where: {
        OR: [
          {
            AND: [
              {
                user_invite: {
                  id: ctx.session.user.id,
                },
              },
              {
                NOT: {
                  user_sent: {
                    id: ctx.session.user.id,
                  },
                },
              },
              {
                status: {
                  notIn: ["REFUSED", "BLOCKED", "ACCEPTED"],
                },
              },
            ],
          },
          {
            AND: [
              {
                user_sent: {
                  id: ctx.session.user.id,
                },
              },
              {
                NOT: {
                  user_invite: {
                    id: ctx.session.user.id,
                  },
                },
              },
              {
                status: {
                  notIn: ["REFUSED", "BLOCKED", "ACCEPTED"],
                },
              },
            ],
          },
        ],
      },
      select: {
        id: true,
        status: true,
        createdAt: true,
        user_invite: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        user_sent: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });
  }),
  accept_invitation: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const invitation = await ctx.prisma.friendInvitation.findFirstOrThrow({
        where: {
          id: input.id,
          status: "PENDING",
        },
        include: {
          user_invite: true,
          user_sent: true,
        },
      });

      if (!invitation) {
        return null;
      }

      await ctx.prisma.user.update({
        where: {
          id: invitation.user_sent.id,
        },
        data: {
          friends: {
            connectOrCreate: {
              create: {
                friendId: invitation.user_invite.id,
                name: invitation.user_invite.name,
                image: invitation.user_invite.image,
              },
              where: {
                friendId: invitation.user_invite.id,
              },
            },
          },
        },
      });

      await ctx.prisma.user.update({
        where: {
          id: invitation.user_invite.id,
        },
        data: {
          friends: {
            connectOrCreate: {
              create: {
                friendId: invitation.user_sent.id,
                name: invitation.user_sent.name,
                image: invitation.user_sent.image,
              },
              where: {
                friendId: invitation.user_sent.id,
              },
            },
          },
        },
      });
      const _invitation = await ctx.prisma.friendInvitation.update({
        where: {
          id: input.id,
        },
        data: {
          status: "ACCEPTED",
        },
      });

      return _invitation;
    }),
  reject_invitation: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.friendInvitation.update({
        where: {
          id: input.id,
        },
        data: {
          status: "REFUSED",
        },
      });
    }),
  refresh_invitation: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.friendInvitation.updateMany({
        where: {
          id: input.id,
          status: {
            not: "BLOCKED",
          },
        },
        data: {
          status: "PENDING",
        },
      });
    }),
  block_invitation: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.friendInvitation.update({
        where: {
          id: input.id,
        },
        data: {
          status: "BLOCKED",
        },
      });
    }),
  remove: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.user.update({
        where: {
          id: ctx.session.user.id,
        },
        data: {
          friends: {
            disconnect: {
              id: input.id,
            },
          },
        },
      });
    }),
  search: protectedProcedure
    .input(z.object({ field: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.user.findMany({
        where: {
          name: {
            contains: input.field,
            mode: "insensitive",
          },
          AND: {
            NOT: {
              id: ctx.session.user.id,
            },
            AND: {
              friends: {
                none: {
                  friendId: ctx.session.user.id,
                },
              },
            },
          },
        },
        select: {
          image: true,
          name: true,
          id: true,
        },
      });
    }),
  sent_invitation: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.friendInvitation.create({
        data: {
          userSentId: ctx.session.user.id,
          userInviteId: input.id,
        },
      });
    }),
});
