import { Track } from "pages/dashboard/playlist/#types";

type PlaylistTrackCardProps = {
  track: Track;
  onAdd?: (track: Track) => void;
  onRemove?: (track: Track) => void;
};

export const PlaylistTrackCard = ({
  track,
  onAdd,
  onRemove,
}: PlaylistTrackCardProps) => {
  const image = track.album.images[0];
  return (
    <div className="group flex items-center gap-4 p-2 font-bold ring-2 ring-white ring-opacity-5">
      <picture>
        <img
          alt={`track picture of ${track.name}`}
          src={image?.url}
          className="h-12 w-12 rounded-sm border-gray-800 transition-transform group-hover:scale-105"
        />
      </picture>
      <div className="inline-block w-2/4">
        <span className="block overflow-hidden truncate text-ellipsis">
          {track.name}
        </span>
      </div>
      <button
        onClick={() =>
          onAdd ? onAdd(track) : onRemove ? onRemove(track) : () => {}
        }
        className="rounded-full bg-white px-6 py-1 text-sm font-normal text-black no-underline transition-transform hover:scale-105"
      >
        {onAdd && "Ajouter"}
        {onRemove && "Retirer"}
      </button>
    </div>
  );
};
