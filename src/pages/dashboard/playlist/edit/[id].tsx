import { ImageUpload, ImageUploadRef } from "@components/elements/image-upload";
import { GetLayoutThrough } from "@components/layout/layout";
import { ModalRef } from "@components/elements/confirmation-modal";
import { Modal } from "@components/elements/modal";
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
import { api } from "@utils/api";
import { getQuery } from "@utils/next-router";
import { Noop } from "helpers/noop";
import type {
  NextPageWithAuth,
  NextPageWithLayout,
  NextPageWithTitle,
} from "next";
import { useRouter } from "next/router";
import { useRef, useState } from "react";
import { useZorm } from "react-zorm";
import { z } from "zod";

const editSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

const PlaylistEdit = () => {
  const { query, push } = useRouter();
  const id = getQuery(query.id);

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
    mutateAsync: edit,
    isLoading: isEditLoading,
    isSuccess: isEditSuccess,
  } = api.playlist.edit.useMutation({
    onSuccess: () => {
      push("/dashboard/playlist");
    },
  });

  const {
    mutateAsync: edit_empty,
    isLoading: isEditEmptyLoading,
    isSuccess: isEditEmptySuccess,
  } = api.playlist.edit_empty.useMutation();

  const {
    mutateAsync: remove_tracks,
    isLoading: isRemoveTracksLoading,
    isSuccess: isRemoveTrackSuccess,
  } = api.playlist.remove_tracks.useMutation();

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
  const { submitPreventDefault, isSubmitting } = useSubmit<typeof editSchema>(
    async (e) => {
      if (!id || !playlist) {
        return;
      }
      const removed_tracks = playlist.tracks
        .filter((track) => !tracksMap.has(track.id))
        .map((track) => track.id);

      const tracks = [...tracksMap]
        .map(([_, track]) => ({
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
        }))
        .filter((t) => !playlist.tracks.find((pt) => pt.id === t.id));

      if (
        tracks.length < 1 &&
        removed_tracks.length < 1 &&
        e.data.name === playlist.name &&
        (e.data.description ?? null) === playlist.description &&
        !imageUpload.current?.local
      ) {
        push("/dashboard/playlist");
        return;
      }

      if (
        imageUpload.current &&
        mockAlbumsPicture &&
        !imageUpload.current.changed &&
        !imageUpload.current.local
      ) {
        const img = await fetchMergeAlbum(mockAlbumsPicture);
        await imageUpload.current.set(img, true, s3key.current);
      }

      if (imageUpload.current && imageUpload.current.local) {
        await imageUpload.current.upload(s3key.current);
      }

      if (tracks.length <= 20) {
        await edit({
          id: id,
          name: e.data.name,
          description: e.data.description,
          s3key: imageUpload.current ? imageUpload.current.key : undefined,
          tracks: tracks,
          removed_tracks: removed_tracks,
          generated: Boolean(mockAlbumsPicture && !imageUpload.current?.local),
        });
      } else {
        const edit = await edit_empty({
          id: playlist.id,
          name: e.data.name,
          description: e.data.description,
          s3key: imageUpload.current ? imageUpload.current.key : undefined,
          generated: Boolean(mockAlbumsPicture && !imageUpload.current?.local),
        });

        await Promise.all(
          Array.from({ length: Math.ceil(tracks.length / 20) }, (_, i) =>
            tracks.slice(i * 20, i * 20 + 20)
          )
            .map((tracks) => insert_tracks({ id: edit.id, tracks }))
            .concat([remove_tracks({ id: edit.id, removed_tracks })])
        );

        push("/dashboard/playlist");
      }
    }
  );
  const zo = useZorm("create", editSchema, {
    onValidSubmit: submitPreventDefault,
  });

  const getPlaylistTrack = (id: string) => {
    mutate({ id });
  };

  return (
    <div className="scrollbar-hide flex flex-1 flex-row gap-2">
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
                className=" rounded-full bg-white px-6 py-1 text-lg font-semibold text-black no-underline transition-transform hover:scale-105"
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
                isEditLoading ||
                isEditSuccess ||
                isEditEmptyLoading ||
                isEditEmptySuccess ||
                isInsertTracksLoading ||
                isInsertTrackSuccess ||
                isRemoveTracksLoading ||
                isRemoveTrackSuccess
              }
              type="submit"
              form="create-playlist"
              className="w-full rounded-full bg-white px-6 py-1 text-lg font-semibold text-black no-underline transition-transform hover:scale-105 disabled:opacity-75"
            >
              Sauvegarder
            </button>
          </div>
          <div className="flex flex-grow items-center justify-center gap-4">
            <ImageUpload
              generated={playlist?.generated}
              src={playlist?.picture}
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

const PlaylistEditWrapper: NextPageWithLayout & NextPageWithTitle = () => {
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
      <PlaylistEdit />
    </TrackPlayer>
  );
};

export default PlaylistEditWrapper;

PlaylistEditWrapper.getLayout = GetLayoutThrough;
PlaylistEditWrapper.title = (_) => {
  const { query } = useRouter();
  const id = getQuery(query.id);

  const { data, isLoading } = api.playlist.get_playlist.useQuery(
    { id: id! },
    {
      enabled: id !== undefined,
      refetchOnMount: true,
      refetchOnWindowFocus: false,
    }
  );

  if (!data) return;

  return `Playlists | Edit | ${data.name}`;
};
