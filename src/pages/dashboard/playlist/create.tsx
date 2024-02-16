import { ImageUpload, ImageUploadRef } from "@components/elements/image-upload";
import { GetLayoutThrough } from "@components/layout/layout";
import { Modal, ModalRef } from "@components/elements/modal";
import {
  AlbumsPicture,
  useAlbumsPictureStore,
} from "@components/playlist/albums-picture";
import { Track } from "@components/playlist/types";
import { PlaylistBanner } from "@components/player/playlist-banner";
import { TrackBanner } from "@components/player/track-banner";
import { TrackPlayer, usePlayer } from "@components/player/track-player";
import { spotify } from "@hooks/api/useTrackApi";
import { useCountCallback } from "@hooks/helpers/useCountCallback";
import { useDebounce } from "@hooks/helpers/useDebounce";
import { useMap } from "@hooks/helpers/useMap";
import { useAsyncEffect } from "@hooks/itsfine/useAsyncEffect";
import { useSubmit } from "@hooks/zorm/useSubmit";
import { Noop } from "helpers/noop";
import { api } from "@utils/api";
import { NextPageWithAuth, NextPageWithLayout, NextPageWithTitle } from "next";
import { useRouter } from "next/router";
import { useRef, useState } from "react";
import { z } from "zod";
import { useF0rm } from "modules/f0rm";

const createSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

