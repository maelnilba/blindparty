import { Divider } from "@components/elements/divider";
import { Picture } from "@components/images/picture";
import { Modal } from "@components/modals/modal";
import Navigation from "@components/navigation";
import { PlaylistCard } from "@components/playlist/playlist-card";
import { useMicroPermission } from "@hooks/useMicroPermission";
import type { PartyStatus } from "@prisma/client";
import { getQuery, getUA } from "@utils/next-router";
import { prpc } from "@utils/prpc";
import type {
  GetServerSidePropsContext,
  InferGetServerSidePropsType,
  NextPage,
} from "next";
import { userAgentFromString } from "next/server";
import { useMemo, useState } from "react";
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

  if (getUA(user_agent).isDesktop()) {
    return {
      redirect: {
        destination: "/party/desktop/" + id,
        permanent: false,
      },
    };
  }

  return {
    props: {
      party: party,
    },
  };
}

const Party: NextPage<
  InferGetServerSidePropsType<typeof getServerSideProps>
> = ({ party }) => {
  const [joineds, setJoineds] = useState<Set<string>>(new Set());
  const [game, setGame] = useState<PartyStatus>(party.status);

  const { send, bind, members } = prpc.game.useConnect(
    party.id,
    {
      subscribeOnMount: true,
      userDataOnAuth: {
        isHost: false,
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

      bind("start", ({ running }) => {
        if (running) {
          setGame("RUNNING");
        }
      });

      bind("round", ({ track }) => {});
    }
  );

  const micro = useMicroPermission();
  const activation = () => {
    if (typeof window === "undefined") {
      return;
    }

    window.navigator.mediaDevices.getUserMedia({ audio: true });
  };
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

  const [isJoined, setIsJoined] = useState(false);
  const join = () => {
    send("join", { joined: !isJoined });
    setIsJoined((j) => !j);
  };

  return (
    <div className="min-h-screen w-screen">
      <Navigation />
      <div className="flex items-center justify-center gap-4 p-4">
        {game === "PENDING" && (
          <>
            <div className="scrollbar-hide relative flex h-[40rem] w-96 flex-col overflow-y-auto rounded border border-gray-800 ">
              <div className="sticky top-0 flex flex-row items-center justify-end gap-2 bg-black/10 p-6 font-semibold backdrop-blur-sm">
                {!micro || micro !== "granted" ? (
                  <Modal title="Activer votre micro" className="w-full">
                    <button className="w-full rounded-full bg-white px-6 py-1 text-center text-lg font-semibold text-black no-underline transition-transform hover:scale-105">
                      Rejoindre la partie
                    </button>
                    <div className="flex flex-col gap-2">
                      <p>
                        Pour que votre télèphone joue le rôle de recepteur, la
                        permission d'accèder à votre microphone est requis
                      </p>
                      <p>
                        Si l'activation ne fonctionne pas, verifier les
                        paramètrages de votre télèphone
                      </p>
                      <button
                        onClick={() => activation()}
                        className="w-full rounded-full bg-white px-6 py-1 text-center text-lg font-semibold text-black no-underline transition-transform hover:scale-105"
                      >
                        Activer
                      </button>
                    </div>
                  </Modal>
                ) : (
                  <button
                    onClick={() => join()}
                    disabled={isJoined}
                    className={`${
                      isJoined && "opacity-50"
                    } w-full rounded-full bg-white px-6 py-1 text-center text-lg font-semibold text-black no-underline transition-transform hover:scale-105`}
                  >
                    {isJoined ? "En attente" : "Rejoindre la partie"}
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
                  {players.map(({ player, joined, connected }) => (
                    <PlayerCard
                      key={player.id}
                      connected={connected}
                      player={player}
                      joined={joined}
                    />
                  ))}
                </div>
              </div>
            </div>
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
  connected: boolean;
  joined: boolean;
};
const PlayerCard = ({ player, joined, connected }: PlayerCardProps) => {
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

const PartyWrapper: NextPage<
  InferGetServerSidePropsType<typeof getServerSideProps>
> = ({ party }) => {
  return (
    <prpc.withPRPC {...prpc.context}>
      <Party party={party} />
    </prpc.withPRPC>
  );
};
export default PartyWrapper;
