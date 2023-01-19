import { createTRPCRouter, partyProcedure } from "server/api/trpc";
import { z } from "zod";

export const gameRouter = createTRPCRouter({
  test: partyProcedure
    .input(z.object({ ba: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return 123;
    }),
  // join: partyProcedure.mutation(async ({ ctx, input }) => {
  //   return ctx.prisma.party.update({
  //     where: {
  //       id: input.id,
  //     },
  //     data: {
  //       players: {
  //         connectOrCreate: {
  //           create: {
  //             user: {
  //               connect: {
  //                 id: ctx.session.user.id,
  //               },
  //             },
  //           },
  //           where: {
  //             userId: ctx.session.user.id,
  //           },
  //         },
  //       },
  //     },
  //   });
  // }),
  // start: partyProcedure.mutation(async ({ ctx, input }) => {
  //   return null;
  // }),
});
