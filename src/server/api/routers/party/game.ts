import {
  createTRPCRouter,
  presenceChannelProcedure,
  publicChannelProcedure,
} from "server/api/trpc";
import { z } from "zod";

export const gameRouter = createTRPCRouter({
  test: publicChannelProcedure
    .input(
      z.object({
        test: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // console.log(input.prpc.me);
      return ctx.prpc(input).trigger({ id: "hehe" });
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
