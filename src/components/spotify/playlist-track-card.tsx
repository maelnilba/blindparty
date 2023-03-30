import { PauseIcon } from "@components/icons/pause";
import { PlayIcon } from "@components/icons/play";
import { Picture } from "@components/images/picture";
import { Track } from "@components/playlist/types";

type PlaylistTrackCardProps = {
  track: Track;
  onAdd?: (track: Track) => void;
  onRemove?: (track: Track) => void;
  onPlay?: (track: Track) => void;
  playing?: boolean;
};

export const PlaylistTrackCard = ({
  track,
  onAdd,
  onRemove,
  onPlay,
  playing,
}: PlaylistTrackCardProps) => {
  const image = track.album.images[0];
  return (
    <div className="group/item flex items-center gap-4 p-2 font-bold ring-2 ring-white ring-opacity-5">
      <picture
        aria-label={`track picture of ${track.name}`}
        className="group/image flex h-12 w-12 select-none items-center justify-center rounded border-gray-800 transition-all duration-75 group-hover/item:scale-105"
        style={{
          cursor: onPlay && "pointer",
          backgroundImage: image?.url && `url('${image.url}')`,
          backgroundRepeat: "no-repeat",
          backgroundSize: "contain",
        }}
        onClick={() => {
          if (onPlay) onPlay(track);
        }}
      >
        {onPlay && (
          <div>
            {!playing ? (
              <PlayIcon className="h-8 w-8 cursor-pointer opacity-0 transition-opacity duration-75 group-hover/image:opacity-100" />
            ) : (
              <PauseIcon className="h-8 w-8 cursor-pointer opacity-0 transition-opacity duration-75 group-hover/image:opacity-100" />
            )}
          </div>
        )}
      </picture>
      <div className="inline-block w-2/4">
        <span className="block overflow-hidden truncate text-ellipsis">
          {track.name}
        </span>
      </div>
      {(onAdd || onRemove) && (
        <button
          onClick={() =>
            onAdd ? onAdd(track) : onRemove ? onRemove(track) : () => {}
          }
          className="rounded-full bg-white px-6 py-1 text-sm font-normal text-black no-underline transition-transform hover:scale-105"
        >
          {onAdd && "Ajouter"}
          {onRemove && "Retirer"}
        </button>
      )}
    </div>
  );
};

type PlaylistTrackInfoCardProps = {
  track: Track;
  onPlay?: (track: Track) => void;
  playing?: boolean;
};

export const PlaylistTrackInfoCard = ({
  track,
  onPlay,
  playing,
}: PlaylistTrackInfoCardProps) => {
  const image = track.album.images[0];
  return (
    <div
      onClickCapture={() => {
        if (onPlay) onPlay(track);
      }}
      className="group/item grid cursor-pointer grid-cols-12 items-center gap-4 p-2 font-bold ring-2 ring-white ring-opacity-5"
    >
      <div className="col-span-4 flex items-center gap-4">
        <Picture identifier={image?.url}>
          <picture
            aria-label={`track picture of ${track.name}`}
            className="flex h-12 w-12 select-none items-center justify-center rounded border-gray-800 transition-all duration-75 group-hover/item:scale-105"
            style={{
              cursor: onPlay && "pointer",
              backgroundImage: image?.url && `url('${image.url}')`,
              backgroundRepeat: "no-repeat",
              backgroundSize: "contain",
            }}
          >
            {onPlay && (
              <div>
                {!playing ? (
                  <PlayIcon className="h-8 w-8 cursor-pointer opacity-0 transition-opacity duration-75 group-hover/item:opacity-100" />
                ) : (
                  <PauseIcon className="h-8 w-8 cursor-pointer opacity-0 transition-opacity duration-75 group-hover/item:opacity-100" />
                )}
              </div>
            )}
          </picture>
        </Picture>
        <div className="inline-block w-3/4">
          <span
            title={track.name}
            className="block overflow-hidden truncate text-ellipsis"
          >
            {track.name}
          </span>
        </div>
      </div>
      <div className="col-span-4 flex items-center justify-center gap-4">
        <div className="inline-block w-2/4">
          <span
            title={track.artists.map((a) => a.name).join(", ")}
            className="block overflow-hidden truncate text-ellipsis"
          >
            {track.artists.map((a) => a.name).join(", ")}
          </span>
        </div>
      </div>
      <div className="col-span-4 flex items-center gap-4">
        <Picture identifier={image?.url}>
          <picture
            aria-label={`track picture of ${track.album.name}`}
            className="flex h-12 w-12 select-none items-center justify-center rounded border-gray-800 transition-all duration-75 group-hover/item:scale-105"
            style={{
              cursor: onPlay && "pointer",
              backgroundImage: image?.url && `url('${image?.url}')`,
              backgroundRepeat: "no-repeat",
              backgroundSize: "contain",
            }}
          ></picture>
        </Picture>
        <div className="inline-block w-2/4">
          <span
            title={track.album.name}
            className="block overflow-hidden truncate text-ellipsis"
          >
            {track.album.name}
          </span>
        </div>
      </div>
    </div>
  );
};
