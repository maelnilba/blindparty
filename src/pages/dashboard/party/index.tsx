import { AuthGuardUser } from "@components/layout/auth";
import { PartyCard } from "@components/party/party-card";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { api } from "@utils/api";
import { NextPageWithAuth, NextPageWithTitle } from "next";
import Link from "next/link";
import { useRouter } from "next/router";

const Party: NextPageWithAuth & NextPageWithTitle = () => {
  const router = useRouter();

  const { data: party, refetch } = api.party.get_all.useQuery();

  const { mutateAsync: replay } = api.party.replay.useMutation({
    onSuccess: ({ id }) => {
      router.push({ pathname: "/party/[id]", query: { id: id } });
    },
  });

  const { mutateAsync: erase } = api.party.delete.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const [autoAnimateRef] = useAutoAnimate();

  return (
    <div className="flex flex-wrap gap-4 p-4 px-28" ref={autoAnimateRef}>
      <div className="flex h-96 w-96 flex-col items-center justify-center gap-4 rounded border border-gray-800">
        <>
          <Link
            href="/dashboard/party/create"
            className="w-80 rounded-full bg-white px-6 py-1 text-center text-lg font-semibold text-black no-underline transition-transform hover:scale-105"
          >
            Créer une partie
          </Link>
        </>
      </div>
      {party?.map((party) => (
        <PartyCard
          key={party.id}
          party={party}
          onAction={
            party.status === "CANCELED"
              ? replay
              : party.status === "PENDING"
              ? erase
              : undefined
          }
        />
      ))}
    </div>
  );
};

export default Party;
Party.auth = AuthGuardUser;
Party.title = "Party";
