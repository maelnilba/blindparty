import { ErrorMessages } from "@components/elements/error";
import {
  ImageUpload,
  fetchPresignedPost,
  useS3,
} from "@components/elements/image-upload";
import { List } from "@components/elements/list";
import { Modal, ModalRef } from "@components/elements/modal";
import { GetLayoutThrough } from "@components/layout/layout";
import { PlaylistBanner } from "@components/player/playlist-banner";
import { TrackBanner } from "@components/player/track-banner";
import { TrackPlayer, usePlayer } from "@components/player/track-player";
import {
  AlbumsPicture,
  useMergeAlbum,
} from "@components/playlist/albums-picture";
import { Track } from "@components/playlist/types";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { spotify } from "@hooks/api/useTrackApi";
import { useSubmit } from "@hooks/form/useSubmit";
import { useCountCallback } from "@hooks/helpers/useCountCallback";
import { useMap } from "@hooks/helpers/useMap";
import { useForm } from "@marienilba/react-zod-form";
import { api } from "@utils/api";
import { zu } from "@utils/zod";
import { Noop } from "helpers/noop";
import { NextPageWithAuth, NextPageWithLayout, NextPageWithTitle } from "next";
import { useRouter } from "next/router";
import { useRef } from "react";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  tracks: z
    .array(z.object({ id: z.string() }))
    .min(1, { message: "Une playlist doit contenir au minimum une track." })
    .max(1000, {
      message: "Une playlist ne peut contenir plus de 1000 tracks.",
    })
    .default([]),
  image: zu
    .file({
      name: z.string(),
      size: z.number().max(5, { message: "The file should be lower than 5Mo" }),
      type: z.string().startsWith("image/"),
    })
    .optional()
    .transform(fetchPresignedPost({ prefix: "playlist" })),
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

  const handleRemoveTrack = useCountCallback(
    { at: 15, reset: 60000 },
    removeTrack,
    (track) => {
      currentRemoveTrack.current = track;
      if (modal.current) modal.current.open();
    },
    [tracks]
  );

  const [mockAlbumsPicture, fetchMergeAlbum] = useMergeAlbum(tracksMap);

  const { load, play, toggle, currentTrack, playing } = usePlayer();
  const playTrack = async (track: Track) => {
    if (currentTrack && currentTrack.id === track.id) {
      await toggle();
    } else {
      load(track);
      await play();
    }
  };

  const getPlaylistTrack = (id: string) => {
    mutate({ id });
  };

  const { post } = useS3({ prefix: "playlist" });

  const { submitPreventDefault, isSubmitting } = useSubmit<typeof createSchema>(
    async (e) => {
      if (!e.success) return;

      const tracks = [...tracksMap].map(([_, track]) => ({
        id: track.id,
        name: track.name,
        previewUrl: track.previewUrl!,
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

      let key: string | never = z.NEVER;
      if (e.data.image) {
        await post(
          e.data.image.post,
          new File([e.data.image.file], e.data.image.file.name)
        );
        key = e.data.image.key;
      } else if (mockAlbumsPicture) {
        const mock = await fetchMergeAlbum(mockAlbumsPicture);
        const presigned = (await fetchPresignedPost({
          prefix: "playlist",
        })(mock))!;
        await post(
          presigned.post,
          new File([presigned.file], presigned.file.name)
        );
        key = presigned.key;
      }

      if (tracks.length <= 20) {
        await create({
          name: e.data.name,
          description: e.data.description,
          s3Key: key,
          tracks: tracks,
          generated: !Boolean(e.data.image),
        });
      } else {
        const playlist = await create_empty({
          name: e.data.name,
          description: e.data.description,
          s3Key: key,
          generated: !Boolean(e.data.image),
        });

        await Promise.all(
          Array.from({ length: Math.ceil(tracks.length / 20) }, (_, i) =>
            tracks.slice(i * 20, i * 20 + 20)
          ).map((tracks) => insert_tracks({ id: playlist.id, tracks }))
        );

        router.push("/dashboard/playlist");
      }
    }
  );

  const f0rm = useForm(createSchema, submitPreventDefault);

  const [autoAnimateRef] = useAutoAnimate();

  return (
    <div className="scrollbar-hide flex flex-1 flex-row gap-2 overflow-y-hidden">
      <List.Root className="scrollbar-hide flex h-screen flex-1 flex-col gap-2 overflow-y-auto p-4 pb-24 pt-20">
        {data?.map((playlist) => (
          <List.Item
            className="outline-none focus:ring-1 focus:ring-white/20"
            key={playlist.id}
            onKeyUp={({ code }) =>
              code === "Enter" && getPlaylistTrack(playlist.id)
            }
          >
            <PlaylistBanner playlist={playlist} onClick={getPlaylistTrack} />
          </List.Item>
        ))}
      </List.Root>

      <div className="scrollbar-hide relative flex h-screen flex-1 flex-col gap-2 overflow-y-auto px-2 pb-24 pt-0.5">
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
        <List.Root className="flex flex-col gap-2 p-4">
          {tracks?.map((track) => (
            <List.Item
              className="outline-none focus:ring-1 focus:ring-white/20"
              key={track.id}
              onKeyUp={({ code }) => code === "Enter" && playTrack(track)}
            >
              {({ selected }) => (
                <TrackBanner
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
                  selected={selected}
                />
              )}
            </List.Item>
          ))}
        </List.Root>
      </div>
      <div className="scrollbar-hide relative flex h-screen flex-1 flex-col gap-2 overflow-y-auto px-2 pb-24 pt-0.5">
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
            <ImageUpload.Root className="flex aspect-square flex-1 shrink-0 items-center justify-center overflow-hidden rounded border border-gray-800 object-cover text-white">
              <ImageUpload.Input
                form="create-playlist"
                name={f0rm.fields.image().name()}
                accept="image/*"
              />
              <ImageUpload.Picture
                identifier={mockAlbumsPicture}
                className="aspect-square object-contain"
              >
                {({ src }) =>
                  mockAlbumsPicture && !src ? (
                    <AlbumsPicture
                      className="pointer-events-none flex-1"
                      row1={mockAlbumsPicture.slice(0, 2)}
                      row2={mockAlbumsPicture.slice(2, 4)}
                    />
                  ) : (
                    <img
                      alt="Playlist picture"
                      src={src}
                      className="h-full w-full"
                    />
                  )
                }
              </ImageUpload.Picture>
            </ImageUpload.Root>
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
                  data-error={!!f0rm.errors.name().errors()?.length}
                  className="block w-full rounded-lg border border-gray-800 bg-black p-2.5 text-white focus:border-gray-500 focus:outline-none focus:ring-gray-500 data-[error=true]:border-red-500"
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
                  className="block w-full rounded-lg border border-gray-800 bg-black p-2.5 text-white focus:border-gray-500 focus:outline-none focus:ring-gray-500"
                />
              </div>
            </form>
          </div>
        </div>
        <Modal.Root ref={modal} closeOnOutside={false}>
          <Modal.Title className="mb-2 inline-block w-full max-w-sm text-lg font-medium leading-6">
            Retirer tout
          </Modal.Title>
          <Modal.Content>
            <p>Souhaitez vous retirer toutes les tracks de la playlist ?</p>
            <div className="mt-4 flex flex-row justify-end gap-2">
              <Modal.Close
                type="button"
                className="rounded-full bg-white px-6 py-1 text-center text-lg font-semibold text-black no-underline transition-transform hover:scale-105"
                onClick={() => {
                  if (currentRemoveTrack.current)
                    removeTrack(currentRemoveTrack.current);
                }}
              >
                Retirer
              </Modal.Close>
              <Modal.Close
                type="button"
                className="rounded-full bg-white px-6 py-1 text-center text-lg font-semibold text-black no-underline transition-transform hover:scale-105"
                onClick={resetTracks}
              >
                Retirer tout
              </Modal.Close>
            </div>
          </Modal.Content>
        </Modal.Root>
        <List.Root
          className="flex flex-1 flex-col gap-2 p-4"
          ref={autoAnimateRef}
        >
          {!tracksMap.size && (
            <List.NotItem>
              <ErrorMessages errors={f0rm.errors.tracks().errors()} />
            </List.NotItem>
          )}
          {[...tracksMap].map(([_, track], index) => (
            <List.Item
              key={track.id}
              className="outline-none focus:ring-1 focus:ring-white/20"
              onKeyUp={({ code }) => code === "Enter" && playTrack(track)}
            >
              {({ selected }) => (
                <>
                  <input
                    form="create-playlist"
                    type="hidden"
                    value={track.id}
                    name={f0rm.fields.tracks(index).id().name()}
                  />
                  <TrackBanner
                    track={track}
                    onRemove={handleRemoveTrack}
                    onPlay={playTrack}
                    playing={
                      Boolean(currentTrack) &&
                      currentTrack?.id === track.id &&
                      playing
                    }
                    selected={selected}
                  />
                </>
              )}
            </List.Item>
          ))}
        </List.Root>
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
