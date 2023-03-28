import { Divider } from "@components/elements/divider";
import { Url } from "@components/elements/url";
import { Score } from "@components/game/score-board";
import { TrackPicture } from "@components/game/track-picture";
import { TrackPlayer, TrackPlayerRef } from "@components/game/track-player";
import { DesktopIcon } from "@components/icons/desktop";
import { PhoneIcon } from "@components/icons/phone";
import { GetLayoutThrough } from "@components/layout/layout";
import { ConfirmationModal } from "@components/modals/confirmation-modal";
import { PlayerCard } from "@components/party/player-card";
import { PlayerStack } from "@components/game/players-stack";
import { useMessagesBus } from "@hooks/useMessagesBus";
import { useWindowLocation } from "@hooks/useWindowLocation";
import { PartyStatus, PartyViewStatus } from "@prisma/client";
import { getServerAuthSession } from "@server/auth";
import { prisma } from "@server/db";
import { RouterOutputs } from "@utils/api";
import { getQuery, getUA } from "@utils/next-router";
import { prpc } from "@utils/prpc";
import { ONE_SECOND_IN_MS } from "lib/helpers/date";
import { sleep } from "lib/helpers/sleep";
import type {
  GetServerSidePropsContext,
  InferGetServerSidePropsType,
  NextPage,
  NextPageWithLayout,
} from "next";
import { useRouter } from "next/router";
import { userAgentFromString } from "next/server";
import { useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";
import { exclude } from "..";
import { Winner } from "@components/game/round/winner";
import { Square } from "@components/elements/square-loader";
import { Round } from "@components/game/round/round";
import {
  VIEW_SCORE_MS,
  GUESS_MS,
  TRACK_TIMER_MS,
} from "@components/party/constants";

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
      host: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
      inviteds: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
      players: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      },
      link: {
        select: {
          url: true,
        },
      },
      _count: {
        select: {
          tracks: true,
        },
      },
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
  });

  if (!party) {
    return {
      redirect: {
        destination: exclude("PARTY_NOT_EXISTS", "/party"),

        permanent: false,
      },
    };
  }
  if (!(party.host.id === session.user.id)) {
    return {
      redirect: {
        destination: exclude("NOT_HOST", "/party"),

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
      host: party.host,
    },
  };
}

export type Player =
  | InferGetServerSidePropsType<
      typeof getServerSideProps
    >["party"]["inviteds"][number];

const Party: NextPage<
  InferGetServerSidePropsType<typeof getServerSideProps>
