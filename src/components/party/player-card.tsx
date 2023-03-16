import { Picture } from "@components/images/picture";
import { Player } from "pages/party/phone/[id]";

type PlayerCardProps = {
  player: Player;
  connected: boolean;
  joined: boolean;
};
export const PlayerCard = ({ player, joined, connected }: PlayerCardProps) => {
  return (
    <div className={`${!joined && "opacity-50"} ${!connected && "blur-sm"}`}>
      <Picture identifier={player.image}>
        <img
          alt={`playlist picture of ${player.name}`}
          src={player.image!}
          className="h-12 w-12 rounded-sm border-gray-800"
        />
      </Picture>
    </div>
  );
};
