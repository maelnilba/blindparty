import { Picture } from "@components/images/picture";
import { Player } from "pages/party/phone/[id]";

type PlayerTileProps = {
  player: Player;
  connected: boolean;
  joined: boolean;
};
export const PlayerTile = ({ player, joined, connected }: PlayerTileProps) => {
  return (
    <div
      title={player.name ?? ""}
      className={`${!joined && "opacity-50"} ${!connected && "blur-sm"}`}
    >
      <Picture identifier={player.image} className="shrink-0">
        <img
          alt={`playlist picture of ${player.name}`}
          src={player.image!}
          className="aspect-square h-12 w-12 rounded border-gray-800 object-cover"
        />
      </Picture>
    </div>
  );
};
