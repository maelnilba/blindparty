import { RouterOutputs } from "@utils/api";

type Track =
  | RouterOutputs["playlist"]["get_all"][number]["tracks"][number]
  | RouterOutputs["admin"]["playlist"]["get_all"][number]["tracks"][number];

export type TrackCardProps = {
  track: Track;
};
export const TrackCard = ({ track }: TrackCardProps) => {
  const image = track.album.images[0];
  return (
    <div className="flex items-center gap-4 p-2 font-bold ring-2 ring-white ring-opacity-5">
      <picture>
        <img
          alt={`track picture of ${track.name}`}
          src={image?.url}
          className="h-12 w-12 rounded-sm border-gray-800 object-cover transition-transform"
        />
      </picture>
      <div className="inline-block w-3/4">
        <span className="block overflow-hidden truncate text-ellipsis">
          {track.name}
        </span>
      </div>
    </div>
  );
};
