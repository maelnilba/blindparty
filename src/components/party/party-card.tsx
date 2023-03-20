import { ClockIcon } from "@components/icons/clock";
import { SendIcon } from "@components/icons/send";
import { Picture } from "@components/images/picture";
import { useRelativeTime } from "@hooks/useRelativeTime";
import { RouterOutputs } from "@utils/api";
import Link from "next/link";

type PartyCardProps = {
  party: RouterOutputs["party"]["get_all_invite"][number];
};
export const PartyCard = ({ party }: PartyCardProps) => {
  const relativeUpdate = useRelativeTime(party.updatedAt, { refresh: true });
  return (
    <div className="flex items-center gap-4 p-2 font-bold ring-2 ring-white ring-opacity-5">
      <Picture identifier={party.host.image}>
        <img
          alt={`host picture of ${party.host.name}`}
          src={party.host.image!}
          className="h-12 w-12 rounded border-gray-800 object-cover"
        />
      </Picture>
      <div className="flex w-3/4 flex-col">
        <p>{party._count.inviteds} participants</p>
        <p className="overflow-hidden truncate text-ellipsis text-xs font-normal">
          Crée par {party.host.name}
        </p>
        <div className="flex flex-row gap-2">
          <ClockIcon className="h-4 w-4" />
          <p className="text-xs font-normal">{relativeUpdate}</p>
        </div>
      </div>
      <Link href={`/party/${party.id}`}>
        <SendIcon category="solid" className="h-6 w-6 hover:scale-125" />
      </Link>
    </div>
  );
};
