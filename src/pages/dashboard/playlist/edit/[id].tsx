import { ImageUpload, ImageUploadRef } from "@components/elements/image-upload";
import Navigation from "@components/navigation";
import { TrackPlayer, usePlayer } from "@components/spotify/track-player";
import { PlaylistCard } from "@components/spotify/playlist-card";
import { PlaylistTrackCard } from "@components/spotify/playlist-track-card";
import { useMap } from "@hooks/useMap";
import { api } from "@utils/api";
import { getQuery } from "@utils/next-router";
import type { NextPage } from "next";
import { useRouter } from "next/router";
import { useRef } from "react";
import { useZorm } from "react-zorm";
import { z } from "zod";
import { Track } from "../#types";

const editSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

const PlaylistEdit: NextPage = () => {
  const { query, push } = useRouter();
  const id = getQuery(query.id);

  const {
    map: tracksMap,
    add: addTrack,
    remove: removeTrack,
    adds: addTracks,
    removes: removeTracks,
  } = useMap<Track>();

  const { data } = api.spotify.playlists.useQuery();
  const { mutate, data: tracks } = api.spotify.playlist.useMutation();
  const { mutate: edit } = api.playlist.edit.useMutation({
    onSuccess: () => {
      push("/dashboard/playlist");
    },
  });
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
  const s3key = useRef<string>();
  const { data: playlist } = api.playlist.get_playlist.useQuery(
    { id: id! },
    {
      enabled: id !== undefined,
      refetchOnMount: true,
      refetchOnWindowFocus: false,
      onSuccess(playlist) {
        if (!playlist) {
          return;
        }
        if (!zo.form) {
          return;
        }

        (zo.form.elements.namedItem(zo.fields.name()) as any).value =
          playlist.name;
        (zo.form.elements.namedItem(zo.fields.description()) as any).value =
          playlist.description;
        s3key.current = playlist.s3key ?? undefined;
        addTracks(playlist.tracks);
      },
    }
  );
  const imageUpload = useRef<ImageUploadRef | null>(null);
  const zo = useZorm("create", editSchema, {
    async onValidSubmit(e) {
      e.preventDefault();
      if (!id || !playlist) {
        return;
      }
      const removed_tracks = playlist.tracks
        .filter((track) => !tracksMap.has(track.id))
        .map((track) => track.id);

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

      if (imageUpload.current && imageUpload.current.changed) {
        await imageUpload.current.upload(s3key.current);
      }

      edit({
        id: id,
        name: e.data.name,
        description: e.data.description,
        s3key: imageUpload.current ? imageUpload.current.key : undefined,
        tracks: tracks,
        removed_tracks: removed_tracks,
      });
    },
  });

  const getPlaylistTrack = (id: string) => {
    mutate({ id });
  };

  return (
    <div className="flex flex-row gap-2">
      <div className="scrollbar-hide flex h-[40rem] flex-1 flex-col gap-2 overflow-y-auto p-4 pb-20">
        {data?.map((playlist) => (
          <PlaylistCard
            key={playlist.id}
            playlist={playlist}
            onClick={getPlaylistTrack}
          />
        ))}
      </div>
      <div className="scrollbar-hide relative flex h-[40rem] flex-1 flex-col gap-2 overflow-y-auto pb-20">
        {tracks && (
          <div className="sticky top-0 z-10 flex items-center justify-center gap-4 bg-black/10 py-2 backdrop-blur-sm">
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
      <div className="scrollbar-hide relative flex h-[40rem] flex-1 flex-col gap-2 overflow-y-auto pb-20">
        <div className="sticky top-0 z-10 flex flex-col gap-2 bg-black/10 py-2 backdrop-blur-sm">
          <div className="px-4 pb-2">
            <button
              type="submit"
              form="create-playlist"
              className="w-full rounded-full bg-white px-6 py-1 text-lg font-semibold text-black no-underline transition-transform hover:scale-105"
            >
              Sauvegarder
            </button>
          </div>
          <div className="flex flex-grow items-center justify-center gap-4">
            <ImageUpload
              src={playlist?.picture}
              ref={imageUpload}
              className="flex-1"
              prefix="playlist"
            />
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

const PlaylistEditWrapper = () => {
  return (
    <div className="relative min-h-screen w-screen">
      <Navigation />
      <TrackPlayer>
        <PlaylistEdit />
      </TrackPlayer>
    </div>
  );
};

export default PlaylistEditWrapper;
