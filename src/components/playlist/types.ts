import { RouterOutputs } from "@utils/api";

export type Track = TrackSpotify | TrackPrisma;
type TrackSpotify = SpotifyApi.TrackObjectFull;

type TrackPrisma = NonNullable<
  RouterOutputs["playlist"]["get_all"][number]["tracks"][number]
>;

export type Playlist = SpotifyApi.PlaylistObjectSimplified;
