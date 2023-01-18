import { createTRPCRouter } from "server/api/trpc";
import { playlistRouter } from "./playlist";

export const adminRouter = createTRPCRouter({
  playlist: playlistRouter,
});
