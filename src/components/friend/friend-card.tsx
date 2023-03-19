import { UserMinusIcon } from "@components/icons/user-minus";
import { Picture } from "@components/images/picture";
import { RouterOutputs } from "@utils/api";

export type Friend = RouterOutputs["friend"]["get_all"][number];
type FriendCardProps = {
  friend: Friend;
  onRemove?: (friend: Friend) => void;
};
export const FriendCard = ({ friend, onRemove }: FriendCardProps) => {
  return (
    <div className="group flex items-center justify-center gap-4 p-2 font-bold ring-2 ring-white ring-opacity-5">
      <Picture identifier={friend.image}>
        <img
          alt={`user picture of ${friend.name}`}
          src={friend.image!}
          className="h-12 w-12 rounded-sm border-gray-800 object-cover group-hover:scale-105"
        />
      </Picture>
      <div className="inline-block w-3/4">
        <span className="block overflow-hidden truncate text-ellipsis">
          {friend.name}
        </span>
      </div>
      {onRemove && (
        <UserMinusIcon
          onClick={() => onRemove(friend)}
          className="h-6 w-6 cursor-pointer group-hover:scale-125"
        />
      )}
    </div>
  );
};
