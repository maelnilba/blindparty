import { Picture } from "@components/images/picture";
import { Playlist } from "@components/playlist/types";

type PlaylistBannerProps = {
  playlist: Playlist;
  onClick: (id: string) => void;
};
export const PlaylistBanner = ({ playlist, onClick }: PlaylistBannerProps) => {
  const image = playlist.images[0];
  return (
    <div
      onClick={() => onClick(playlist.id)}
      className="group flex cursor-pointer items-center gap-4 p-2 font-bold ring-2 ring-white ring-opacity-5"
    >
      <Picture identifier={image?.url} className="shrink-0">
        <img
          alt={`playlist picture of ${playlist.name}`}
          src={image?.url}
          className="h-12 w-12 rounded border-gray-800 object-cover transition-transform group-hover:scale-105"
        />
      </Picture>
      <div className="inline-block w-3/4">
        <span className="block overflow-hidden truncate text-ellipsis">
          {playlist.name}
        </span>
      </div>
    </div>
  );
};
