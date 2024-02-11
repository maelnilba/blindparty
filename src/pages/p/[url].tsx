import { getServerAuthSession } from "@server/auth";
import { prisma } from "@server/db";
import { getQuery } from "@utils/next-router";
import type { GetServerSidePropsContext, NextPageWithAuth } from "next";

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getServerAuthSession({
    req: context.req,
    res: context.res,
  });

  const url = getQuery(context.query.url);
  if (!url) {
    return {
      redirect: {
        destination: "/dashboard",
        permanent: false,
      },
    };
  }

  const link = await prisma.partyLink.findFirst({
    where: {
      url: url,
    },
    select: {
      expireIn: true,
      party: {
        select: {
          id: true,
          access_mode: true,
        },
      },
    },
  });

  if (!link || !link.party) {
    return {
      redirect: {
        destination: "/dashboard",
        permanent: false,
      },
    };
  }

  if ((!session || !session.user) && link.party.access_mode === "PUBLIC") {
    return {
      redirect: {
        destination: "/party/" + link.party.id + "/join",
        permanent: false,
      },
    };
  } else if (!session || !session.user) {
    return {
      redirect: {
        destination: "sign-in",
        permanent: false,
      },
    };
  }

  const cacheSeconds = Math.floor(
    (Date.now().valueOf() - link.expireIn.valueOf()) / 1000
  );

  if (cacheSeconds > 0) {
    context.res.setHeader(
      "Cache-Control",
      `public, s-maxage=${cacheSeconds}, stale-while-revalidate=59`
    );
  }

  return {
    redirect: {
      destination: "/party/" + link.party.id,
      permanent: false,
    },
  };
}
const PartyUrl: NextPageWithAuth = () => {
  return <div></div>;
};

export default PartyUrl;
