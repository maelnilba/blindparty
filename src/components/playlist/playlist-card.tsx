import { ConfirmationModal } from "@components/elements/confirmation-modal";
import { Picture } from "@components/images/picture";
import { RouterOutputs } from "@utils/api";
import Link from "next/link";
import { TrackBanner } from "./track-banner";

type PlaylistCardProps = {
  playlist: RouterOutputs["admin"]["playlist"]["get_all"][number];
  onDelete: (
    playlist: RouterOutputs["admin"]["playlist"]["get_all"][number]
  ) => void;
};
export const PlaylistCard = ({ playlist, onDelete }: PlaylistCardProps) => {
  return (
    <div className="scrollbar-hide relative flex h-96 w-96 flex-col overflow-y-auto rounded border border-gray-800 ">
      <div className="sticky top-0 flex flex-row items-center justify-end gap-2 bg-black/10 px-2 py-2 font-semibold backdrop-blur-sm">
        <div>
          <p className="text-2xl">{playlist.name}</p>
          <p>{playlist.description}</p>
          <p>{playlist._count.tracks} tracks</p>
        </div>
        <Picture identifier={playlist.picture} className="shrink-0">
          <img
            className="aspect-square h-24 w-24 rounded border-gray-800 object-cover"
            src={playlist.picture!}
          />
        </Picture>
      </div>
      <div className="flex-1 p-2">
        {playlist.tracks.map((track) => (
          <TrackBanner key={track.id} track={track} />
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
          actions={["Supprimer"]}
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
