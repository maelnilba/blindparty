import { Playlist } from "pages/dashboard/playlist/#types";

type PlaylistCardProps = {
  playlist: Playlist;
  onClick: (id: string) => void;
};
export const PlaylistCard = ({ playlist, onClick }: PlaylistCardProps) => {
  const image = playlist.images[0];
  return (
    <div
      onClick={() => onClick(playlist.id)}
      className="group flex cursor-pointer items-center gap-4 p-2 font-bold ring-2 ring-white ring-opacity-5"
    >
      <picture>
        <img
          alt={`playlist picture of ${playlist.name}`}
          src={image?.url}
          className="h-12 w-12 rounded border-gray-800 object-cover transition-transform group-hover:scale-105"
        />
      </picture>
      <div className="inline-block w-3/4">
        <span className="block overflow-hidden truncate text-ellipsis">
          {playlist.name}
        </span>
      </div>
    </div>
  );
};
