import { Noop } from "@lib/helpers/noop";
import { getServerAuthSession } from "@server/auth";
import { prisma } from "@server/db";
import { getQuery, getUA } from "@utils/next-router";
import {
  GetServerSidePropsContext,
  InferGetServerSidePropsType,
  NextPageWithAuth,
} from "next";
import { useRouter } from "next/router";
import { userAgentFromString } from "next/server";

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
    },
  });

  if (!party) {
    return {
      redirect: {
        destination: "/dashboard",
        permanent: false,
      },
    };
  }

  if ((!session || !session.user) && party.access_mode == "PUBLIC") {
    return {
      redirect: {
        destination: "/party/" + party.id + "/join",
        permanent: false,
      },
    };
  } else if (!session || !session.user) {
    return {
      redirect: {
        destination: "/sign-in",
        permanent: false,
      },
    };
  }

  if (party.access_mode === "PRIVATE") {
    if (
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
  }

  const user_agent = userAgentFromString(context.req.headers["user-agent"]);

  return {
    props: {
      userAgent: user_agent,
      id: id,
    },
  };
}
const Party: NextPageWithAuth<
  InferGetServerSidePropsType<typeof getServerSideProps>
> = ({ userAgent, id }) => {
  const ua = getUA(userAgent);
  const { replace } = useRouter();

  if (typeof window === "undefined") return <Noop />;

  if (ua.isDesktop()) {
    replace(
      { pathname: "/party/desktop/[id]", query: { id } },
      "/party/" + id,
      {
        shallow: false,
      }
    );
    return <Noop />;
  }

  replace({ pathname: "/party/phone/[id]", query: { id } }, "/party/" + id, {
    shallow: false,
  });

  return <Noop />;
};

export default Party;
