import { ConfirmationModal } from "@components/elements/confirmation-modal";
import { Picture } from "@components/images/picture";
import { AuthGuardUser } from "@components/layout/auth";
import { TrackBanner } from "@components/playlist/track-banner";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { type ProvidersCanTrackApi } from "@server/api/routers/user";
import { api, RouterOutputs } from "@utils/api";
import { NextPageWithAuth, NextPageWithTitle } from "next";
import Link from "next/link";
import { useRouter } from "next/router";

const providersCanTrackApi: ProvidersCanTrackApi = [
  "spotify",
  "deezer",
] as const;

const Playlists: NextPageWithAuth & NextPageWithTitle = () => {
  const router = useRouter();
  const { data: canTrackApi, isLoading } = api.user.can_track_api.useQuery();
  const { data: playlists, refetch } = api.playlist.get_all.useQuery();

  const { mutate: erase } = api.playlist.delete.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const { mutate: disconnect } = api.playlist.disconnect.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const [autoAnimateRef] = useAutoAnimate();

  return (
    <div className="flex flex-wrap gap-4 p-4 px-28" ref={autoAnimateRef}>
      <div className="flex h-96 w-96 flex-col items-center justify-center gap-4 rounded border border-gray-800">
        <>
          {canTrackApi ? (
            <Link
              href="/dashboard/playlist/create"
              className="w-80 rounded-full bg-white px-6 py-1 text-center text-lg font-semibold text-black no-underline transition-transform hover:scale-105"
            >
              Créer une playlist
            </Link>
          ) : (
            <ConfirmationModal.Root>
              <ConfirmationModal.Trigger
                disabled={isLoading}
                className="w-80 rounded-full bg-white px-6 py-1 text-center text-lg font-semibold text-black no-underline"
              >
                Créer une playlist
              </ConfirmationModal.Trigger>
              <ConfirmationModal.Message>
                `La création de playlist est disponible uniquement au
                utilisateur ayant lié leur compte
                {providersCanTrackApi
                  .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
                  .join(" ou ")}
                `
              </ConfirmationModal.Message>
              <ConfirmationModal.Action
                className="rounded-full bg-white px-6 py-1 text-center text-lg font-semibold text-black no-underline transition-transform hover:scale-105"
                onClick={() => router.push("/settings/account")}
              >
                Lié un compte
              </ConfirmationModal.Action>
            </ConfirmationModal.Root>
          )}
        </>
        <Link
          href="/dashboard/playlist/search"
          className="w-80 rounded-full bg-pink-200 px-6 py-1 text-center text-lg font-semibold text-black no-underline transition-transform hover:scale-105"
        >
          Rechercher une playlist
        </Link>
      </div>
      {playlists?.map((playlist) => (
        <PlaylistCard
          key={playlist.id}
          playlist={playlist}
          onDelete={(playlist) => erase({ id: playlist.id })}
          onDisconnect={(playlist) => disconnect({ id: playlist.id })}
        />
      ))}
    </div>
  );
};

type PlaylistCardProps = {
  playlist: RouterOutputs["playlist"]["get_all"][number];
  onDelete: (playlist: RouterOutputs["playlist"]["get_all"][number]) => void;
  onDisconnect: (
    playlist: RouterOutputs["playlist"]["get_all"][number]
  ) => void;
};
const PlaylistCard = ({
  playlist,
  onDelete,
  onDisconnect,
}: PlaylistCardProps) => {
  return (
    <div className="scrollbar-hide relative flex h-96 w-96 flex-col overflow-y-auto rounded border border-gray-800 ">
      <div className="sticky top-0 flex flex-row items-center justify-between gap-2 bg-black/10 px-2 py-2 font-semibold backdrop-blur-sm">
        <div className="inline-block w-3/4 px-2 text-end">
          <span className="block overflow-hidden truncate text-ellipsis text-2xl">
            <span title={playlist.name}>{playlist.name}</span>
          </span>
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
        {playlist.public ? (
          <>
            <Link
              href={`/dashboard/playlist/discover/${playlist.id}`}
              className="flex-1 rounded-full bg-white px-6 py-1 text-center text-lg font-semibold text-black no-underline transition-transform hover:scale-105"
            >
              Découvrir
            </Link>
            <ConfirmationModal.Root>
              <ConfirmationModal.Trigger className="w-full rounded-full bg-pink-200 px-6 py-1 text-lg font-semibold text-black no-underline transition-transform hover:scale-105">
                Retirer
              </ConfirmationModal.Trigger>
              <ConfirmationModal.Title>
                Retirer la playlist
              </ConfirmationModal.Title>
              <ConfirmationModal.Message>
                Êtes vous certain de vouloir retirer la playlist {playlist.name}{" "}
                de vos playlist ?
              </ConfirmationModal.Message>
              <ConfirmationModal.Action
                className="rounded-full bg-white px-6 py-1 text-center text-lg font-semibold text-black no-underline transition-transform hover:scale-105"
                onClick={() => onDisconnect(playlist)}
              >
                Retirer
              </ConfirmationModal.Action>
            </ConfirmationModal.Root>
          </>
        ) : (
          <>
            <Link
              href={`/dashboard/playlist/edit/${playlist.id}`}
              className="flex-1 rounded-full bg-white px-6 py-1 text-center text-lg font-semibold text-black no-underline transition-transform hover:scale-105"
            >
              Modifier
            </Link>

            <ConfirmationModal.Root>
              <ConfirmationModal.Trigger className="rounded-full bg-pink-200 px-6 py-1 text-lg font-semibold text-black no-underline transition-transform hover:scale-105">
                Supprimer
              </ConfirmationModal.Trigger>
              <ConfirmationModal.Title>
                Supprimer la playlist
              </ConfirmationModal.Title>
              <ConfirmationModal.Message>
                Êtes vous certain de vouloir supprimer votre playlist{" "}
                {playlist.name} ? Cette action est irreversible, votre playlist
                sera effacée.
              </ConfirmationModal.Message>
              <ConfirmationModal.Action
                className="rounded-full bg-white px-6 py-1 text-center text-lg font-semibold text-black no-underline transition-transform hover:scale-105"
                onClick={() => onDelete(playlist)}
              >
                Supprimer
              </ConfirmationModal.Action>
            </ConfirmationModal.Root>
          </>
        )}
      </div>
    </div>
  );
};

export default Playlists;
Playlists.auth = AuthGuardUser;
Playlists.title = "Playlists";
