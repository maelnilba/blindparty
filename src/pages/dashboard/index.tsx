import { FriendBanner } from "@components/friend/friend-banner";
import { AuthGuardUser } from "@components/layout/auth";
import { PartyBanner } from "@components/party/party-banner";
import { PlaylistBanner } from "@components/playlist/playlist-banner";
import { api } from "@utils/api";
import type { NextPageWithAuth, NextPageWithTitle } from "next";
import Link from "next/link";

const DashBoard: NextPageWithAuth & NextPageWithTitle = () => {
  const { data: playlists } = api.playlist.get_all.useQuery();
  const { data: friends } = api.friend.get_all.useQuery();
  const { data: partys } = api.party.get_all_invite.useQuery();
  return (
    <div className="scrollbar-hide flex flex-1 gap-4 p-4">
      <div className="scrollbar-hide relative flex max-h-contain flex-1 flex-col overflow-y-auto rounded border border-gray-800 ">
        <div className="sticky top-0 mb-2 flex flex-col items-center justify-end gap-2 bg-black/10 p-6 pb-10 font-semibold backdrop-blur-sm">
          <Link
            href="/dashboard/party"
            className="w-full rounded-full bg-white px-6 py-1 text-center text-lg font-semibold text-black no-underline transition-transform hover:scale-105"
          >
            Voir mes parties
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
            <PartyBanner key={party.id} party={party} />
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
            <PlaylistBanner key={playlist.id} playlist={playlist} />
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
            <FriendBanner key={friend.id} friend={friend} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashBoard;

DashBoard.auth = AuthGuardUser;
DashBoard.title = "Dashboard";
