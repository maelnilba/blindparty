import { Picture } from "@components/images/picture";
import { RouterOutputs } from "@utils/api";

type Track =
  | RouterOutputs["playlist"]["get_all"][number]["tracks"][number]
  | RouterOutputs["admin"]["playlist"]["get_all"][number]["tracks"][number];

export type TrackBannerProps = {
  track: Track;
};
export const TrackBanner = ({ track }: TrackBannerProps) => {
  const image = track.album.images[0]?.url;
  return (
    <div className="flex items-center gap-4 p-2 font-bold ring-2 ring-white ring-opacity-5">
      <Picture identifier={image} className="shrink-0">
        <img
          alt={`track picture of ${track.name}`}
          src={image}
          className="h-12 w-12 rounded border-gray-800 object-cover transition-transform"
        />
      </Picture>
      <div className="inline-block w-3/4">
        <span className="block overflow-hidden truncate text-ellipsis">
          {track.name}
        </span>
      </div>
    </div>
  );
};
