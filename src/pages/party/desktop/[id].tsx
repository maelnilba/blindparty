import { Divider } from "@components/elements/divider";
import { Url } from "@components/elements/url";
import { TrackPlayer, TrackPlayerRef } from "@components/game/track-player";
import { DesktopIcon } from "@components/icons/desktop";
import { PhoneIcon } from "@components/icons/phone";
import { Picture } from "@components/images/picture";
import { ConfirmationModal } from "@components/modals/confirmation-modal";
import Navigation from "@components/navigation";
import { PlaylistCard } from "@components/playlist/playlist-card";
import { useWindowLocation } from "@hooks/useWindowLocation";
import type { PartyStatus } from "@prisma/client";
import { RouterOutputs } from "@utils/api";
import { getQuery, getUA } from "@utils/next-router";
import { prpc } from "@utils/prpc";
import type {
  GetServerSidePropsContext,
  InferGetServerSidePropsType,
  NextPage,
} from "next";
import { userAgentFromString } from "next/server";
import { useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { getServerAuthSession } from "server/auth";
import { prisma } from "server/db";

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const id = getQuery(context.query.id);
  if (!id) {
    return {
      redirect: {
        destination: "/dashboard",
        permanent: false,
      },
    };
  }

  const session = await getServerAuthSession({
    req: context.req,
    res: context.res,
  });

  if (!session || !session.user) {
    return {
      redirect: {
        destination: "/dashboard",
        permanent: false,
      },
    };
  }

  const party = await prisma.party.findUnique({
    where: {
      id: id,
    },
    include: {
      host: true,
      inviteds: true,
      players: {
        include: {
          user: true,
        },
      },
      link: {
        select: {
          url: true,
        },
      },
      playlist: {
        include: {
          _count: true,
          tracks: {
            take: 10,
            include: {
              album: {
                include: {
                  images: true,
                },
              },
              artists: true,
            },
          },
        },
      },
    },
  });

  if (
    !party ||
    !party.inviteds.map((invited) => invited.id).includes(session.user.id) ||
    (party.status !== "PENDING" &&
      !party.players.map((player) => player.userId).includes(session.user.id))
  ) {
    return {
      redirect: {
        destination: "/dashboard",
        permanent: false,
      },
    };
  }

  const user_agent = userAgentFromString(context.req.headers["user-agent"]);

  if (!getUA(user_agent).isDesktop()) {
    return {
      redirect: {
        destination: "/party/phone/" + id,
        permanent: false,
      },
    };
  }

  return {
    props: {
      party: party,
      isHost: party.host.id === session.user.id,
    },
  };
}

const Party: NextPage<
  InferGetServerSidePropsType<typeof getServerSideProps>
