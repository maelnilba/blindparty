import { ImageUpload, ImageUploadRef } from "@components/elements/image-upload";
import { GetLayoutThrough } from "@components/layout/layout";
import { AlbumsPicture } from "@components/playlist/albums-picture";
import { PlaylistCard } from "@components/spotify/playlist-card";
import { PlaylistTrackCard } from "@components/spotify/playlist-track-card";
import { TrackPlayer, usePlayer } from "@components/spotify/track-player";
import { useAsyncEffect } from "@hooks/useAsyncEffect";
import { useDebounce } from "@hooks/useDebounce";
import { useMap } from "@hooks/useMap";
import { createQueryValidator } from "@lib/helpers/query-validator";
import { api } from "@utils/api";
import { NextPageWithLayout } from "next";
import { useRouter } from "next/router";
import { Track } from "pages/dashboard/playlist/#types";
import { useRef, useState } from "react";
import { useZorm } from "react-zorm";
import { z } from "zod";
import { create } from "zustand";

const createSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

const validator = createQueryValidator(
  z.object({
    sources: z.array(z.string().url()).length(4),
  })
);

const useAlbumsPictureStore = create<{
  cache: Map<string, Blob>;
  fetch: (sources: string[]) => Promise<Blob>;
}>((set, get) => ({
  cache: new Map(),
  fetch: async (sources) => {
    const hash = sources.join("|");
    const _cache = get().cache;
    if (_cache.has(hash)) return _cache.get(hash)!;

    const url = validator.createSearchURL({
      sources: sources,
    });
    const res = await fetch(`/api/og/merge${url}`);
    const img = await res.blob();
    set({ cache: new Map(_cache.set(hash, img)) });
    return img;
  },
}));

