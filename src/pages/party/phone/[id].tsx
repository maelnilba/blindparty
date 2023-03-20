import { Divider } from "@components/elements/divider";
import { MicroIcon } from "@components/icons/micro";
import { Picture } from "@components/images/picture";
import { Modal } from "@components/modals/modal";
import Navigation from "@components/navigation";
import { PlaylistCard } from "@components/playlist/playlist-card";
import { useMicroPermission } from "@hooks/useMicroPermission";
import { useVoiceDetector } from "@hooks/useVoiceDetector";
import type { PartyStatus, PartyViewStatus } from "@prisma/client";
import { getQuery, getUA } from "@utils/next-router";
import { prpc } from "@utils/prpc";
import { raw } from "lib/tailwindcolors";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import type {
  GetServerSidePropsContext,
  InferGetServerSidePropsType,
  NextPage,
} from "next";
import { userAgentFromString } from "next/server";
import { useEffect, useMemo, useRef, useState } from "react";
import { getServerAuthSession } from "@server/auth";
import { prisma } from "@server/db";
import { TRACK_TIMER_MS } from "../#constant";
import { sleep } from "lib/helpers/sleep";
import { exclude } from "..";
import { useRouter } from "next/router";

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

  if (!party) {
    return {
      redirect: {
        destination: exclude("PARTY_NOT_EXISTS", "/party"),
        permanent: false,
      },
    };
  }

  if (!party.inviteds.map((invited) => invited.id).includes(session.user.id)) {
    return {
      redirect: {
        destination: exclude("NOT_INVITED", "/party"),
        permanent: false,
      },
    };
  }
  if (
    party.status !== "PENDING" &&
    !party.players.map((player) => player.userId).includes(session.user.id)
  ) {
    return {
      redirect: {
        destination: exclude("NOT_JOINED", "/party"),
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
export type Player =
  | InferGetServerSidePropsType<
      typeof getServerSideProps
    >["party"]["inviteds"][number];

const Party: NextPage<
  InferGetServerSidePropsType<typeof getServerSideProps>
> = ({ party }) => {
  const router = useRouter();
  const [joineds, setJoineds] = useState<Set<string>>(new Set());
  const [isJoined, setIsJoined] = useState(false);
  const [game, setGame] = useState<PartyStatus>(party.status);
  const [view, setView] = useState<PartyViewStatus>(party.view);
  const [guesses, setGuesses] = useState<string[]>([]);

  const { send, bind, members } = prpc.game.useConnect(
    party.id,
    {
      subscribeOnMount: true,
      userDataOnAuth: {
        isHost: false,
      },
    },
    () => {
      bind("pusher:member_removed", (member) => {
        if (game === "RUNNING" && member.info.isHost) {
          send("host-leave");
        }
      });

      bind("host-leave", () => {
        if (game !== "RUNNING") return;
        router.push({
          pathname: "/party",
          query: {
            reason: exclude("HOST_LEAVE"),
          },
        });
      });

      bind("leave", ({ id }) => {
        setJoineds((joineds) => {
          if (joineds.has(id)) {
            joineds.delete(id);
          }
          return new Set(joineds);
        });
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

      bind("start", ({ running }) => {
        if (!isJoined)
          router.push({
            pathname: "/party",
            query: {
              reason: exclude("NOT_JOINED"),
            },
          });
        if (running) {
          setGame("RUNNING");
        }
      });

      bind("round", async () => {
        setGuesses([]);
        await sleep(TRACK_TIMER_MS);
        setView("GUESS");
      });

      bind("guess", () => {
        setGuesses([]);
        setView("SCORE");
      });
    },
    [game, isJoined]
  );

  const guess = (word: string) => {
    setGuesses((g) => [...g, word]);
    send("guess", { guess: word.trim().toLocaleLowerCase() });
  };

  const micro = useMicroPermission();
  const { finalTranscript } = useSpeechRecognition();

  useEffect(() => {
    if (view === "GUESS") {
      guess(finalTranscript);
    }
  }, [finalTranscript]);

  const listenContinuously = async () => {
    if (!SpeechRecognition.browserSupportsSpeechRecognition()) {
      return null;
    }

    if (!SpeechRecognition.browserSupportsSpeechRecognition()) {
      console.warn(
        "Your browser does not support speech recognition software! Try Chrome desktop, maybe?"
      );
      return;
    }
    await SpeechRecognition.startListening({
      continuous: true,
      language: "fr-FR",
    });
  };
  const vadMicro = useRef<SVGSVGElement | null>(null);
  const { vad } = useVoiceDetector();
  useEffect(() => {
    if (game === "RUNNING") {
      listenContinuously();

      const onVoiceStart = () => {
        if (!vadMicro.current) return;
        vadMicro.current.style.display = "block";
      };

      const onVoiceStop = () => {
        if (!vadMicro.current) return;
        vadMicro.current.style.display = "none";
      };

      const onUpdate = (val: number) => {
        if (!vadMicro.current) return;
        const percent = val * 100;
        let variation = Math.round((percent * 10) / 100) * 100;
        variation = variation === 0 ? 50 : variation > 900 ? 900 : variation;
        vadMicro.current.style.color = raw("teal", variation as any);
        vadMicro.current.style.clipPath = `inset(${percent}% 0 0 0)`;
      };

      vad({
        onVoiceStart,
        onVoiceStop,
        onUpdate,
      });
    }

    return () => {
      SpeechRecognition.stopListening();
      vad({
        onVoiceStart: () => {},
        onVoiceStop: () => {},
        onUpdate: () => {},
      });
    };
  }, [game]);

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

  const join = () => {
    send("join", { joined: !isJoined });
    setIsJoined((j) => !j);
  };

  return (
    <div className="flex min-h-screen w-screen flex-col">
      <Navigation />

      <div className="flex flex-1 items-center justify-center gap-4 p-4">
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
        {game === "RUNNING" && (
          <>
            <div className="flex flex-1 flex-col items-center justify-center gap-4 pb-20">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const target = (
                    e.target as HTMLFormElement
                  ).elements.namedItem("guess") as HTMLInputElement;
                  if (target.value) {
                    guess(target.value);
                    target.value = "";
                  }
                }}
              >
                <input
                  disabled={view === "SCORE"}
                  type="text"
                  name="guess"
                  placeholder="Michael Jackson"
                  className="block w-56 rounded-lg border border-gray-800 bg-black p-2.5 text-sm text-white focus:border-gray-500 focus:outline-none focus:ring-gray-500 disabled:border-gray-900"
                />
              </form>

              <div
                data-view={view}
                className="relative rounded-lg border border-gray-800 p-4 data-[view=SCORE]:border-gray-900"
              >
                <MicroIcon
                  ref={vadMicro}
                  className="absolute  h-48 w-48 transition-all duration-75"
                  style={{ clipPath: "inset(100% 0 0 0)" }}
                />
                <MicroIcon className="h-48 w-48" />
              </div>
              <div className="fixed bottom-0 w-full p-2 pb-0">
                <div className="scrollbar-hide flex h-48 w-full flex-col gap-2 overflow-y-auto rounded border border-gray-800">
                  <div className="flex-1">
                    {guesses
                      .filter((g) => Boolean(g))
                      .reverse()
                      .map((guess, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-center gap-4 p-2 font-bold ring-2 ring-white ring-opacity-5"
                        >
                          <div className="inline-block w-3/4">
                            <span className="block overflow-hidden truncate text-ellipsis">
                              {guess}
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

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
          className="h-12 w-12 rounded border-gray-800 object-cover"
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
