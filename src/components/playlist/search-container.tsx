import { List } from "@components/elements/list";
import { PlaylistBanner } from "@components/player/playlist-banner";
import { spotify } from "@hooks/api/useTrackApi";
import { useDebounce } from "@hooks/helpers/useDebounce";

type SearchPlaylistContainerProps = {
  onClick: (id: string) => void;
};
export const SearchPlaylistContainer = ({
  onClick,
}: SearchPlaylistContainerProps) => {
  const { refetch: search, data: playlists } = spotify.searchPlaylists();

  const onSearch = useDebounce((field: string) => {
    search({ field: field });
  });

  return (
    <div className="scrollbar-hide flex h-screen flex-1 flex-col gap-2 overflow-y-auto px-4 pb-24">
      <div className="sticky top-0 flex flex-col gap-2 bg-black/10 py-2 pt-20 backdrop-blur-sm">
        <label htmlFor="playlist-name" className="font-semibold">
          Rechercher une playlist
        </label>
        <input
          onChange={(e) => onSearch(e.target.value)}
          id="playlist-name"
          className="block w-full rounded-lg border border-gray-800 bg-black p-2.5 text-white focus:border-gray-500 focus:outline-none focus:ring-gray-500"
        />
      </div>
      <List.Root className="p-4">
        {playlists?.map((playlist) => (
          <List.Item
            className="outline-none focus:ring-1 focus:ring-white/20"
            key={playlist.id}
            onKeyUp={({ code }) => code === "Enter" && onClick(playlist.id)}
          >
            <PlaylistBanner
              key={playlist.id}
              playlist={playlist}
              onClick={onClick}
            />
          </List.Item>
        ))}
      </List.Root>
    </div>
  );
};
