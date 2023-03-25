import { initPRPC } from "@prpc/server";
import Pusher from "pusher";
import superjson from "superjson";
import { z } from "zod";
import { env } from "../../env/server.mjs";
import { createTRPCContext, protectedProcedure } from "./trpc";

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
    .auth(async ({ ctx, data }) => {
      return {
        id: ctx.session?.user?.id || "",
        name: ctx.session?.user?.name || "",
        isHost: data.isHost || false,
      };
    }),
});

export type PRPCRouter = typeof prpc;
