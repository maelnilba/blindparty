import { Nothing } from "@lib/helpers/nothing";
import { getServerAuthSession } from "@server/auth";
import { prisma } from "@server/db";
import { getQuery, getUA } from "@utils/next-router";
import {
  GetServerSidePropsContext,
  InferGetServerSidePropsType,
  NextPage,
} from "next";
import Link from "next/link";
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

  return {
    props: {
      userAgent: user_agent,
      id: id,
    },
  };
  // if (getUA(user_agent).isDesktop()) {
  //   return {
  //     redirect: {
  //       destination: "/party/desktop/" + id,
  //       permanent: false,
  //     },
  //   };
  // } else {
  //   return {
  //     redirect: {
  //       destination: "/party/phone/" + id,
  //       permanent: false,
  //     },
  //   };
  // }
}
const Party: NextPage<
  InferGetServerSidePropsType<typeof getServerSideProps>
> = ({ userAgent, id }) => {
  const ua = getUA(userAgent);
  const { replace } = useRouter();

  if (typeof window === "undefined") return <Nothing />;

  if (ua.isDesktop()) {
    replace(
      { pathname: "/party/desktop/[id]", query: { id } },
      "/party/" + id,
      {
        shallow: false,
      }
    );
    return <Nothing />;
  }

  replace({ pathname: "/party/phone/[id]", query: { id } }, "/party/" + id, {
    shallow: false,
  });

  return <Nothing />;
};

export default Party;