> = ({ party, isHost }) => {
  const [joineds, setJoineds] = useState<Set<string>>(new Set());
  const [game, setGame] = useState<PartyStatus>(party.status);
  const [track, setTrack] = useState<
    RouterOutputs["party"]["game"]["round"] | null
  >(null);
  const [tracks, setTracks] = useState<string[]>([]);

  const audio = useRef<TrackPlayerRef | null>(null);

  const { send, bind, members } = prpc.game.useConnect(
    party.id,
    {
      subscribeOnMount: true,
      userDataOnAuth: {
        isHost: isHost,
      },
    },
    () => {
      bind("join", ({ joined, user }) => {
        setJoineds((joineds) => {
          if (joined) {
            joineds.add(user.info.id);
          } else {
            joineds.delete(user.info.id);
          }
          return new Set(joineds);
        });
      });
    }
  );

  const location = useWindowLocation();
  const players = useMemo<
    { player: Player; joined: boolean; connected: boolean }[]
  >(() => {
    return party.inviteds.map((invited) => ({
      player: invited,
      joined: party.players
        .map((player) => player.user.id)
        .concat([...joineds])
        .find((id) => id === invited.id)
        ? true
        : false,
      connected: members
        ? [...Object.values(members)].find((user) => user.id === invited.id)
          ? true
          : false
        : false,
    }));
  }, [party, members, joineds]);

  const missed = useMemo(() => {
    return !party.inviteds
      .map((invited) => ({
        joined: party.players.find((player) => player.user.id === invited.id)
          ? true
          : false,
      }))
      .every((player) => player.joined);
  }, [party]);

  const start = () => {
    send("start", undefined, ({ error, result }) => {
      if (!error && result?.running) {
        setGame("RUNNING");
        round();
      }
    });
  };

  const round = () => {
    send("round", { tracks: tracks }, ({ result, error }) => {
      if (error || !result || !result.track) {
        return;
      }

      setTracks((tracks) => [...tracks, result.track.id]);
      setTrack(result);
    });
  };

  useEffect(() => {
    if (track) {
      if (audio.current) {
        audio.current.start();
      }
    }
  }, [track]);

  return (
    <div className="min-h-screen w-screen">
      <Navigation />
      <div className="flex items-center justify-center gap-4 p-4">
        {game === "PENDING" && (
          <>
            <div className="scrollbar-hide relative flex h-[40rem] w-96 flex-col overflow-y-auto rounded border border-gray-800 ">
              <div className="sticky top-0 flex flex-row items-center justify-end gap-2 bg-black/10 p-6 font-semibold backdrop-blur-sm">
                <div className="w-full rounded-full px-6 py-1 text-center text-lg font-semibold no-underline ring-2 ring-white ring-opacity-5">
                  Déroulement d'une partie
                </div>
              </div>
              <div className="flex flex-1 flex-col gap-6 p-4">
                <p>
                  Lors du déroulement d'une partie, votre écran joue le rôle
                  d'émetteur et votre télèphone joue le rôle de recepteur
                </p>
                <div>
                  <div className="float-left px-2">
                    <DesktopIcon className="mt-4 h-6 w-6" />
                  </div>
                  <p>
                    L'écran jouera la rôle du blindtest. Si la connection avec
                    l'écran est interrompue, la partie sera terminée
                  </p>
                </div>
                <div>
                  <div className="float-left px-2">
                    <PhoneIcon className="mt-4 h-6 w-6" />
                  </div>
                  <p>
                    Les télèphones joueront le rôle de microphone. Il faut dire
                    à haute voix le nom de la musique, l'album ou de l'artiste
                    (selon les règles de la partie) afin de remporter le round
                  </p>
                </div>
                <Divider />
                <div>
                  <p>
                    Accèder à la page
                    {location && (
                      <Url>{`${location?.host}/p/${party.link.url}`}</Url>
                    )}
                    sur vos télèphones pour rejoindre la partie
                  </p>
                </div>
              </div>
            </div>

            <div className="scrollbar-hide relative flex h-[40rem] w-96 flex-col overflow-y-auto rounded border border-gray-800 ">
              <div className="sticky top-0 flex flex-row items-center justify-end gap-2 bg-black/10 p-6 font-semibold backdrop-blur-sm">
                {isHost ? (
                  <>
                    {missed ? (
                      <ConfirmationModal
                        title="Commencer la partie"
                        message="Certains amis invités n'ont pas encore rejoint la partie, êtes vous sur de vouloir commencer la partie ? Une fois une partie lancée, il n'est plus possible de la rejoindre."
                        action="Commencer"
                        className="w-full"
                        onSuccess={() => {
                          start();
                        }}
                      >
                        <button className="w-full rounded-full bg-white px-6 py-1 text-center text-lg font-semibold text-black no-underline transition-transform hover:scale-105">
                          Commencer la partie
                        </button>
                      </ConfirmationModal>
                    ) : (
                      <button
                        onClick={() => start()}
                        className="w-full rounded-full bg-white px-6 py-1 text-center text-lg font-semibold text-black no-underline transition-transform hover:scale-105"
                      >
                        Commencer la partie
                      </button>
                    )}
                  </>
                ) : (
                  <button className="w-full rounded-full bg-white px-6 py-1 text-center text-lg font-semibold text-black no-underline transition-transform hover:scale-105">
                    Rejoindre la partie
                  </button>
                )}
              </div>
              <div className="flex flex-1 flex-col gap-6 p-2">
                <Divider />
                <div>
                  <PlaylistCard playlist={party.playlist} />
                </div>
                <Divider />
                <div className="text-center text-lg font-semibold">
                  <p>{party.max_round} rounds</p>
                </div>
                <Divider />
                <div className="flex flex-wrap gap-2">
                  {players.map(({ player, joined }) => (
                    <PlayerCard
                      key={player.id}
                      player={player}
                      joined={joined}
                    />
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
        {game === "RUNNING" && (
          <>
            {track?.track && (
              <TrackPlayer
                key={track.track.id}
                ref={audio}
                track={track.track}
                embed={track.embed}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

type Player =
  | InferGetServerSidePropsType<
      typeof getServerSideProps
    >["party"]["inviteds"][number];
type PlayerCardProps = {
  player: Player;
  joined: boolean;
};
const PlayerCard = ({ player, joined }: PlayerCardProps) => {
  return (
    <div className={`${!joined && "opacity-80"}`}>
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

const PartyWrapper: NextPage<
  InferGetServerSidePropsType<typeof getServerSideProps>
> = ({ party, isHost }) => {
  return (
    <prpc.withPRPC {...prpc.context}>
      <Party party={party} isHost={isHost} />
    </prpc.withPRPC>
  );
};
export default PartyWrapper;
