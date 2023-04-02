import { Picture } from "@components/images/picture";
import { AuthGuard } from "@components/layout/auth";
import { TrackCard } from "@components/playlist/playlist-track-card";
import { useDebounce } from "@hooks/useDebounce";
import { api, RouterOutputs } from "@utils/api";
import type { NextPageWithAuth } from "next";
import Link from "next/link";
import { useEffect, useRef } from "react";

const PlaylistSearch: NextPageWithAuth = () => {
  const searchRef = useRef<HTMLInputElement | null>(null);
  const { data: playlists, mutate: search } =
    api.playlist.get_public.useMutation();

  const { mutate: connect } = api.playlist.connect_playlist.useMutation({
    onSuccess: () => {
      if (searchRef.current) {
        searchRef.current.value
          ? search({ field: searchRef.current.value })
          : search();
      }
    },
  });
  useEffect(() => {
    search();
  }, []);

  const onSearch = useDebounce((field: string) => {
    field
      ? search({
          field: field,
        })
      : search();
  });

  const addPlaylist = (
    playlist: RouterOutputs["playlist"]["get_public"][number]
  ) => {
    connect({ id: playlist.id });
  };

  return (
    <div className="flex flex-row gap-2">
      <div className="scrollbar-hide flex h-[40rem] flex-1 flex-col gap-2 overflow-y-auto px-4">
        <div className="sticky top-0 z-[2] flex flex-col gap-2 bg-black/10 py-2 backdrop-blur-sm">
          <label htmlFor="playlist-name" className="font-semibold">
            Rechercher une playlist
          </label>
          <input
            ref={searchRef}
            onChange={(e) => onSearch(e.target.value)}
            id="playlist-name"
            className="block w-full rounded-lg border border-gray-800 bg-black p-2.5 text-sm text-white focus:border-gray-500 focus:outline-none focus:ring-gray-500"
          />
        </div>
        <div className="flex flex-wrap gap-4 px-28">
          {playlists?.map((playlist) => (
            <PlaylistCard
              key={playlist.id}
              playlist={playlist}
              onAdd={addPlaylist}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default PlaylistSearch;
PlaylistSearch.auth = AuthGuard;

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
