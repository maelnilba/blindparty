import { ConfirmationModal } from "@components/elements/confirmation-modal";
import { ClockIcon } from "@components/icons/clock";
import { Picture } from "@components/images/picture";
import { TrackBanner } from "@components/playlist/track-banner";
import { useRelativeTime } from "@hooks/helpers/useRelativeTime";
import { RouterOutputs } from "@utils/api";
import Link from "next/link";
import { useRouter } from "next/router";
import { formatPosition } from "./helpers";
import { PlayerTile } from "./player-tile";

type PartyCardProps = {
  party: RouterOutputs["party"]["get_all"][number];
  onAction?: (...args: any) => void;
};
export const PartyCard = ({ party, onAction }: PartyCardProps) => {
  const { locale } = useRouter();
  const relativeUpdate = useRelativeTime(party.updatedAt, {
    refresh: true,
    locale: locale,
  });
  return (
    <div className="scrollbar-hide relative flex h-96 w-96 flex-col overflow-y-auto rounded border border-gray-800 max-sm:h-64 ">
      <div className="sticky top-0 flex flex-row items-center justify-end gap-2 bg-black/10 px-2 py-2 font-semibold backdrop-blur-sm">
        <p className="flex flex-1 flex-col items-center">
          {party.status === "PENDING" && <span>{party.max_round} rounds</span>}
          {party.status === "RUNNING" && (
            <span>
              {Math.min(party.round, party.max_round)}/{party.max_round} rounds
            </span>
          )}
          <span>{party._count.tracks} tracks</span>
        </p>
        <p className="flex flex-col">
          {party.status === "PENDING" ||
            (party.status === "RUNNING" && (
              <>
                {party.access_mode === "PRIVATE" && (
                  <span>
                    {party.members.count}/{party._count.inviteds} joueurs
                  </span>
                )}
                {party.access_mode === "PUBLIC" && (
                  <span>{party.members.count} joueurs</span>
                )}
              </>
            ))}
          <span className="overflow-hidden truncate text-ellipsis text-xs font-normal">
            {party.status === "PENDING" && (
              <span>Crée par {party.host.name}</span>
            )}
            {party.status === "RUNNING" && <span>En cours</span>}
            {party.status === "ENDED" && <span>Terminé</span>}
            {party.status === "CANCELED" && <span>Annulé</span>}
          </span>
          <span className="flex flex-row gap-2">
            <ClockIcon className="h-4 w-4" />
            <span className="text-xs font-normal">{relativeUpdate}</span>
          </span>
        </p>
        <Picture identifier={party.host.image} className="shrink-0">
          <img
            alt={`host picture of ${party.host.name}`}
            src={party.host.image!}
            className="aspect-square h-24 w-24 rounded border-gray-800 object-cover"
          />
        </Picture>
      </div>
      <div className="flex-1 p-2">
        {party.status === "PENDING" && (
          <div className="flex flex-wrap gap-x-2.5 gap-y-2">
            {party.players.map((player) => (
              <PlayerTile key={player.id} player={player.user} />
            ))}
          </div>
        )}
        {party.status === "RUNNING" &&
          party.players
            .sort((a, b) => b.points - a.points)
            .map((player, position) => (
              <div
                key={player.id}
                className="flex items-center gap-4 p-2 font-bold ring-2 ring-white ring-opacity-5"
              >
                <PlayerTile player={player.user} />
                {formatPosition(position + 1, locale)} - {player.points} points
              </div>
            ))}
        {party.status === "CANCELED" &&
          party.tracks.map((track) => (
            <TrackBanner key={track.id} track={track} />
          ))}
      </div>
      <div className="sticky bottom-0 flex flex-row items-center justify-center gap-2 bg-black/10 px-2 py-2 font-semibold backdrop-blur-sm">
        {party.status === "PENDING" && (
          <>
            <Link
              href={`/party/${party.id}`}
              className="flex-1 rounded-full bg-white px-6 py-1 text-center text-lg font-semibold text-black no-underline transition-transform hover:scale-105"
            >
              Rejoindre
            </Link>
            <ConfirmationModal
              title={`Supprimer la partie`}
              message={`Êtes vous certain de vouloir supprimer la partie ? Cette action est irreversible.`}
              actions={["Supprimer"]}
              onSuccess={() => onAction?.({ id: party.id })}
            >
              <button className="rounded-full bg-pink-200 px-6 py-1 text-lg font-semibold text-black no-underline transition-transform hover:scale-105">
                Supprimer
              </button>
            </ConfirmationModal>
          </>
        )}
        {party.status === "CANCELED" && (
          <>
            <button
              onClick={() => onAction?.({ id: party.id })}
              className="flex-1 rounded-full bg-white px-6 py-1 text-center text-lg font-semibold text-black no-underline transition-transform hover:scale-105"
            >
              Rejouer
            </button>
            <ConfirmationModal
              title={`Supprimer la partie`}
              message={`Êtes vous certain de vouloir supprimer la partie ? Cette action est irreversible.`}
              actions={["Supprimer"]}
              onSuccess={() => onAction?.({ id: party.id })}
            >
              <button className="rounded-full bg-pink-200 px-6 py-1 text-lg font-semibold text-black no-underline transition-transform hover:scale-105">
                Supprimer
              </button>
            </ConfirmationModal>
          </>
        )}
      </div>
    </div>
  );
};
