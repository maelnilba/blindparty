import { Picture } from "@components/images/picture";
import { AuthGuardUser } from "@components/layout/auth";
import { TrackBanner } from "@components/playlist/track-banner";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { useDebounce } from "@hooks/helpers/useDebounce";
import { api, RouterOutputs } from "@utils/api";
import type { NextPageWithAuth } from "next";
import { NextPageWithTitle } from "next";
import Link from "next/link";
import { useState } from "react";

const PlaylistSearch: NextPageWithAuth & NextPageWithTitle = () => {
  const [search, setSearch] = useState("");
  const { data: playlists, refetch } = api.playlist.get_public.useQuery({
    field: search,
  });

  const { mutate: connect } = api.playlist.connect_playlist.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const onSearch = useDebounce((field: string) => {
    setSearch(field);
  });

  const [autoAnimateRef] = useAutoAnimate();

  return (
    <div className="flex flex-row gap-2">
      <div className="scrollbar-hide flex h-[40rem] flex-1 flex-col gap-2 overflow-y-auto px-4">
        <div className="sticky top-0 z-[2] flex flex-col gap-2 bg-black/10 py-2 backdrop-blur-sm">
          <label htmlFor="playlist-name" className="font-semibold">
            Rechercher une playlist
          </label>
          <input
            onChange={(e) => onSearch(e.target.value)}
            id="playlist-name"
            className="block w-full rounded-lg border border-gray-800 bg-black p-2.5 text-white focus:border-gray-500 focus:outline-none focus:ring-gray-500"
          />
        </div>
        <div className="flex flex-wrap gap-4 px-28" ref={autoAnimateRef}>
          {playlists?.map((playlist) => (
            <PlaylistCard
              key={playlist.id}
              playlist={playlist}
              onAdd={(playlist) => connect({ id: playlist.id })}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default PlaylistSearch;
PlaylistSearch.auth = AuthGuardUser;
PlaylistSearch.title = "Playlists | Search";

type PlaylistCardProps = {
  playlist: RouterOutputs["playlist"]["get_public"][number];
  onAdd: (playlist: RouterOutputs["playlist"]["get_public"][number]) => void;
};
const PlaylistCard = ({ playlist, onAdd }: PlaylistCardProps) => {
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
          href={`/dashboard/playlist/discover/${playlist.id}`}
          className="flex-1 rounded-full bg-white px-6 py-1 text-center text-lg font-semibold text-black no-underline transition-transform hover:scale-105"
        >
          Découvrir
        </Link>
        <button
          onClick={() => onAdd(playlist)}
          className="flex-1 rounded-full bg-white px-6 py-1 text-lg font-semibold text-black no-underline transition-transform hover:scale-105"
        >
          Ajouter
        </button>
      </div>
    </div>
  );
};
