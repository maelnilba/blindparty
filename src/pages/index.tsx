import Navigation from "@components/navigation";
import { api } from "@utils/api";
import type { GetServerSidePropsContext, NextPage } from "next";
import { getServerAuthSession } from "../server/auth";

const Home: NextPage = () => {
  return (
    <div className="min-h-screen w-screen">
      <Navigation />
      <div></div>
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
