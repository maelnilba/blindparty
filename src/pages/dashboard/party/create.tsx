import { ErrorMessages } from "@components/elements/error";
import { InputFade } from "@components/elements/input-fade";
import { Friend, FriendBanner } from "@components/friend/friend-banner";
import { Picture } from "@components/images/picture";
import { AuthGuardUser } from "@components/layout/auth";
import { Playlist, PlaylistBanner } from "@components/party/playlist-banner";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { Tab } from "@headlessui/react";
import { useSubmit } from "@hooks/form/useSubmit";
import { useMap } from "@hooks/helpers/useMap";
import { useForm } from "@marienilba/react-zod-form";
import { api } from "@utils/api";
import type { NextPageWithAuth, NextPageWithTitle } from "next";
import { useRouter } from "next/router";
import { useRef, useState } from "react";
import { z } from "zod";

const createSchema = z
  .object({
    playlists: z
      .array(
        z.object({
          id: z.string(),
          tracks: z.coerce.number(),
        })
      )
      .optional()
      .default([]),
    mode: z.coerce
      .number()
      .min(0)
      .max(1)
      .transform((val) => {
        return val === 0 ? "SELECTION" : "RANDOM";
      }),
    access: z.coerce
      .number()
      .min(0)
      .max(1)
      .transform((val) => !val),
    friends: z
      .array(
        z.object({
          id: z.string(),
        })
      )
      .optional()
      .default([]),
    round: z.coerce.number().min(1).max(100),
  })
  .superRefine(({ mode, playlists, round, access, friends }, ctx) => {
    if (mode === "SELECTION" && !playlists.length)
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Une partie non aléatoire a besoin d'une playlist.",
        path: ["playlists"],
      });
    if (
      mode === "SELECTION" &&
      playlists
        .map((playlist) => playlist.tracks)
        .reduce((acc, cur) => acc + cur, 0) < round
    )
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Le nombre de tracks doit être supérieur ou égal au nombre de tour.",
        path: ["round"],
      });
    if (access && !friends.length)
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Une partie privée a besoin d'une invitation mimimun.",
        path: ["friends"],
      });
  });