const PlaylistCreate = () => {
  const router = useRouter();
  const {
    map: tracksMap,
    add: addTrack,
    remove: removeTrack,
    adds: addTracks,
    removes: removeTracks,
  } = useMap<Track>();

  const { mutate: search, data: playlists } =
    api.spotify.search_playlist.useMutation();

  const { mutate, data: tracks } = api.spotify.playlist.useMutation();
  const { mutate: create } = api.admin.playlist.create.useMutation({
    onSuccess: () => {
      router.push("/admin/playlist");
    },
  });

  const [mockAlbumsPicture, setMockAlbumsPicture] = useState<
    string[] | undefined
  >();
  const fetchMergeAlbum = useAlbumsPictureStore((state) => state.fetch);
  const setMergeAlbum = useDebounce(async (sources: string[]) => {
    if (!imageUpload.current) return;
    setMockAlbumsPicture(sources);
  }, 100);

  useAsyncEffect(async () => {
    if (
      tracksMap.size > 3 &&
      imageUpload.current &&
      !imageUpload.current.local
    ) {
      const images = [
        ...[...tracksMap]
          .map(([_, v]) => v.album.images)
          .reduce((map, images) => {
            const image = images[0];
            if (image) map.set(image.url, (map.get(image.url) ?? 0) + 1);
            return map;
          }, new Map<string, number>()),
      ]
        .map(([k, v]) => ({
          count: v,
          image: k,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 4);

      if (images.length !== 4) return;
      const sources = images.map((img) => img.image).sort();
      await setMergeAlbum(sources);
    }

    if (tracksMap.size < 4) {
      setMockAlbumsPicture(undefined);
    }
  }, [tracksMap]);

  const { load, start, pause, unpause, currentTrack, playing } = usePlayer();
  const playTrack = async (track: Track) => {
    if (currentTrack?.id === track.id && playing) {
      pause();
    } else if (currentTrack?.id === track.id) {
      unpause();
    } else {
      await load(track);
      await start();
    }
  };

  const onSearch = useDebounce((field: string) => {
    search({ field: field });
  });

  const getPlaylistTrack = (id: string) => {
    mutate({ id });
  };

  const imageUpload = useRef<ImageUploadRef | null>(null);
  const zo = useZorm("create", createSchema, {
    async onValidSubmit(e) {
      e.preventDefault();

      const tracks = [...tracksMap].map(([_, track]) => ({
        id: track.id,
        name: track.name,
        preview_url: track.preview_url!,
        album: {
          id: track.album.id,
          name: track.album.name,
          images: track.album.images.map((image) => ({
            url: image.url,
            height: image.height || 1,
            width: image.width || 1,
          })),
        },
        artists: track.artists.map((artist) => ({
          id: artist.id,
          name: artist.name,
        })),
      }));

      if (tracks.length < 1) {
        return;
      }

      if (imageUpload.current && mockAlbumsPicture) {
        const img = await fetchMergeAlbum(mockAlbumsPicture);
        imageUpload.current.set(img, true);
      }

      if (imageUpload.current && imageUpload.current.changed) {
        await imageUpload.current.upload();
      }

      create({
        name: e.data.name,
        description: e.data.description,
        s3key: imageUpload.current ? imageUpload.current.key : undefined,
        tracks: tracks,
      });
    },
  });

  return (
    <div className="scrollbar-hide flex flex-1 flex-row gap-2">
      <div className="scrollbar-hide flex h-screen flex-1 flex-col gap-2 overflow-y-auto px-4 pb-24">
        <div className="sticky top-0 flex flex-col gap-2 bg-black/10 py-2 pt-20 backdrop-blur-sm">
          <label htmlFor="playlist-name" className="font-semibold">
            Rechercher une playlist
          </label>
          <input
            onChange={(e) => onSearch(e.target.value)}
            id="playlist-name"
            className="block w-full rounded-lg border border-gray-800 bg-black p-2.5 text-sm text-white focus:border-gray-500 focus:outline-none focus:ring-gray-500"
          />
        </div>
        <div className="p-4">
          {playlists?.map((playlist) => (
            <PlaylistCard
              key={playlist.id}
              playlist={playlist}
              onClick={getPlaylistTrack}
            />
          ))}
        </div>
      </div>
      <div className="scrollbar-hide flex h-screen flex-1 flex-col gap-2 overflow-y-auto pb-24">
        {tracks && (
          <div className="sticky top-0 z-10 flex items-center justify-center gap-4 bg-black/10 py-2 pt-20 backdrop-blur-sm">
            <button
              onClick={() =>
                addTracks(tracks.filter((t) => t.track).map((t) => t.track!))
              }
              className="rounded-full bg-white px-6 py-1 text-lg font-semibold text-black no-underline transition-transform hover:scale-105"
            >
              Ajouter tout
            </button>
            {tracks.some(
              (track) => track.track && tracksMap.has(track.track?.id)
            ) && (
              <button
                onClick={() =>
                  removeTracks(
                    tracks.filter((t) => t.track).map((t) => t.track!)
                  )
                }
                className="rounded-full bg-white px-6 py-1 text-lg font-semibold text-black no-underline transition-transform hover:scale-105"
              >
                Retirer tout
              </button>
            )}
          </div>
        )}
        <div className="p-4">
          {tracks
            ?.filter((t) => t.track)
            .map((track) => {
              if (!track.track) {
                return null;
              }
              return (
                <PlaylistTrackCard
                  key={track.track.id}
                  track={track.track}
                  onAdd={addTrack}
                  onPlay={playTrack}
                  playing={
                    Boolean(currentTrack) &&
                    currentTrack?.id === track.track.id &&
                    playing
                  }
                />
              );
            })}
        </div>
      </div>
      <div className="scrollbar-hide relative flex h-screen flex-1 flex-col gap-2 overflow-y-auto pb-24 ">
        <div className="sticky top-0 z-10 flex flex-col gap-2 bg-black/10 py-2 pt-20 backdrop-blur-sm ">
          <div className="px-4 pb-2">
            <button
              type="submit"
              form="create-playlist"
              className="w-full rounded-full bg-white px-6 py-1 text-lg font-semibold text-black no-underline transition-transform hover:scale-105"
            >
              Créer
            </button>
          </div>
          <div className="relative flex flex-grow items-center justify-center gap-4">
            <ImageUpload
              ref={imageUpload}
              className="flex-1"
              prefix="playlist"
              presignedOptions={{ autoResigne: true, expires: 60 * 5 }}
            >
              {mockAlbumsPicture && (
                <AlbumsPicture
                  className="flex-1"
                  row1={mockAlbumsPicture.slice(0, 2)}
                  row2={mockAlbumsPicture.slice(2, 4)}
                />
              )}
            </ImageUpload>
            <form
              ref={zo.ref}
              id="create-playlist"
              className="flex flex-[2] flex-col gap-2"
            >
              <div>
                <label htmlFor={zo.fields.name()} className="font-semibold">
                  Nom
                </label>
                <input
                  id={zo.fields.name()}
                  name={zo.fields.name()}
                  className="block w-full rounded-lg border border-gray-800 bg-black p-2.5 text-sm text-white focus:border-gray-500 focus:outline-none focus:ring-gray-500"
                />
              </div>
              <div>
                <label
                  htmlFor={zo.fields.description()}
                  className="font-semibold"
                >
                  Description
                </label>
                <input
                  id={zo.fields.description()}
                  name={zo.fields.description()}
                  className="block w-full rounded-lg border border-gray-800 bg-black p-2.5 text-sm text-white focus:border-gray-500 focus:outline-none focus:ring-gray-500"
                />
              </div>
            </form>
          </div>
        </div>
        <div className="p-4">
          {[...tracksMap].map(([_, track]) => (
            <PlaylistTrackCard
              key={track.id}
              track={track}
              onRemove={removeTrack}
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

const PlaylistCreateWrapper: NextPageWithLayout = () => {
  return (
    <TrackPlayer>
      <PlaylistCreate />
    </TrackPlayer>
  );
};

export default PlaylistCreateWrapper;

PlaylistCreateWrapper.getLayout = GetLayoutThrough;
