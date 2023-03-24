import { InputFade } from "@components/elements/input-fade";
import { Friend, FriendCard } from "@components/friend/friend-card";
import { ExclamationIcon } from "@components/icons/exclamation";
import { Picture } from "@components/images/picture";
import { Playlist, PlaylistCard } from "@components/playlist/playlist-card";
import { Tab } from "@headlessui/react";
import { api } from "@utils/api";
import type { NextPage } from "next";
import { useRouter } from "next/router";
import { useState } from "react";

const PartyCreate: NextPage = () => {
  const router = useRouter();
  const { data: playlists } = api.playlist.get_all.useQuery();
  const { data: allfriends } = api.friend.get_all.useQuery();
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [friends, setFriends] = useState<Map<string, Friend>>(new Map());
  const handleFriends = (friend: Friend) => {
    if (friends.has(friend.id)) {
      friends.delete(friend.id);
    } else {
      friends.set(friend.id, friend);
    }

    setFriends(new Map(friends));
  };

  const [playlistField, setPlaylistField] = useState<string | undefined>();
  const [friendField, setFriendField] = useState<string | undefined>();

  const [rounds, setRounds] = useState(20);

  const { mutate: create } = api.party.create.useMutation({
    onSuccess: (data) => {
      router.push(`/party/${data.id}`);
    },
  });
  const createParty = () => {
    if (!playlist || !friends.size) {
      return;
    }

    create({
      max_round: Math.min(playlist._count.tracks, rounds),
      playlist_id: playlist.id,
      inviteds: [...friends]
        .map(([_, friend]) => friend.friendId!)
        .filter((id) => id),
    });
  };

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
                <PlaylistCard
                  key={playlist.id}
                  playlist={playlist}
                  onClick={(playlist) => setPlaylist(playlist)}
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
                onClick={() => handleFriends(friend)}
              >
                <FriendCard key={friend.id} friend={friend} />
              </div>
            ))}
        </div>
      </div>
      <div className="scrollbar-hide relative flex max-h-contain flex-1 flex-col overflow-y-auto rounded border border-gray-800 ">
        <div className="sticky top-0 flex flex-row items-center justify-end gap-2 bg-black/10 p-6 font-semibold backdrop-blur-sm">
          <button
            onClick={createParty}
            className="w-full rounded-full bg-white px-6 py-1 text-center text-lg font-semibold text-black no-underline transition-transform hover:scale-105"
          >
            Créer la partie
          </button>
        </div>
        <div className="flex flex-1 flex-col gap-10">
          <div className="">
            <div className="scrollbar-hide relative flex flex-1 flex-col overflow-y-auto">
              <Tab.Group>
                <Tab.List className="absolute top-0 flex w-full gap-2 bg-black/10 px-6 py-2 backdrop-blur-sm">
                  <div className="flex flex-1 justify-evenly gap-2 rounded-full border border-gray-800">
                    <Tab
                      className={({ selected }) =>
                        `flex-1 rounded-full py-1 px-6 text-lg font-semibold text-white no-underline transition-all duration-300 focus:outline-none ${
                          selected && " bg-white text-black hover:scale-105"
                        }`
                      }
                    >
                      Playlist
                    </Tab>
                    <Tab
                      className={({ selected }) =>
                        `flex-1 rounded-full py-1 px-6 text-lg font-semibold text-white no-underline transition-all duration-300 focus:outline-none ${
                          selected && " bg-white text-black hover:scale-105"
                        }`
                      }
                    >
                      Tracks
                    </Tab>
                  </div>
                </Tab.List>
                <Tab.Panels className="h-44 overflow-auto pt-12">
                  <Tab.Panel className="flex h-full w-full flex-col justify-start">
                    {playlist && (
                      <PlaylistCard
                        key={playlist.id}
                        playlist={playlist}
                        canShow
                      />
                    )}
                  </Tab.Panel>
                  <Tab.Panel className="">
                    {playlist && (
                      <PlaylistCard
                        key={playlist.id}
                        playlist={playlist}
                        canShow
                      />
                    )}{" "}
                    {playlist && (
                      <PlaylistCard
                        key={playlist.id}
                        playlist={playlist}
                        canShow
                      />
                    )}{" "}
                    {playlist && (
                      <PlaylistCard
                        key={playlist.id}
                        playlist={playlist}
                        canShow
                      />
                    )}{" "}
                    {playlist && (
                      <PlaylistCard
                        key={playlist.id}
                        playlist={playlist}
                        canShow
                      />
                    )}
                  </Tab.Panel>
                </Tab.Panels>
              </Tab.Group>
            </div>
          </div>
          <div className="p-4">
            <div className="flex min-h-[5rem] flex-col gap-2">
              <label className="font-semibold">Amis</label>
              <div className="flex flex-wrap gap-2">
                {[...friends].map(([_, friend]) => (
                  <Picture key={friend.id} identifier={friend.image}>
                    <img
                      alt={`playlist picture of ${friend.name}`}
                      src={friend.image!}
                      className="h-12 w-12 rounded border-gray-800 object-cover"
                    />
                  </Picture>
                ))}
              </div>
            </div>
            <div className="flex flex-1 flex-col gap-2">
              <div className="flex-1">
                <label htmlFor="rounds" className="font-semibold">
                  Nombre de round
                </label>
                <select
                  id="rounds"
                  value={rounds}
                  onChange={(e) => setRounds(Number(e.target.value))}
                  className="block w-full rounded-lg border border-gray-800 bg-black p-2.5 text-sm text-white outline-none"
                >
                  {Array(10)
                    .fill(null)
                    .map((_, idx) => (
                      <option key={idx} value={(idx + 1) * 10}>
                        {(idx + 1) * 10}
                      </option>
                    ))}
                </select>
              </div>
              {playlist && playlist._count.tracks < rounds && (
                <div>
                  <div className="float-left px-2">
                    <ExclamationIcon className="mt-4 h-6 w-6" />
                  </div>
                  <p>
                    La playlist sélectionnée contient moins de tracks que de
                    round. Le nombre de round sera de {playlist._count.tracks}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default PartyCreate;