const PlaylistCreate = () => {
  const router = useRouter();
  const {
    map: tracksMap,
    add: addTrack,
    remove: removeTrack,
    adds: addTracks,
    removes: removeTracks,
    reset: resetTracks,
  } = useMap<Track>();

  const { data } = spotify.getUserPlaylists();
  const { refetch: mutate, data: tracks } = spotify.getPlaylistTracks();

  const {
    mutateAsync: create,
    isLoading: isCreateLoading,
    isSuccess: isCreateSuccess,
  } = api.playlist.create.useMutation({
    onSuccess: () => {
      router.push("/dashboard/playlist");
    },
  });

  const {
    mutateAsync: create_empty,
    isLoading: isCreateEmptyLoading,
    isSuccess: isCreateEmptySuccess,
  } = api.playlist.create_empty.useMutation();

  const {
    mutateAsync: insert_tracks,
    isLoading: isInsertTracksLoading,
    isSuccess: isInsertTrackSuccess,
  } = api.playlist.insert_tracks.useMutation();

  const modal = useRef<ModalRef>(null);
  const currentRemoveTrack = useRef<Track>();
  const openModal = () => {
    if (modal.current) modal.current.open();
  };
  const closeModal = () => {
    if (modal.current) modal.current.close();
    currentRemoveTrack.current = undefined;
  };

  const handleRemoveTrack = useCountCallback(
    { at: 15, reset: 60000 },
    removeTrack,
    (track) => {
      currentRemoveTrack.current = track;
      openModal();
    },
    [tracks]
  );

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

  const getPlaylistTrack = (id: string) => {
    mutate({ id });
  };

  const imageUpload = useRef<ImageUploadRef | null>(null);

  const { submitPreventDefault, isSubmitting } = useSubmit(async (e) => {
    if (!e.success) return;
    const tracks = [...tracksMap].map(([_, track]) => ({
      id: track.id,
      name: track.name,
      preview_url: track.preview_url!,
      album: {
        name: track.album.name,
        images: track.album.images.map((image) => ({
          url: image.url,
        })),
      },
      artists: track.artists.map((artist) => ({
        name: artist.name,
      })),
    }));

    if (tracks.length < 1) {
      return;
    }

    if (
      imageUpload.current &&
      mockAlbumsPicture &&
      !imageUpload.current.changed &&
      !imageUpload.current.local
    ) {
      const img = await fetchMergeAlbum(mockAlbumsPicture);
      await imageUpload.current.set(img, true);
    }

    if (imageUpload.current && imageUpload.current.local) {
      await imageUpload.current.upload();
    }

    if (tracks.length <= 20) {
      await create({
        name: e.data.name,
        description: e.data.description,
        s3key: imageUpload.current ? imageUpload.current.key : undefined,
        tracks: tracks,
        generated: Boolean(mockAlbumsPicture && !imageUpload.current?.local),
      });
    } else {
      const playlist = await create_empty({
        name: e.data.name,
        description: e.data.description,
        s3key: imageUpload.current ? imageUpload.current.key : undefined,
        generated: Boolean(mockAlbumsPicture && !imageUpload.current?.local),
      });

      await Promise.all(
        Array.from({ length: Math.ceil(tracks.length / 20) }, (_, i) =>
          tracks.slice(i * 20, i * 20 + 20)
        ).map((tracks) => insert_tracks({ id: playlist.id, tracks }))
      );

      router.push("/dashboard/playlist");
    }
  });

  const f0rm = useF0rm(createSchema, submitPreventDefault);

  return (
    <div className="scrollbar-hide flex flex-1 flex-row gap-2 overflow-y-hidden">
      <div className="scrollbar-hide flex h-screen flex-1 flex-col gap-2 overflow-y-auto p-4 pb-24 pt-20">
        {data?.map((playlist) => (
          <PlaylistBanner
            key={playlist.id}
            playlist={playlist}
            onClick={getPlaylistTrack}
          />
        ))}
      </div>

      <div className="scrollbar-hide relative flex h-screen flex-1 flex-col gap-2 overflow-y-auto pb-24 pt-0.5">
        {tracks && (
          <div className="sticky top-0 z-10 flex items-center justify-center gap-4 bg-black/10 py-2 pt-20 backdrop-blur-sm">
            {!(
              tracks.length && tracks.every((track) => tracksMap.has(track.id))
            ) && (
              <button
                onClick={() => addTracks(tracks)}
                className="rounded-full bg-white px-6 py-1 text-lg font-semibold text-black no-underline transition-transform hover:scale-105"
              >
                Ajouter tout
              </button>
            )}
            {tracks.some((track) => tracksMap.has(track.id)) && (
              <button
                onClick={() => removeTracks(tracks)}
                className="rounded-full bg-white px-6 py-1 text-lg font-semibold text-black no-underline transition-transform hover:scale-105"
              >
                Retirer tout
              </button>
            )}
          </div>
        )}
        <div className="p-4">
          {tracks?.map((track) => (
            <TrackBanner
              key={track.id}
              track={track}
              onAdd={addTrack}
              onRemove={removeTrack}
              on={tracksMap.has(track.id) ? "REMOVE" : "ADD"}
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
      <div className="scrollbar-hide relative flex h-screen flex-1 flex-col gap-2 overflow-y-auto pb-24 pt-0.5">
        <div className="sticky top-0 z-10 flex flex-col gap-2 bg-black/10 py-2 pt-20 backdrop-blur-sm">
          <div className="px-4 pb-2">
            <button
              disabled={
                isSubmitting ||
                isCreateLoading ||
                isCreateSuccess ||
                isCreateEmptyLoading ||
                isCreateEmptySuccess ||
                isInsertTracksLoading ||
                isInsertTrackSuccess
              }
              type="submit"
              form="create-playlist"
              className="w-full rounded-full bg-white px-6 py-1 text-lg font-semibold text-black no-underline transition-transform hover:scale-105 disabled:opacity-75"
            >
              Créer
            </button>
          </div>
          <div className="flex flex-grow items-center justify-center gap-4">
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
              onSubmit={f0rm.form.submit}
              id="create-playlist"
              className="flex flex-[2] flex-col gap-2"
            >
              <div>
                <label
                  htmlFor={f0rm.fields.name().name()}
                  className="font-semibold"
                >
                  Nom
                </label>
                <input
                  id={f0rm.fields.name().name()}
                  name={f0rm.fields.name().name()}
                  className="block w-full rounded-lg border border-gray-800 bg-black p-2.5 text-sm text-white focus:border-gray-500 focus:outline-none focus:ring-gray-500"
                />
              </div>
              <div>
                <label
                  htmlFor={f0rm.fields.description().name()}
                  className="font-semibold"
                >
                  Description
                </label>
                <input
                  id={f0rm.fields.description().name()}
                  name={f0rm.fields.description().name()}
                  className="block w-full rounded-lg border border-gray-800 bg-black p-2.5 text-sm text-white focus:border-gray-500 focus:outline-none focus:ring-gray-500"
                />
              </div>
            </form>
          </div>
        </div>
        <Modal
          ref={modal}
          title="Retirer tout"
          className="w-full"
          closeOnOutside={false}
        >
          <p>Souhaitez vous retirer toutes les tracks de la playlist ?</p>
          <div className="mt-4 flex flex-row justify-end gap-2">
            <button
              type="button"
              className="rounded-full bg-white px-6 py-1 text-center text-lg font-semibold text-black no-underline transition-transform hover:scale-105"
              onClick={() => {
                if (currentRemoveTrack.current)
                  removeTrack(currentRemoveTrack.current);
                closeModal();
              }}
            >
              Retirer
            </button>
            <button
              type="button"
              className="rounded-full bg-white px-6 py-1 text-center text-lg font-semibold text-black no-underline transition-transform hover:scale-105"
              onClick={() => {
                resetTracks();
                closeModal();
              }}
            >
              Retirer tout
            </button>
          </div>
        </Modal>
        <div className="p-4">
          {[...tracksMap].map(([_, track]) => (
            <TrackBanner
              key={track.id}
              track={track}
              onRemove={handleRemoveTrack}
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

const PlaylistCreateWrapper: NextPageWithLayout &
  NextPageWithAuth &
  NextPageWithTitle = () => {
  const router = useRouter();
  const { isLoading } = api.user.can_track_api.useQuery(undefined, {
    refetchOnWindowFocus: false,
    onSuccess(can) {
      if (!can) router.push("/dashboard");
    },
  });

  if (isLoading) return <Noop />;

  return (
    <TrackPlayer>
      <PlaylistCreate />
    </TrackPlayer>
  );
};

export default PlaylistCreateWrapper;

PlaylistCreateWrapper.getLayout = GetLayoutThrough;
PlaylistCreateWrapper.title = "Playlists | New";
