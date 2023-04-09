import { adminRouter } from "./routers/admin/root";
import { friendRouter } from "./routers/friend";
import { s3Router } from "./routers/infra/s3";
import { partyRouter } from "./routers/party";
import { playlistRouter } from "./routers/playlist";
import { userRouter } from "./routers/user";
import { createTRPCRouter } from "./trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here
 */
export const appRouter = createTRPCRouter({
  playlist: playlistRouter,
  friend: friendRouter,
  user: userRouter,
  admin: adminRouter,
  party: partyRouter,
  s3: s3Router,
});

// export type definition of API
export type AppRouter = typeof appRouter;
