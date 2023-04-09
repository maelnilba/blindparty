import { RouterOutputs } from "@utils/api";

export type Track = TrackApi.Track | TrackPrisma;

type TrackPrisma = NonNullable<
  RouterOutputs["playlist"]["get_all"][number]["tracks"][number]
>;

export type Playlist = TrackApi.Playlist;
