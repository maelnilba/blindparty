import Navigation from "@components/navigation";
import type { GetServerSidePropsContext, NextPage } from "next";
import { getServerAuthSession } from "server/auth";
import { push } from "@utils/pusher/client";

const Home: NextPage = () => {
  const { isSubscribe, bind, send } = push.channel.game.useChannel(
    {
      subscribeOnMount: true,
      type: "presence",
    },
    () => {
      bind("test", (e) => {
        console.log("first", e);
      });
    }
  );

  const testsend = () => {
    send("test", { test: 9 });
  };

  return (
    <div className="min-h-screen w-screen">
      <Navigation />
      <div onClick={() => testsend()}>{isSubscribe && <div>sub</div>}</div>
    </div>
  );
};

export default Home;

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getServerAuthSession({
    req: context.req,
    res: context.res,
  });

  // if (session) {
  //   return {
  //     redirect: {
  //       destination: "/dashboard",
  //       permanent: false,
  //     },
  //   };
  // }

  return {
    props: {},
  };
}
