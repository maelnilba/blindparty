import { AuthGuardAdmin } from "@components/layout/auth";
import { PlaylistCard } from "@components/playlist/playlist-card";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { api, RouterOutputs } from "@utils/api";
import { NextPageWithAuth, NextPageWithTitle } from "next";
import Link from "next/link";

const Playlists: NextPageWithAuth & NextPageWithTitle = () => {
  const { data: playlists, refetch } = api.admin.playlist.get_all.useQuery();
  const { mutate: erase } = api.admin.playlist.delete.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const [autoAnimateRef] = useAutoAnimate();

  return (
    <div className="flex flex-wrap gap-4 p-4 px-28" ref={autoAnimateRef}>
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
          onDelete={(playlist) => erase({ id: playlist.id })}
        />
      ))}
    </div>
  );
};

export default Playlists;

Playlists.auth = AuthGuardAdmin;
Playlists.title = "Playlists";
