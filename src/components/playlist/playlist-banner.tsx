import { AsyncModal } from "@components/elements/async-modal";
import { ExpandIcon } from "@components/icons/expand";
import { Picture } from "@components/images/picture";
import { TrackBanner } from "@components/playlist/track-banner";
import { api, RouterOutputs } from "@utils/api";

export type Playlist = RouterOutputs["playlist"]["get_all"][number];
type PlaylistBannerProps = {
  playlist: Playlist;
  onClick?: (playlist: Playlist) => void;
  canShow?: boolean;
};
export const PlaylistBanner = ({
  playlist,
  onClick,
  canShow,
}: PlaylistBannerProps) => {
  const { data: full_playlist, refetch } = api.playlist.get_playlist.useQuery(
    { id: playlist.id },
    {
      enabled: false,
    }
  );

  return (
    <div className="flex items-center gap-4 p-2 font-bold ring-2 ring-white ring-opacity-5">
      <div
        onClick={onClick && (() => onClick(playlist))}
        className="flex flex-1 items-center gap-4 overflow-hidden"
      >
        <Picture identifier={playlist.picture} className="shrink-0">
          <img
            alt={`playlist picture of ${playlist.name}`}
            src={playlist.picture!}
            className="aspect-square h-12 w-12 rounded border-gray-800 object-cover"
          />
        </Picture>
        <div className="inline-block w-3/4">
          <span
            title={playlist.name}
            className="block overflow-hidden truncate text-ellipsis"
          >
            {playlist.name}
          </span>
          <span className="text-sm">{playlist._count.tracks} tracks</span>
        </div>
      </div>

      {canShow && (
        <AsyncModal
          beforeOpen={refetch}
          title={full_playlist?.name}
          options={{ titleCenter: true }}
        >
          <button type="button">
            <ExpandIcon className="h-6 w-6 hover:scale-125" />
          </button>
          <div className="scrollbar-hide relative flex h-96 w-96 flex-col gap-2 overflow-y-auto">
            <div className="flex flex-1 flex-col gap-2">
              {full_playlist?.tracks?.map((track) => (
                <TrackBanner key={track.id} track={track} />
              ))}
            </div>
          </div>
        </AsyncModal>
      )}
    </div>
  );
};
