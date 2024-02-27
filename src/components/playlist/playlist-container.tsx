import { List } from "@components/elements/list";
import { PlaylistBanner } from "@components/playlist/playlist-banner";
import { Playlist } from "./types";

type PlaylistContainerProps = {
  playlists: Playlist[] | undefined;
  onClick: (id: string) => void;
};
export const PlaylistContainer = ({
  playlists,
  onClick,
}: PlaylistContainerProps) => {
  return (
    <List.Root className="scrollbar-hide flex h-screen flex-1 flex-col gap-2 overflow-y-auto p-4 pb-24 pt-20">
      {playlists?.map((playlist) => (
        <List.Item
          className="outline-none focus:ring-1 focus:ring-white/20"
          key={playlist.id}
          onKeyUp={({ code }) => code === "Enter" && onClick(playlist.id)}
        >
          <PlaylistBanner playlist={playlist} onClick={onClick} />
        </List.Item>
      ))}
    </List.Root>
  );
};