const PartyCreate: NextPageWithAuth & NextPageWithTitle = () => {
  const router = useRouter();
  const { data: playlists } = api.playlist.get_all.useQuery();
  const { data: allfriends } = api.friend.get_all.useQuery();

  const {
    map: selectedsPlaylist,
    toggle: toggleSelectedPlaylist,
    remove: removeSelectedPlaylist,
  } = useMap<Playlist>();

  const {
    map: friends,
    remove: removeFriends,
    toggle: toggleFriends,
  } = useMap<Friend>();

  const [playlistField, setPlaylistField] = useState<string | undefined>();
  const [friendField, setFriendField] = useState<string | undefined>();

  const {
    mutateAsync: create,
    isLoading,
    isSuccess,
  } = api.party.create.useMutation({
    onSuccess: (data) => {
      router.push(`/party/${data.id}`);
    },
  });

  const form = useRef<HTMLFormElement>(null);
  const { submitPreventDefault, isSubmitting } = useSubmit<typeof createSchema>(
    async (e) => {
      if (!e.success) return;
      if (!playlists) return;

      let playlist: Playlist | undefined;
      if (e.data.mode === "RANDOM") {
        playlist = playlists[Math.floor(Math.random() * playlists.length)];
      }

      if (e.data.access && !friends.size) return;

      await create({
        maxRoud: e.data.round,
        private: e.data.access,
        playlists_id: playlist
          ? [playlist.id]
          : e.data.playlists.map(({ id }) => id),
        inviteds: e.data.friends.map(({ id }) => id),
      });
    }
  );

  const f0rm = useForm(createSchema, submitPreventDefault);

  const [autoAnimatePlaylistRef] = useAutoAnimate();
  const [autoAnimateFriendRef] = useAutoAnimate();

  return (
    <div className="scrollbar-hide flex flex-1 flex-row gap-2 p-4">
      <div className="scrollbar-hide relative flex max-h-contain flex-1 flex-col overflow-y-auto rounded border border-gray-800">
        <div className="sticky top-0 flex flex-row items-center justify-end gap-2 bg-black/10 p-6 font-semibold backdrop-blur-sm">
          <InputFade
            onChange={(e) =>
              setPlaylistField(e.target.value.toLocaleLowerCase())
            }
          >
            Mes playlists
          </InputFade>
        </div>
        <div className="flex-1 p-2">
          {playlists
            ?.filter((playlist) =>
              playlistField
                ? playlist.name.toLocaleLowerCase().includes(playlistField)
                : true
            )
            .map((playlist) => (
              <div key={playlist.id} className="cursor-pointer">
                <PlaylistBanner
                  key={playlist.id}
                  playlist={playlist}
                  onClick={toggleSelectedPlaylist}
                  canShow
                />
              </div>
            ))}
        </div>
      </div>
      <div className="scrollbar-hide relative flex max-h-contain flex-1 flex-col overflow-y-auto rounded border border-gray-800 ">
        <div className="sticky top-0 flex flex-row items-center justify-end gap-2 bg-black/10 p-6 font-semibold backdrop-blur-sm">
          <InputFade
            onChange={(e) => setFriendField(e.target.value.toLocaleLowerCase())}
          >
            Mes amis
          </InputFade>
        </div>
        <div className="flex-1 p-2">
          {allfriends
            ?.filter((friend) =>
              friendField
                ? !!friend.name?.toLocaleLowerCase().includes(friendField)
                : true
            )
            .map((friend) => (
              <div
                key={friend.id}
                className="cursor-pointer"
                onClick={() => toggleFriends(friend)}
              >
                <FriendBanner key={friend.id} friend={friend} />
              </div>
            ))}
        </div>
      </div>
      <form
        ref={form}
        onSubmit={f0rm.form.submit}
        className="scrollbar-hide relative flex max-h-contain flex-1 flex-col overflow-y-auto rounded border border-gray-800 "
      >
        <div className="sticky top-0 flex flex-row items-center justify-end gap-2 bg-black/10 p-6 font-semibold backdrop-blur-sm">
          <button
            disabled={isSubmitting || isLoading || isSuccess}
            type="submit"
            className="w-full rounded-full bg-white px-6 py-1 text-center text-lg font-semibold text-black no-underline transition-transform hover:scale-105 disabled:opacity-75"
          >
            Créer la partie
          </button>
        </div>
        <div className="flex flex-1 flex-col gap-10">
          <div className="">
            <div className="scrollbar-hide relative flex flex-1 flex-col overflow-y-auto">
              <Tab.Group defaultIndex={0}>
                <Tab.List className="absolute top-0 z-10 flex w-full gap-2 bg-black/10 px-6 py-2 backdrop-blur-sm">
                  {({ selectedIndex }) => (
                    <div className="flex flex-1 justify-evenly gap-2 rounded-full ring-2 ring-white ring-opacity-5">
                      <input
                        name={f0rm.fields.access().name()}
                        type="hidden"
                        value={selectedIndex}
                      />
                      <Tab
                        className={({ selected }) =>
                          `flex-1 rounded-full px-6 py-1 text-lg font-semibold no-underline transition-all duration-300 focus:outline-none ${
                            selected
                              ? " bg-white text-black hover:scale-105"
                              : "text-white"
                          }`
                        }
                      >
                        Privée
                      </Tab>
                      <Tab
                        className={({ selected }) =>
                          `flex-1 rounded-full px-6 py-1 text-lg font-semibold no-underline transition-all duration-300 focus:outline-none ${
                            selected
                              ? " bg-white text-black hover:scale-105"
                              : "text-white"
                          }`
                        }
                      >
                        Publique
                      </Tab>
                    </div>
                  )}
                </Tab.List>
                <Tab.Panels className="overflow-auto pt-12">
                  <Tab.Panel
                    static
                    className="hidden h-20 w-full flex-wrap gap-2 px-6 pt-2 data-[headlessui-state=selected]:flex"
                    ref={autoAnimateFriendRef}
                  >
                    <div className="-my-2 flex h-fit w-full flex-col">
                      <ErrorMessages errors={f0rm.errors.friends().errors()} />
                    </div>
                    {[...friends].map(([_, friend], index) => (
                      <div
                        key={friend.id}
                        className="cursor-pointer hover:scale-105"
                        onClick={() => {
                          removeFriends(friend);
                        }}
                      >
                        <input
                          name={f0rm.fields.friends(index).id().name()}
                          type="hidden"
                          value={friend.friendId}
                        />
                        <Picture identifier={friend.image} className="shrink-0">
                          <img
                            alt={`playlist picture of ${friend.name}`}
                            src={friend.image!}
                            className="h-12 w-12 rounded border-gray-800 object-cover"
                          />
                        </Picture>
                      </div>
                    ))}
                  </Tab.Panel>
                  <Tab.Panel className="flex h-full w-full flex-col justify-start px-4"></Tab.Panel>
                </Tab.Panels>
              </Tab.Group>
            </div>
            <div className="scrollbar-hide relative flex flex-1 flex-col overflow-y-auto">
              <Tab.Group defaultIndex={0}>
                <Tab.List className="absolute top-0 z-10 flex w-full gap-2 bg-black/10 px-6 py-2 backdrop-blur-sm">
                  {({ selectedIndex }) => (
                    <div className="flex flex-1 justify-evenly gap-2 rounded-full ring-2 ring-white ring-opacity-5">
                      <input
                        name={f0rm.fields.mode().name()}
                        type="hidden"
                        value={selectedIndex}
                      />
                      <Tab
                        className={({ selected }) =>
                          `flex-1 rounded-full px-6 py-1 text-lg font-semibold no-underline transition-all duration-300 focus:outline-none ${
                            selected
                              ? " bg-white text-black hover:scale-105"
                              : "text-white"
                          }`
                        }
                      >
                        Sélection
                      </Tab>
                      <Tab
                        className={({ selected }) =>
                          `flex-1 rounded-full px-6 py-1 text-lg font-semibold no-underline transition-all duration-300 focus:outline-none ${
                            selected
                              ? " bg-white text-black hover:scale-105"
                              : "text-white"
                          }`
                        }
                      >
                        Aléatoire
                      </Tab>
                    </div>
                  )}
                </Tab.List>
                <Tab.Panels className="overflow-auto pt-12">
                  <Tab.Panel
                    static
                    className="hidden h-44 w-full flex-col justify-start px-4 pt-2 data-[headlessui-state=selected]:flex"
                    ref={autoAnimatePlaylistRef}
                  >
                    <ErrorMessages errors={f0rm.errors.playlists().errors()} />
                    {[...selectedsPlaylist.values()].map((playlist, index) => (
                      <div key={playlist.id} className="cursor-pointer">
                        <input
                          type="hidden"
                          name={f0rm.fields.playlists(index).id().name()}
                          value={playlist.id}
                        />
                        <input
                          type="hidden"
                          name={f0rm.fields.playlists(index).tracks().name()}
                          value={playlist.tracks.length}
                        />
                        <PlaylistBanner
                          playlist={playlist}
                          canShow
                          onClick={removeSelectedPlaylist}
                        />
                      </div>
                    ))}
                  </Tab.Panel>
                  <Tab.Panel className="flex h-full w-full flex-col justify-start px-4"></Tab.Panel>
                </Tab.Panels>
              </Tab.Group>
            </div>
          </div>
          <div className="p-4">
            <div className="flex flex-1 flex-col gap-2">
              <div className="flex-1">
                <label
                  htmlFor={f0rm.fields.round().name()}
                  className="font-semibold"
                >
                  Nombre de round
                </label>
                <select
                  id={f0rm.fields.round().name()}
                  name={f0rm.fields.round().name()}
                  data-error={!!f0rm.errors.round().errors()?.length}
                  className="block w-full rounded-lg border border-gray-800 bg-black p-2.5 text-sm text-white focus:border-gray-500 focus:outline-none focus:ring-gray-500 data-[error=true]:border-red-500"
                >
                  {Array(10)
                    .fill(null)
                    .map((_, idx) => (
                      <option key={idx} value={(idx + 1) * 10}>
                        {(idx + 1) * 10}
                      </option>
                    ))}
                </select>
                <ErrorMessages errors={f0rm.errors.round().errors()} />
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default PartyCreate;
PartyCreate.auth = AuthGuardUser;
PartyCreate.title = "Party | Create";
