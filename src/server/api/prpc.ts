import Pusher from "pusher";
import { env } from "../../env/server.mjs";
import { createTRPCContext, protectedProcedure, publicProcedure } from "./trpc";
import superjson from "superjson";
import { z } from "zod";
import { initPRPC } from "@prpc/server";

const pusherClient = new Pusher({
  appId: env.PUSHER_APP_ID,
  cluster: env.PUSHER_CLUSTER,
  key: env.PUSHER_KEY,
  secret: env.PUSHER_SECRET,
});

const p = initPRPC.context().create({
  pusher: pusherClient,
  transformer: superjson,
  context: createTRPCContext,
});

export const prpc = p.router({
  game: p
    .presenceRoute({
      procedure: protectedProcedure,
      user: z.object({
        id: z.string(),
        name: z.string(),
        isHost: z.boolean(),
      }),
    })
    .auth(async ({ ctx, data, req, res }) => {
      return {
        id: ctx.session?.user?.id || "",
        name: ctx.session?.user?.name || "",
        isHost: data.isHost || false,
      };
    }),
});

export type PRPCRouter = typeof prpc;
