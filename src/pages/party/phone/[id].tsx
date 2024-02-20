import { Divider } from "@components/elements/divider";
import { Modal } from "@components/elements/modal";
import { AuthGuard } from "@components/layout/auth";
import { Confetti } from "@components/party/confetti";
import { TRACK_TIMER_MS } from "@components/party/constants";
import { formatPosition } from "@components/party/helpers";
import { PlayerStatusTile, PlayerTile } from "@components/party/player-tile";
import { useSubmit } from "@hooks/form/useSubmit";
import { useSet } from "@hooks/helpers/useSet";
import { useForm } from "@marienilba/react-zod-form";
import type { PartyStatus, PartyViewStatus } from "@prisma/client";
import { getServerAuthSession } from "@server/auth";
import { prisma } from "@server/db";
import { getQuery, getUA } from "@utils/next-router";
import { prpc } from "@utils/prpc";
import { getAcceptLanguage, getLanguage } from "helpers/accept-language";
import { sleep } from "helpers/sleep";
import type {
  GetServerSidePropsContext,
  InferGetServerSidePropsType,
  NextPage,
  NextPageWithAuth,
} from "next";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { userAgentFromString } from "next/server";
import { useEffect, useMemo, useReducer, useState } from "react";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import { z } from "zod";
import { exclude } from "..";

const guessSchema = z.object({
  guess: z.string().min(1),
});

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
        select: {
          id: true,
          name: true,
          previewUrl: true,
          album: true,
          images: true,
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

  if (party.status === "ENDED") {
    return {
      redirect: {
        destination: exclude("PARTY_ENDED", "/party"),

        permanent: false,
      },
    };
  }

  if (party.accessMode === "PRIVATE") {
    if (
      !party.inviteds.map((invited) => invited.id).includes(session.user.id)
    ) {
      return {
        redirect: {
          destination: exclude("NOT_INVITED", "/party"),
          permanent: false,
        },
      };
    }
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
      language: getLanguage(
        getAcceptLanguage(context.req.headers["accept-language"]).at(0) ??
          context.locale ??
          context.defaultLocale ??
          "fr"
      ),
    },
  };
}

export type Player =
  | InferGetServerSidePropsType<
      typeof getServerSideProps
    >["party"]["inviteds"][number];

const Party: NextPage<
  InferGetServerSidePropsType<typeof getServerSideProps>