> = ({ party, isHost, host }) => {
  const router = useRouter();
  const [joineds, setJoineds] = useState<Set<string>>(new Set());
  const [game, setGame] = useState<PartyStatus>(party.status);
  const [view, setView] = useState<PartyViewStatus>(party.view);

  const [scores, setScores] = useState<Score[]>([]);
  const [winner, setWinner] = useState<Score | null | undefined>();
  const [roundCount, setRoundCount] = useState(1);
  const [itwas, setItwas] = useState<string | null>(null);
  const [track, setTrack] = useState<
    RouterOutputs["party"]["game"]["round"] | null
  >(null);
  const [tracks, setTracks] = useState<string[]>([]);

  const timer = useRef<NodeJS.Timeout | null>(null);
  const audio = useRef<TrackPlayerRef | null>(null);

  const { subscribe, message, unsubscribe, ready } = useMessagesBus({
    start: z.boolean(),
    join: z.enum(["new", "already"]),
  });

  useEffect(() => {
    subscribe("start", (started) => {
      if (!started) return;
      router.push({
        pathname: "/party",
        query: {
          reason: exclude("MULTIPLE_TAB_OPEN"),
        },
      });
    });
    return () => {
      unsubscribe("start");
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (game !== "RUNNING") return;
    message("join", "new");
    subscribe("join", (join) => {
      if (join === "new") message("join", "already");
      if (join === "already")
        router.push({
          pathname: "/party",
          query: {
            reason: exclude("DESKTOP_ALREADY_EXIST"),
          },
        });
    });

    return () => {
      unsubscribe("join");
    };
  }, [ready, game]);

  const { send, bind, members, unbind_all } = prpc.game.useConnect(
    party.id,
    {
      subscribeOnMount: true,
      userDataOnAuth: {
        isHost: isHost,
      },
    },
    () => {
      let _tracks: Set<string> = new Set(); // Handle useEffect so state is not updated here

      bind("pusher:member_removed", (member) => {
        if ((game === "PENDING" || game === "RUNNING") && !member.info.isHost) {
          setJoineds((joineds) => {
            if (joineds.has(member.info.id)) {
              joineds.delete(member.info.id);
            }
            return new Set(joineds);
          });
          send("leave", { id: member.info.id });
        }
      });

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

      let ok = true; // avoid calling round multiple time
      bind("guess", async (data) => {
        if (!data) return;
        if (!ok) return;
        const { players, name } = data;

        if (timer.current) {
          clearInterval(timer.current);
          timer.current = null;
        }

        setView("SCORE");
        setWinner(data.winner);
        setScores(players);
        setItwas(name);
        ok = false;
        await sleep(VIEW_SCORE_MS);
        ok = true;
        setRoundCount((c) => c + 1);
        round([..._tracks]);
      });

      bind("next", async ({ name, track }) => {
        if (timer.current) {
          clearInterval(timer.current);
          timer.current = null;
        }
        _tracks.add(track.id);

        setTracks([..._tracks]);
        setView("SCORE");
        setWinner(null);
        setItwas(name);

        await sleep(VIEW_SCORE_MS);
        setRoundCount((c) => c + 1);
        round([..._tracks]);
      });

      bind("round", ({ track }) => {
        if (!track) {
          return;
        }

        setView("GUESS");
        setItwas(null);

        _tracks.add(track.id);
        setTracks([..._tracks]);
        setTrack({ track });

        timer.current = setTimeout(
          () => send("next"),
          GUESS_MS + TRACK_TIMER_MS + ONE_SECOND_IN_MS
        );
      });

      bind("over", () => {
        setView("NONE");
        setGame("ENDED");
      });

      return () => {
        unbind_all();
      };
    },
    [game]
  );

  const location = useWindowLocation();
  // @TODO: Fix connected UI ?
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
        message("start", true);
        round();
      }
    });
  };

  const round = (_tracks?: string[]) => {
    send("round", { tracks: _tracks ?? tracks });
  };

  const ban = (id: string) => {
    send("ban", { id: id });
  };

  useEffect(() => {
    if (track) {
      if (audio.current) {
        audio.current.start();
      }
    }
  }, [track]);

  return (
    <div className="scrollbar-hide flex flex-1 gap-4 p-4">
      {game === "PENDING" && (
        <>
          <div className="scrollbar-hide relative mt-20 flex w-96 max-w-[24rem] flex-1 flex-col overflow-y-auto rounded border border-gray-800 ">
            <div className="sticky top-0 flex flex-row items-center justify-end gap-2 bg-black/10 p-4 font-semibold backdrop-blur-sm">
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
                  Les télèphones joueront le rôle de microphone. Il faut dire à
                  haute voix le nom de la musique, l'album ou de l'artiste
                  (selon les règles de la partie) afin de remporter le round
                </p>
              </div>
              <Divider />
              <div>
                <p>
                  Accèder à la page
                  {location && (
                    <Url>{`${location?.host}/p/${party.link?.url}`}</Url>
                  )}
                  sur vos télèphones pour rejoindre la partie
                </p>
              </div>
            </div>
          </div>

          <div className="scrollbar-hide relative mt-20 flex w-96 flex-1 flex-col overflow-y-auto rounded border border-gray-800">
            <div className="sticky top-0 flex flex-row items-center justify-end gap-2 bg-black/10 p-4 font-semibold backdrop-blur-sm">
              {isHost ? (
                <div className="flex w-full justify-center">
                  {missed ? (
                    <ConfirmationModal
                      title="Commencer la partie"
                      message="Certains amis invités n'ont pas encore rejoint la partie, êtes vous sur de vouloir commencer la partie ? Une fois une partie lancée, il n'est plus possible de la rejoindre."
                      action="Commencer"
                      className="flex w-full items-center justify-center"
                      onSuccess={() => {
                        start();
                      }}
                    >
                      <button className="rounded-full bg-white px-6 py-1 text-center text-lg font-semibold text-black no-underline transition-transform hover:scale-105">
                        Commencer la partie
                      </button>
                    </ConfirmationModal>
                  ) : (
                    <button
                      onClick={() => start()}
                      className="rounded-full bg-white px-6 py-1 text-center text-lg font-semibold text-black no-underline transition-transform hover:scale-105"
                    >
                      Commencer la partie
                    </button>
                  )}
                </div>
              ) : (
                <button className="w-full rounded-full bg-white px-6 py-1 text-center text-lg font-semibold text-black no-underline transition-transform hover:scale-105">
                  Rejoindre la partie
                </button>
              )}
            </div>
            <div className="flex flex-1 flex-col gap-6 p-2">
              <Divider />
              <div>{/* <PlaylistCard playlist={party.playlist} /> */}</div>
              <Divider />
              <div className="text-center text-lg font-semibold">
                <p>{party.max_round} rounds</p>
              </div>
              <Divider />
              <div className="flex max-h-96 flex-wrap gap-x-2.5 gap-y-2 overflow-hidden">
                {players.map(({ player, joined }) => (
                  <PlayerCard
                    key={player.id}
                    player={player}
                    joined={joined}
                    connected
                  />
                ))}
              </div>
            </div>
          </div>
        </>
      )}
      {game === "RUNNING" && (
        <div className="relative flex flex-1 items-center justify-center">
          <div className="fixed inset-0 flex w-max">
            <PlayerStack
              players={players.filter((p) => p.joined).map((p) => p.player)}
              onBan={ban}
            />
            <div className="pt-32 pb-24">
              <Winner player={winner} />
            </div>
          </div>
          <div className="fixed right-0 top-0 flex w-max">
            <div className="flex flex-col items-center gap-4 px-8 pt-32">
              <Round round={roundCount} />
              <Divider />
              <p className="text-4xl font-extrabold">{party.max_round}</p>
            </div>
          </div>
          {view === "GUESS" && (
            <div className="flex aspect-square w-full max-w-xl flex-col items-center justify-center">
              {track?.track && (
                <TrackPlayer
                  tracktimer={TRACK_TIMER_MS}
                  key={track.track.id}
                  ref={audio}
                  track={track.track}
                />
              )}
            </div>
          )}
          {view === "SCORE" && (
            <div className="flex aspect-square w-full max-w-xl flex-col items-center justify-center">
              <div className="flex flex-col items-center justify-center gap-2">
                <p className="text-4xl font-extrabold">Le son était</p>
                <div className="px-10 py-6">
                  {track && track.track && (
                    <div className="scrollbar-hide relative flex h-full w-full flex-col items-center justify-center overflow-hidden rounded border border-gray-800">
                      <TrackPicture
                        width={600}
                        height={600}
                        className="h-full w-full object-cover"
                        track={track.track}
                      />
                    </div>
                  )}
                </div>
                <p className="text-center">{itwas}</p>
              </div>
              {/* <div className="mt-10 mb-20">
                <Divider />
              </div>
              <ScoreBoard scores={scores} /> */}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const PartyWrapper: NextPageWithLayout<
  InferGetServerSidePropsType<typeof getServerSideProps>
> = ({ party, isHost, host }) => {
  return (
    <prpc.withPRPC {...prpc.context}>
      <Party party={party} isHost={isHost} host={host} />
    </prpc.withPRPC>
  );
};

export default PartyWrapper;
PartyWrapper.getLayout = GetLayoutThrough;
