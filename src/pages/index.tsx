import Navigation from "@components/navigation";
import type { GetServerSidePropsContext, NextPage } from "next";
import { getServerAuthSession } from "@server/auth";

const Home: NextPage = () => {
  return (
    <div className="relative min-h-screen w-screen">
      <Navigation />
    </div>
  );
};

export default Home;

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