> = ({ party, language }) => {
  const router = useRouter();
  const { data: session } = useSession();

  const {
    set: joineds,
    add: addJoineds,
    remove: removeJoineds,
  } = useSet<string>();
  const [isJoined, setIsJoined] = useState(false);
  const [game, setGame] = useState<PartyStatus>(party.status);
  const [view, setView] = useState<PartyViewStatus>(party.view);
  const [voiceDetection, toggleVoiceDetection] = useReducer(
    (state) => !state,
    true
  );

  const [position, setPosition] = useState<number | undefined>();

  const { send, bind, members, unbind_all, me } = prpc.game.useConnect(
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
        removeJoineds(id);
      });

      bind("join", ({ joined, user }) => {
        if (joined) addJoineds(user.info.id);
        else removeJoineds(user.info.id);
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
        await sleep(TRACK_TIMER_MS);
        setView("GUESS");
      });

      bind("guess", () => {
        setView("SCORE");
      });

      bind("force-stop", () => {
        router.push({
          pathname: "/party",
          query: {
            reason: exclude("PARTY_DELETED"),
          },
        });
      });

      bind("ban", ({ id }) => {
        if (id === me?.info.id) {
          router.push({
            pathname: "/party",
            query: {
              reason: exclude("BANNED"),
            },
          });
        }
      });

      bind("over", ({ scores }) => {
        setView("NONE");
        setGame("ENDED");
        setPosition(
          scores.findIndex((player) => player.user.id === me?.info.id) + 1
        );
      });

      return () => {
        unbind_all();
      };
    },
    [game, isJoined]
  );

  const join = () => {
    send("join", { joined: !isJoined });
    setIsJoined((j) => !j);
  };

  const {
    finalTranscript,
    interimTranscript,
    isMicrophoneAvailable,
    resetTranscript,
  } = useSpeechRecognition();

  useEffect(() => {
    if (game === "RUNNING" && view === "GUESS") {
      if (!SpeechRecognition.browserSupportsSpeechRecognition())
        console.warn(
          "Your browser does not support speech recognition software! Try Chrome desktop, maybe?"
        );
      else
        SpeechRecognition.startListening({
          continuous: true,
          language: language,
        });
    }

    return () => {
      SpeechRecognition.stopListening();
    };
  }, [game, view]);

  useEffect(() => {
    if (view === "GUESS") {
      send("guess", { guess: finalTranscript.trim().toLocaleLowerCase() });
      resetTranscript();
    }
  }, [finalTranscript]);

  const activation = () => {
    if (typeof window === "undefined") {
      return;
    }

    window.navigator.mediaDevices.getUserMedia({ audio: true });
  };

  const players = useMemo<
    { player: Player; joined: boolean; connected: boolean }[]
  >(() => {
    const players =
      party.accessMode === "PRIVATE"
        ? party.inviteds
        : (members ? Object.values(members) : [])
            .filter((m) => !m.isHost)
            .map(({ id, name, image }) => ({
              id,
              name,
              image,
            }));

    return players.map((invited) => ({
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

  const { submitPreventDefault } = useSubmit<typeof guessSchema>(async (e) => {
    if (!e.success) return;
    send("guess", { guess: e.data.guess.trim().toLocaleLowerCase() });
  });

  const f0rm = useForm(guessSchema, submitPreventDefault);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-4">
      {game === "PENDING" && (
        <div className="">
          <div className="scrollbar-hide relative flex h-[40rem] w-96 flex-col overflow-y-auto rounded border border-gray-800 ">
            <div className="sticky top-0 flex flex-row items-center justify-end gap-2 bg-black/10 p-6 font-semibold backdrop-blur-sm">
              {!isMicrophoneAvailable ? (
                <Modal.Root>
                  <Modal.Title className="mb-2 inline-block w-full max-w-sm text-lg font-medium leading-6">
                    Activer votre micro{" "}
                  </Modal.Title>
                  <Modal.Trigger className="w-full rounded-full bg-white px-6 py-1 text-center text-lg font-semibold text-black no-underline transition-transform hover:scale-105">
                    Rejoindre la partie
                  </Modal.Trigger>
                  <Modal.Content>
                    <div className="flex flex-col gap-2">
                      <p>
                        Pour que votre télèphone joue le rôle de recepteur, la
                        permission d'accèder à votre microphone est requis
                      </p>
                      <p>
                        Si l'activation ne fonctionne pas, verifier les
                        paramètrages de votre télèphone
                      </p>
                      <Modal.Close
                        onClick={activation}
                        className="w-full rounded-full bg-white px-6 py-1 text-center text-lg font-semibold text-black no-underline transition-transform hover:scale-105"
                      >
                        Activer
                      </Modal.Close>
                    </div>
                  </Modal.Content>
                </Modal.Root>
              ) : (
                <button
                  onClick={join}
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
              <div>{/* <PlaylistCard playlist={party.playlist} /> */}</div>
              <Divider />
              <div className="text-center text-lg font-semibold">
                <p>{party.maxRound} rounds</p>
              </div>
              <Divider />
              <div className="flex flex-wrap gap-2">
                {players.map(({ player, joined, connected }) => (
                  <PlayerStatusTile
                    key={player.id}
                    connected={connected}
                    player={player}
                    joined={joined}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      {game === "RUNNING" && (
        <div className="flex w-full flex-1 flex-col items-center justify-center gap-4 pb-20">
          <div className="flex w-full flex-1 flex-col items-center justify-center">
            {voiceDetection && isMicrophoneAvailable ? (
              <span>
                {finalTranscript ? (
                  <span>{finalTranscript}</span>
                ) : (
                  <span>
                    {interimTranscript}
                    <span
                      data-disabled={view === "SCORE"}
                      className="animate-pulse data-[disabled=true]:animate-none"
                    >
                      ...
                    </span>
                  </span>
                )}
              </span>
            ) : (
              <form
                onSubmit={async (e) => {
                  if (view !== "GUESS") return;
                  await f0rm.form.submit(e);
                  const input = (
                    e.target as HTMLFormElement
                  ).elements.namedItem(
                    f0rm.fields.guess().name()
                  ) as HTMLInputElement;

                  input.value = "";
                  input.blur();
                }}
              >
                <input
                  disabled={view === "SCORE"}
                  type="text"
                  name={f0rm.fields.guess().name()}
                  className="block w-56 rounded-lg border border-gray-800 bg-black p-2.5 text-white focus:border-gray-500 focus:outline-none focus:ring-gray-500 disabled:border-gray-900"
                />
              </form>
            )}
          </div>
          <div className="item flex flex-col justify-end gap-2">
            <span className="text-center text-sm font-normal">
              {voiceDetection ? "Détection vocal" : "Saisie manuelle"}
            </span>
            <button
              onClick={() => toggleVoiceDetection()}
              className="w-full rounded-full bg-white px-6 py-1 text-center text-lg font-semibold text-black no-underline transition-transform hover:scale-105"
            >
              Changer de mode
            </button>
          </div>
        </div>
      )}
      {game === "ENDED" && (
        <div className="flex flex-1 flex-col items-center justify-center gap-2">
          {me && position && (
            <>
              {position === 1 && <Confetti />}
              <div className="flex flex-1 flex-col items-center justify-center gap-2">
                <div className="flex flex-1 flex-col items-center justify-center">
                  <PlayerTile player={me!.info} className="h-40 w-40" />
                  <span className="text-lg font-bold">
                    {formatPosition(position)}
                  </span>
                </div>
                <div className="flex flex-1 flex-col justify-center">
                  <button
                    onClick={() => {
                      if (!session || !session.user) return;
                      if (session.user.role === "ANON")
                        signOut({ callbackUrl: "/" });
                      else router.push("/dashboard");
                    }}
                    className="w-full place-self-end justify-self-end rounded-full bg-white px-6 py-1 text-center text-lg font-semibold text-black no-underline transition-transform hover:scale-105"
                  >
                    Quitter
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

const PartyWrapper: NextPageWithAuth<
  InferGetServerSidePropsType<typeof getServerSideProps>
> = ({ party, language }) => {
  return (
    <prpc.withPRPC {...prpc.context}>
      <Party party={party} language={language} />
    </prpc.withPRPC>
  );
};

export default PartyWrapper;
PartyWrapper.auth = AuthGuard;
