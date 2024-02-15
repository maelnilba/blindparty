import { getQuery } from "@utils/next-router";
import { NextPageWithTitle } from "next";
import { signIn, useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/router";

const PartyJoin: NextPageWithTitle = () => {
  const router = useRouter();
  const id = getQuery(router.query.id);
  const { status } = useSession();

  const signInAnon = async () => {
    const id = getQuery(router.query.id);
    await signIn("credentials", { callbackUrl: "/party/" + id });
  };

  if (status === "authenticated") {
    router.replace("/party/" + id);
  }

  return (
    <div className="flex h-full min-h-screen w-screen flex-col items-center justify-center">
      <div className="flex flex-1 flex-col justify-center text-6xl font-bold">
        Rejoindre la partie
      </div>

      <div className="flex flex-1 flex-col gap-2">
        <Link
          href="/sign-in"
          className="rounded-full bg-white px-6 py-1 text-center text-lg font-semibold text-black no-underline transition-transform hover:scale-105"
        >
          Se connecter
        </Link>
        <button
          onClick={() => signInAnon()}
          className="px-6 py-1 text-center text-sm font-semibold text-white underline-offset-2 transition-transform hover:scale-105 hover:underline hover:opacity-90"
        >
          Continuer en tant qu'invité
        </button>
      </div>
    </div>
  );
};

export default PartyJoin;

PartyJoin.title = "Party | Join";
