import { FriendBanner } from "@components/friend/friend-banner";
import { useInvitation } from "@components/friend/useInvitation";
import { EnvelopeIcon } from "@components/icons/envelope";
import { LockClosedIcon } from "@components/icons/lock-closed";
import { PlusIcon } from "@components/icons/plus";
import { UserPlusIcon } from "@components/icons/user-plus";
import { XMarkIcon } from "@components/icons/x-mark";
import { Picture } from "@components/images/picture";
import { AuthGuardUser } from "@components/layout/auth";
import { ConfirmationModal } from "@components/elements/confirmation-modal";
import { Modal } from "@components/elements/modal";
import { useDebounce } from "@hooks/helpers/useDebounce";
import { api, RouterOutputs } from "@utils/api";
import type { NextPageWithAuth, NextPageWithTitle } from "next";
import { useSession } from "next-auth/react";

const Friends: NextPageWithAuth & NextPageWithTitle = () => {
  const { data: session } = useSession();
  const { data: friends, refetch: refetch_friends } =
    api.friend.get_all.useQuery();
  const {
    data: users,
    mutate: search,
    reset: reset_users,
  } = api.friend.search.useMutation();
  const onSearch = useDebounce((field: string) => {
    search({ field: field });
  });

  const { data: invitations, refetch: refetch_invitation } =
    api.friend.get_invitations.useQuery();
  const invitationActions = useInvitation<Invitation>(refetch_invitation);

  const { mutate: send } = api.friend.sent_invitation.useMutation();
  const sendInvitation = (user: RouterOutputs["friend"]["search"][number]) => {
    send(
      { id: user.id },
      {
        onSuccess: () => {
          reset_users();
          refetch_invitation();
        },
      }
    );
  };

  const { mutate: remove } = api.friend.remove.useMutation({
    onSuccess: () => refetch_friends(),
  });

  return (
    <div className="scrollbar-hide flex flex-1 gap-4 p-4">
      <div className="scrollbar-hide relative flex max-h-contain flex-1 flex-col overflow-y-auto rounded border border-gray-800">
        <div className="sticky top-0 flex flex-row items-center justify-center gap-2 bg-black/10 p-6 font-semibold backdrop-blur-sm">
          <Modal>
            <button className="w-full rounded-full bg-white px-6 py-1 text-center text-lg font-semibold text-black no-underline transition-transform hover:scale-105">
              Rechercher des amis
            </button>
            <div className="scrollbar-hide relative flex h-96 w-96 flex-col gap-2 overflow-y-auto">
              <label htmlFor="search" className="font-semibold">
                Rechercher un utilisateur
              </label>
              <div className="sticky top-0 flex flex-col gap-2 font-semibold backdrop-blur-sm">
                <input
                  onChange={(e) => onSearch(e.target.value)}
                  id="search"
                  className="block w-full rounded-lg border border-gray-800 bg-transparent p-2.5 text-white focus:border-gray-500 focus:outline-none focus:ring-gray-500"
                />
              </div>
              <div className="flex-1">
                {users?.map((user) => (
                  <UserBanner
                    key={user.id}
                    user={user}
                    onAdd={sendInvitation}
                  />
                ))}
              </div>
            </div>
          </Modal>
        </div>
        <div className="flex-1 p-2">
          {friends?.map((friend) => (
            <FriendBanner
              key={friend.id}
              friend={friend}
              onRemove={() => remove({ id: friend.id })}
            />
          ))}
        </div>
      </div>
      <div className="scrollbar-hide relative flex max-h-contain flex-1 flex-col overflow-y-auto rounded border border-gray-800">
        <div className="sticky top-0 flex flex-row items-center justify-center gap-2 bg-black/10 p-6 font-semibold backdrop-blur-sm">
          <div className="w-full rounded-full px-6 py-1 text-center text-lg font-semibold no-underline ring-2 ring-white ring-opacity-5">
            Mes invitations
          </div>
        </div>
        <div className="flex-1 p-2">
          {session?.user && session.user.id && (
            <>
              {invitations?.map((invitation) => (
                <InvitationBanner
                  key={invitation.id}
                  invitation={invitation}
                  sessionUserId={session.user!.id}
                  onAccept={(invitation) => {
                    {
                      invitationActions({
                        type: "ACCEPT",
                        id: invitation.id,
                        cb: () => refetch_friends(),
                      });
                    }
                  }}
                  onRefresh={(invitation) =>
                    invitationActions({ type: "REFRESH", id: invitation.id })
                  }
                  onReject={(invitation) =>
                    invitationActions({ type: "REJECT", id: invitation.id })
                  }
                  onBlock={(invitation) =>
                    invitationActions({ type: "BLOCK", id: invitation.id })
                  }
                />
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

type UserBannerProps = {
  user: RouterOutputs["friend"]["search"][number];
  onAdd: (user: RouterOutputs["friend"]["search"][number]) => void;
};
const UserBanner = ({ user, onAdd }: UserBannerProps) => {
  return (
    <div className="group flex cursor-pointer items-center justify-center gap-4 p-2 font-bold ring-2 ring-white ring-opacity-5">
      <Picture identifier={user.image} className="shrink-0">
        <img
          alt={`user picture of ${user.name}`}
          src={user.image!}
          className="h-12 w-12 rounded border-gray-800 object-cover group-hover:scale-105"
        />
      </Picture>
      <div className="inline-block w-3/4">
        <span className="block overflow-hidden truncate text-ellipsis">
          {user.name}
        </span>
      </div>
      <PlusIcon
        onClick={() => onAdd(user)}
        className="h-6 w-6 group-hover:scale-125"
      />
    </div>
  );
};

type Invitation = RouterOutputs["friend"]["get_invitations"][number];
type InvitationBannerProps = {
  invitation: Invitation;
  sessionUserId: string;
  onAccept: (invitation: Invitation) => void;
  onReject: (invitation: Invitation) => void;
  onRefresh: (invitation: Invitation) => void;
  onBlock: (invitation: Invitation) => void;
};
const InvitationBanner = ({
  invitation,
  sessionUserId,
  onAccept,
  onRefresh,
  onBlock,
  onReject,
}: InvitationBannerProps) => {
  const invited = invitation.user_sent.id === sessionUserId ? false : true;
  const friendUser = invited ? invitation.user_sent : invitation.user_invite;
  return (
    <div className="group flex items-center justify-center gap-4 p-2 font-bold ring-2 ring-white ring-opacity-5">
      <Picture identifier={friendUser.image} className="shrink-0">
        <img
          alt={`user picture of ${friendUser.name}`}
          src={friendUser.image!}
          className={`h-12 w-12 rounded border-gray-800 object-cover ${
            invited && "group-hover:scale-105"
          }`}
        />
      </Picture>
      <div className="inline-block w-3/4">
        <span className="block overflow-hidden truncate text-ellipsis">
          {friendUser.name}
        </span>
      </div>
      {!invited && <EnvelopeIcon className="h-6 w-6 opacity-75" />}
      {invited && (
        <div className="flex gap-2">
          <UserPlusIcon
            onClick={() => onAccept(invitation)}
            className="h-6 w-6 cursor-pointer hover:scale-125"
          />
          <XMarkIcon
            onClick={() => onReject(invitation)}
            className="h-6 w-6 cursor-pointer hover:scale-125"
          />
          <ConfirmationModal
            title="Bloquer l'utilisateur"
            message={`Êtes vous sur de vouloir bloqué ${friendUser.name} ?`}
            actions={["Bloquer"]}
            onSuccess={() => onBlock(invitation)}
          >
            <LockClosedIcon className="h-6 w-6 cursor-pointer hover:scale-125" />
          </ConfirmationModal>
        </div>
      )}
    </div>
  );
};

export default Friends;
Friends.auth = AuthGuardUser;
Friends.title = "Friends";
