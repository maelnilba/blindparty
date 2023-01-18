import { Friend, FriendCard } from "@components/friend/friend-card";
import { InputFade } from "@components/elements/input-fade";
import { Picture } from "@components/images/picture";
import Navigation from "@components/navigation";
import { Playlist, PlaylistCard } from "@components/playlist/playlist-card";
import { api } from "@utils/api";
import type { NextPage } from "next";
import { useRouter } from "next/router";
import { useRef, useState } from "react";

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
  const roundRef = useRef<HTMLSelectElement | null>(null);

  const { mutate: create } = api.party.create.useMutation({
    onSuccess: (data) => {
      router.push(`/party/${data.id}`);
    },
  });
  const createParty = () => {
    if (!roundRef.current || !playlist || !friends.size) {
      return;
    }

    create({
      max_round: parseInt(roundRef.current.value, 10) ?? 20,
      playlist_id: playlist.id,
      inviteds: [...friends]
        .map(([_, friend]) => friend.friendId!)
        .filter((id) => id),
    });
  };

  return (
    <div className="min-h-screen w-screen">
      <Navigation />
      <div className="flex flex-row gap-2 p-4">
        <div className="scrollbar-hide relative flex h-[40rem] flex-1 flex-col overflow-y-auto rounded border border-gray-800 ">
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
                <div className="cursor-pointer">
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
        <div className="scrollbar-hide relative flex h-[40rem] flex-1 flex-col overflow-y-auto rounded border border-gray-800 ">
          <div className="sticky top-0 flex flex-row items-center justify-end gap-2 bg-black/10 p-6 font-semibold backdrop-blur-sm">
            <InputFade
              onChange={(e) =>
                setFriendField(e.target.value.toLocaleLowerCase())
              }
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
                  className="cursor-pointer"
                  onClick={() => handleFriends(friend)}
                >
                  <FriendCard key={friend.id} friend={friend} />
                </div>
              ))}
          </div>
        </div>
        <div className="scrollbar-hide relative flex h-[40rem] flex-1 flex-col overflow-y-auto rounded border border-gray-800 ">
          <div className="sticky top-0 flex flex-row items-center justify-end gap-2 bg-black/10 p-6 font-semibold backdrop-blur-sm">
            <button
              onClick={() => createParty()}
              className="w-full rounded-full bg-white px-6 py-1 text-center text-lg font-semibold text-black no-underline transition-transform hover:scale-105"
            >
              Créer la partie
            </button>
          </div>
          <div className="flex flex-1 flex-col gap-10 p-4">
            <div className="flex h-20 flex-col gap-2">
              <label className="font-semibold">Playlist</label>
              {playlist && (
                <PlaylistCard key={playlist.id} playlist={playlist} canShow />
              )}
            </div>
            <div className="flex min-h-[5rem] flex-col gap-2">
              <label className="font-semibold">Amis</label>
              <div className="flex flex-wrap gap-2">
                {[...friends].map(([_, friend]) => (
                  <Picture key={friend.id} identifier={friend.image}>
                    <img
                      alt={`playlist picture of ${friend.name}`}
                      src={friend.image!}
                      className="h-12 w-12 rounded-sm border-gray-800"
                    />
                  </Picture>
                ))}
              </div>
            </div>
            <div className="flex min-h-[5rem] flex-col gap-2">
              <label htmlFor="rounds" className="font-semibold">
                Nombre de round
              </label>
              <select
                ref={roundRef}
                id="rounds"
                defaultValue={20}
                className="block w-full rounded-lg border border-gray-800 bg-black p-2.5 text-sm text-white outline-none"
              >
                {Array(10)
                  .fill(null)
                  .map((_, idx) => (
                    <option value={(idx + 1) * 10}>{(idx + 1) * 10}</option>
                  ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default PartyCreate;
