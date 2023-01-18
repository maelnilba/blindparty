import { z } from "zod";
import { createTRPCRouter, spotifyProcedure } from "../trpc";

export const spotifyRouter = createTRPCRouter({
  playlists: spotifyProcedure.query(async ({ ctx }) => {
    const { body } = await ctx.spotify.getUserPlaylists(
      ctx.session.spotifyUserId
    );
    return body.items;
  }),
  playlist: spotifyProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { body } = await ctx.spotify.getPlaylistTracks(input.id);
      return body.items;
    }),
  search_playlist: spotifyProcedure
    .input(
      z.object({
        field: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { body } = await ctx.spotify.searchPlaylists(input.field);
      return body?.playlists?.items;
    }),
});
