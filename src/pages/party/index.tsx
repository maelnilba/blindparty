import { AuthGuard, AuthGuardUser } from "@components/layout/auth";
import { PartyBanner } from "@components/party/party-banner";
import { getServerAuthSession } from "@server/auth";
import { api } from "@utils/api";
import type {
  GetServerSidePropsContext,
  InferGetServerSidePropsType,
  NextPageWithAuth,
  NextPageWithTitle,
} from "next";
import Link from "next/link";
import { z } from "zod";

const excludeReasons = z.enum([
  "NOT_INVITED",
  "NOT_JOINED",
  "DESKTOP_ALREADY_EXIST",
  "MULTIPLE_TAB_OPEN",
  "NOT_HOST",
  "PARTY_NOT_EXISTS",
  "HOST_LEAVE",
  "PARTY_ENDED",
]);
export const exclude = (
  reason: z.infer<typeof excludeReasons>,
  path?: string
) => (path ? path + "?reason=" + reason : reason);

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const referer = context.req.headers.referer;
  if (!referer)
    return {
      redirect: {
        destination: "/dashboard",
        permanent: false,
      },
    };

  const session = await getServerAuthSession({
    req: context.req,
    res: context.res,
  });

  if (!session || !session.user) {
    return {
      redirect: {
        destination: "/sign-in",
        permanent: false,
      },
    };
  }

  const pathname = new URL(referer).pathname;
  const paths = pathname.substring(0, pathname.lastIndexOf("/") + 1);
  if (!paths.startsWith("/party/"))
    return {
      redirect: {
        destination: "/dashboard",
        permanent: false,
      },
    };

  const query = context.query;
  let reason: z.infer<typeof excludeReasons> | undefined;
  if (query.reason) {
    const _reason = excludeReasons.safeParse(query.reason);
    if (_reason.success) reason = _reason.data;
  }

  return {
    props: {
      reason,
      role: session.user.role,
    },
  };
}

type GSSPProps = InferGetServerSidePropsType<typeof getServerSideProps>;
const PartyHome: NextPageWithAuth<GSSPProps> & NextPageWithTitle<GSSPProps> = ({
  reason,
  role,
}) => {
  const { data: partys } = api.party.get_all_invite.useQuery(
    {},
    { enabled: role !== "ANON" }
  );

  return (
    <div className="flex items-center justify-center gap-4 p-4">
      <div className="scrollbar-hide relative flex h-[40rem] w-96 flex-col overflow-y-auto rounded border border-gray-800 ">
        <div className="sticky top-0 flex flex-col items-center justify-center gap-4 bg-black/10 p-6 font-semibold backdrop-blur-sm">
          {(reason === "MULTIPLE_TAB_OPEN" ||
            reason === "DESKTOP_ALREADY_EXIST") && (
            <p>
              Vous ne pouvez pas avoir plusieur fênetre ouverte pour la même
              partie
            </p>
          )}
          {reason === "NOT_HOST" && (
            <p>Uniquement le créateur de la partie peut être en mode Écran</p>
          )}
          {reason === "NOT_JOINED" && (
            <p>Vous n'avez pas rejoint la partie avant qu'elle ne commence</p>
          )}
          {reason === "NOT_INVITED" && (
            <p>Vous n'avez pas était invité pour joindre la partie</p>
          )}
          {reason === "PARTY_NOT_EXISTS" && <p>La partie est introuvable</p>}
          {reason === "HOST_LEAVE" && <p>L'Hôte a quitté la partie en cours</p>}
          {reason === "PARTY_ENDED" && <p>La partie est terminée</p>}
          {role !== "ANON" && (
            <Link
              href="/dashboard/party/create"
              className="w-full rounded-full bg-white px-6 py-1 text-center text-lg font-semibold text-black no-underline transition-transform hover:scale-105"
            >
              Créer une partie
            </Link>
          )}
        </div>
        <div className="flex-1 p-2">
          {partys?.map((party) => (
            <PartyBanner key={party.id} party={party} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default PartyHome;
PartyHome.auth = AuthGuard;
PartyHome.title = ({ reason }) => {
  if (reason) {
    return `Party | ${reason
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/^\w/, (c) => c.toUpperCase())}`;
  }
  return `Party`;
};
