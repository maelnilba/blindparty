import { FriendCard } from "@components/friend/friend-card";
import { PartyCard } from "@components/party/party-card";
import { PlaylistCard } from "@components/playlist/playlist-card";
import { api } from "@utils/api";
import Link from "next/link";
import type { NextPage } from "next/types";

const DashBoard: NextPage = () => {
  const { data: playlists } = api.playlist.get_all.useQuery();
  const { data: friends } = api.friend.get_all.useQuery();
  const { data: partys } = api.party.get_all_invite.useQuery();
  return (
    <div className="scrollbar-hide flex flex-1 gap-4 p-4">
      <div className="scrollbar-hide relative flex max-h-contain flex-1 flex-col overflow-y-auto rounded border border-gray-800 ">
        <div className="sticky top-0 mb-2 flex flex-col items-center justify-end gap-2 bg-black/10 p-6 pb-10 font-semibold backdrop-blur-sm">
          <Link
            href="/dashboard/party/create"
            className="w-full rounded-full bg-white px-6 py-1 text-center text-lg font-semibold text-black no-underline transition-transform hover:scale-105"
          >
            Voir les parties
          </Link>
          <Link
            href="/dashboard/party/create"
            className="w-full rounded-full bg-white px-6 py-1 text-center text-lg font-semibold text-black no-underline transition-transform hover:scale-105"
          >
            Créer une partie
          </Link>
        </div>
        <div className="flex flex-1 flex-col gap-1 p-2">
          {partys?.map((party) => (
            <PartyCard key={party.id} party={party} />
          ))}
        </div>
      </div>
      <div className="scrollbar-hide relative flex max-h-contain flex-1 flex-col overflow-y-auto rounded border border-gray-800 ">
        <div className="sticky top-0 flex flex-row items-center justify-end gap-2 bg-black/10 p-6 font-semibold backdrop-blur-sm">
          <Link
            href="/dashboard/playlist"
            className="w-full rounded-full bg-white px-6 py-1 text-center text-lg font-semibold text-black no-underline transition-transform hover:scale-105"
          >
            Voir mes playlist
          </Link>
        </div>
        <div className="flex flex-1 flex-col gap-1 p-2">
          {playlists?.map((playlist) => (
            <PlaylistCard key={playlist.id} playlist={playlist} />
          ))}
        </div>
      </div>
      <div className="scrollbar-hide relative flex max-h-contain flex-1 flex-col overflow-y-auto rounded border border-gray-800 ">
        <div className="sticky top-0 flex flex-row items-center justify-end gap-2 bg-black/10 p-6 font-semibold backdrop-blur-sm">
          <Link
            href="/dashboard/friends"
            className="w-full rounded-full bg-white px-6 py-1 text-center text-lg font-semibold text-black no-underline transition-transform hover:scale-105"
          >
            Voir mes amis
          </Link>
        </div>
        <div className="flex flex-1 flex-col gap-1 p-2">
          {friends?.map((friend) => (
            <FriendCard key={friend.id} friend={friend} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashBoard;
