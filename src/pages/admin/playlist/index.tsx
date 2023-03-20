import { Picture } from "@components/images/picture";
import { ConfirmationModal } from "@components/modals/confirmation-modal";
import Navigation from "@components/layout/navigation";
import { api, RouterOutputs } from "@utils/api";
import Link from "next/link";
import type { NextPage } from "next/types";

const Playlists: NextPage = () => {
  const { data: playlists, refetch } = api.admin.playlist.get_all.useQuery();
  const { mutate: erase } = api.admin.playlist.delete.useMutation({
    onSuccess: () => {
      refetch();
    },
  });
  const deletePlaylist = (
    playlist: RouterOutputs["admin"]["playlist"]["get_all"][number]
  ) => {
    erase({ id: playlist.id });
  };
  return (
    <div className="flex flex-wrap gap-4 p-4 px-28">
      <div className="flex h-96 w-96 flex-col items-center justify-center gap-4 rounded border border-gray-800">
        <Link
          href="/admin/playlist/create"
          className="w-80 rounded-full bg-white px-6 py-1 text-center text-lg font-semibold text-black no-underline transition-transform hover:scale-105"
        >
          Créer une playlist
        </Link>
      </div>
      {playlists?.map((playlist) => (
        <PlaylistCard
          key={playlist.id}
          playlist={playlist}
          onDelete={deletePlaylist}
        />
      ))}
    </div>
  );
};

type PlaylistCardProps = {
  playlist: RouterOutputs["admin"]["playlist"]["get_all"][number];
  onDelete: (
    playlist: RouterOutputs["admin"]["playlist"]["get_all"][number]
  ) => void;
};
const PlaylistCard = ({ playlist, onDelete }: PlaylistCardProps) => {
  return (
    <div className="scrollbar-hide relative flex h-96 w-96 flex-col overflow-y-auto rounded border border-gray-800 ">
      <div className="sticky top-0 flex flex-row items-center justify-end gap-2 bg-black/10 px-2 py-2 font-semibold backdrop-blur-sm">
        <div>
          <p className="text-2xl">{playlist.name}</p>
          <p>{playlist.description}</p>
          <p>{playlist._count.tracks} tracks</p>
        </div>
        <Picture identifier={playlist.picture}>
          <img
            className="aspect-square h-24 w-24 rounded border-gray-800 object-cover"
            src={playlist.picture!}
          />
        </Picture>
      </div>
      <div className="flex-1 p-2">
        {playlist.tracks.map((track) => (
          <TrackCard key={track.id} track={track} />
        ))}
      </div>
      <div className="sticky bottom-0 flex flex-row items-center justify-center gap-2 bg-black/10 px-2 py-2 font-semibold backdrop-blur-sm">
        <Link
          href={`/admin/playlist/edit/${playlist.id}`}
          className="flex-1 rounded-full bg-white px-6 py-1 text-center text-lg font-semibold text-black no-underline transition-transform hover:scale-105"
        >
          Modifier
        </Link>

        <ConfirmationModal
          title={`Supprimer la playlist`}
          message={`Êtes vous certain de vouloir supprimer votre playlist ${playlist.name} ? Cette action est irreversible.`}
          action="Supprimer"
          onSuccess={() => {
            onDelete(playlist);
          }}
        >
          <button className="rounded-full bg-pink-200 px-6 py-1 text-lg font-semibold text-black no-underline transition-transform hover:scale-105">
            Supprimer
          </button>
        </ConfirmationModal>
      </div>
    </div>
  );
};

export default Playlists;

type TrackCardProps = {
  track: RouterOutputs["playlist"]["get_all"][number]["tracks"][number];
};
const TrackCard = ({ track }: TrackCardProps) => {
  const image = track.album.images[0];
  return (
    <div className="flex cursor-pointer items-center gap-4 p-2 font-bold ring-2 ring-white ring-opacity-5">
      <picture>
        <img
          alt={`track picture of ${track.name}`}
          src={image?.url}
          className="h-12 w-12 rounded border-gray-800 object-cover transition-transform"
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
