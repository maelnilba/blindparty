import { getServerAuthSession } from "@server/auth";
import { prisma } from "@server/db";
import { getQuery, getUA } from "@utils/next-router";
import { GetServerSidePropsContext, NextPage } from "next";
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
  } else {
    return {
      redirect: {
        destination: "/party/phone/" + id,
        permanent: false,
      },
    };
  }
}
const Party: NextPage = () => {
  return <div></div>;
};

export default Party;
