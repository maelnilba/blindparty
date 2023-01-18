import { env } from "env/server.mjs";
import SpotifyWebApi from "spotify-web-api-node";

declare global {
  // eslint-disable-next-line no-var
  var spotify: SpotifyWebApi | undefined;
}

export const spotify =
  global.spotify ||
  new SpotifyWebApi({
    clientId: env.SPOTIFY_CLIENT_ID,
    clientSecret: env.SPOTIFY_CLIENT_SECRET,
  });

if (env.NODE_ENV !== "production") {
  global.prisma = prisma;
}
