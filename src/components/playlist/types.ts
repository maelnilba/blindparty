import { RouterOutputs } from "@utils/api";

export type Track = TrackSpotify | TrackPrisma;

type TrackSpotify = NonNullable<
  RouterOutputs["spotify"]["playlist"][number]["track"]
>;

type TrackPrisma = NonNullable<
  RouterOutputs["playlist"]["get_all"][number]["tracks"][number]
>;

export type Playlist = RouterOutputs["spotify"]["playlists"][number];
