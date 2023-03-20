import Navigation from "@components/layout/navigation";
import type { GetServerSidePropsContext, NextPage } from "next";
import { getServerAuthSession } from "@server/auth";

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getServerAuthSession({
    req: context.req,
    res: context.res,
  });

  if (session) {
    return {
      redirect: {
        destination: "/dashboard",
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
}
const Home: NextPage = () => {
  return <div></div>;
};

export default Home;
