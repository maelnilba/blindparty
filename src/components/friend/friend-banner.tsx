import { ConfirmationModal } from "@components/elements/confirmation-modal";
import { UserMinusIcon } from "@components/icons/user-minus";
import { Picture } from "@components/images/picture";
import { RouterOutputs } from "@utils/api";

export type Friend = RouterOutputs["friend"]["get_all"][number];
type FriendBannerProps = {
  friend: Friend;
  onRemove?: (friend: Friend) => void;
};
export const FriendBanner = ({ friend, onRemove }: FriendBannerProps) => {
  return (
    <div className="group flex items-center justify-center gap-4 p-2 font-bold ring-2 ring-white ring-opacity-5">
      <Picture identifier={friend.image} className="shrink-0">
        <img
          alt={`user picture of ${friend.name}`}
          src={friend.image!}
          className="h-12 w-12 rounded border-gray-800 object-cover group-hover:scale-105"
        />
      </Picture>
      <div className="inline-block w-3/4">
        <span className="block overflow-hidden truncate text-ellipsis">
          {friend.name}
        </span>
      </div>
      {onRemove && (
        <ConfirmationModal.Root>
          <ConfirmationModal.Trigger>
            <UserMinusIcon className="h-6 w-6 cursor-pointer group-hover:scale-125" />
          </ConfirmationModal.Trigger>
          <ConfirmationModal.Title className="text-lg font-medium leading-6">
            Retirer {friend.name}
          </ConfirmationModal.Title>
          <ConfirmationModal.Message>
            Êtes vous certain de vouloir retirer {friend.name} de vos amis ?
          </ConfirmationModal.Message>
          <ConfirmationModal.Action
            className="rounded-full bg-white px-6 py-1 text-center text-lg font-semibold text-black no-underline transition-transform hover:scale-105"
            onClick={() => onRemove(friend)}
          >
            Supprimer
          </ConfirmationModal.Action>
        </ConfirmationModal.Root>
      )}
    </div>
  );
};
