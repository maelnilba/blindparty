import { createTRPCRouter } from "./trpc";
import { spotifyRouter } from "./routers/spotify";
import { playlistRouter } from "./routers/playlist";
import { adminRouter } from "./routers/admin/root";
import { friendRouter } from "./routers/friend";
import { userRouter } from "./routers/user";
import { partyRouter } from "./routers/party";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here
 */
export const appRouter = createTRPCRouter({
  spotify: spotifyRouter,
  playlist: playlistRouter,
  friend: friendRouter,
  user: userRouter,
  admin: adminRouter,
  party: partyRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
