import { ErrorMessages } from "@components/elements/error";
import { List } from "@components/elements/list";
import { Modal, ModalRef } from "@components/elements/modal";
import { AuthGuardAdmin } from "@components/layout/auth";
import { GetLayoutThrough } from "@components/layout/layout";
import { TrackBanner } from "@components/player/track-banner";
import { TrackPlayer, usePlayer } from "@components/player/track-player";
import { AlbumInput, useMergeAlbum } from "@components/playlist/albums-picture";
import {
  createSchema,
  useAdminCreate,
} from "@components/playlist/playlist-form";
import { SearchPlaylistContainer } from "@components/playlist/search-container";
import { Track } from "@components/playlist/types";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { spotify } from "@hooks/api/useTrackApi";
import { useCountCallback } from "@hooks/helpers/useCountCallback";
import { useMap } from "@hooks/helpers/useMap";
import { useForm } from "@marienilba/react-zod-form";
import { api } from "@utils/api";
import { Noop } from "helpers/noop";
import { NextPageWithAuth, NextPageWithLayout, NextPageWithTitle } from "next";
import { useRouter } from "next/router";
import { useRef } from "react";

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

  const { refetch: mutate, data: tracks } = spotify.getPlaylistTracks();

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

  const { submitPreventDefault, isSubmitting, isLoading, isSuccess } =
    useAdminCreate({
      tracksMap,
      mockAlbum: mockAlbumsPicture,
      fetchMockAlbum: fetchMergeAlbum,
    });

  const f0rm = useForm(createSchema, submitPreventDefault);

  const [autoAnimateRef] = useAutoAnimate();

  return (
    <div className="scrollbar-hide flex flex-1 flex-row gap-2">
      <SearchPlaylistContainer onClick={getPlaylistTrack} />
      <div className="scrollbar-hide flex h-screen flex-1 flex-col gap-2 overflow-y-auto pb-24">
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
        <div className="sticky top-0 z-10 flex flex-col gap-2 bg-black/10 py-2 pt-20 backdrop-blur-sm ">
          <div className="px-4 pb-2">
            <button
              disabled={isSubmitting || isLoading || isSuccess}
              type="submit"
              form="create-playlist"
              className="w-full rounded-full bg-white px-6 py-1 text-lg font-semibold text-black no-underline transition-transform hover:scale-105 disabled:opacity-75"
            >
              Créer
            </button>
          </div>
          <div className="relative flex flex-grow items-center justify-center gap-4">
            <AlbumInput
              form="create-playlist"
              name={f0rm.fields.image().name()}
              mockAlbumsPicture={mockAlbumsPicture}
            />
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
  NextPageWithTitle &
  NextPageWithAuth = () => {
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
PlaylistCreateWrapper.auth = AuthGuardAdmin;
