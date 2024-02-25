import { ClockIcon } from "@components/icons/clock";
import { Picture } from "@components/images/picture";
import { AuthGuardUser } from "@components/layout/auth";
import { BlackScreen } from "@components/layout/blackscreen";
import { GetLayoutThrough } from "@components/layout/layout";
import { TrackExpandedBanner } from "@components/player/track-banner";
import { TrackPlayer, usePlayer } from "@components/player/track-player";
import { Track } from "@components/playlist/types";
import { useRelativeTime } from "@hooks/helpers/useRelativeTime";
import { RouterOutputs, api } from "@utils/api";
import { getQuery } from "@utils/next-router";
import type {
  NextPageWithAuth,
  NextPageWithLayout,
  NextPageWithTitle,
} from "next";
import { useRouter } from "next/router";

const PlaylistDiscover = ({
  playlist,
}: {
  playlist: RouterOutputs["playlist"]["discover"];
}) => {
  const { locale } = useRouter();
  const relativeUpdate = useRelativeTime(playlist.updatedAt, { locale });
  const { load, play, toggle, currentTrack, playing } = usePlayer();
  const playTrack = async (track: Track) => {
    if (currentTrack && currentTrack.id === track.id) {
      await toggle();
    } else {
      load(track);
      await play();
    }
  };

  return (
    <div className="flex flex-1 flex-row gap-2">
      <div className="scrollbar-hide relative flex h-screen flex-1 flex-col gap-2 overflow-y-auto pb-20 pt-20">
        <div className="sticky top-0 z-10 flex flex-col items-start justify-center gap-2 bg-black/5 py-2 backdrop-blur-sm">
          <div className="flex items-center justify-center gap-4 px-6">
            <Picture identifier={playlist?.picture} className="shrink-0">
              <img
                src={playlist?.picture!}
                className="aspect-square h-24 w-24 object-cover"
              />
            </Picture>
            <div className="flex flex-col gap-2">
              <p className="text-4xl font-extrabold">{playlist.name}</p>
              <div className="flex flex-col gap-1">
                <div className="flex flex-row gap-2">
                  <ClockIcon className="h-4 w-4" />
                  <p className="text-xs font-normal">{relativeUpdate}</p>
                </div>
                <p className="text-xs font-normal">
                  Ajoutée par {playlist._count.user} utilisateurs
                </p>
                <p className="text-xs font-normal">
                  {/* Jouée {playlist._count.Party} fois */}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="p-4">
          {playlist.tracks.map((track) => (
            <TrackExpandedBanner
              key={track.id}
              track={track}
              onPlay={playTrack}
              playing={
                Boolean(currentTrack) &&
                currentTrack?.id === track.id &&
                playing
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
};

const usePlaylist = () => {
  const { query } = useRouter();
  const id = getQuery(query.id);

  const { data } = api.playlist.discover.useQuery(
    { id: id! },
    {
      enabled: id !== undefined,
      refetchOnMount: true,
      refetchOnWindowFocus: false,
    }
  );

  return data;
};

const PlaylistDiscoverWrapper: NextPageWithLayout &
  NextPageWithAuth &
  NextPageWithTitle = () => {
  const playlist = usePlaylist();

  if (!playlist) {
    return <BlackScreen />;
  }

  return (
    <TrackPlayer>
      <PlaylistDiscover playlist={playlist} />
    </TrackPlayer>
  );
};

export default PlaylistDiscoverWrapper;

PlaylistDiscoverWrapper.getLayout = GetLayoutThrough;
PlaylistDiscoverWrapper.auth = AuthGuardUser;
PlaylistDiscoverWrapper.title = () => {
  const playlist = usePlaylist();
  if (!playlist) return;
  return `Playlists | Discover | ${playlist.name}`;
};
