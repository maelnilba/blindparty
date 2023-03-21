import { getServerAuthSession } from "@server/auth";
import type { GetServerSidePropsContext, NextPage } from "next";
import type { BuiltInProviderType } from "next-auth/providers";
import type { ClientSafeProvider, LiteralUnion } from "next-auth/react";
import { getProviders, signIn } from "next-auth/react";

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const providers = await getProviders();
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
    props: { providers },
  };
}

const Index: NextPage<{
  providers: Record<
    LiteralUnion<BuiltInProviderType, string>,
    ClientSafeProvider
  > | null;
}> = ({ providers }) => {
  if (!providers) return <div>No provider found!</div>;
  return (
    <>
      <div className="flex h-full min-h-screen w-screen items-center justify-center">
        <div className="scrollbar-hide flex h-96 w-96 flex-col gap-2 overflow-y-auto text-center">
          <div className="sticky top-0 flex flex-col gap-2 bg-black/10 py-2 backdrop-blur-sm">
            <div className="text-6xl font-bold">Inscription</div>
          </div>
          <div className="flex flex-1 flex-col gap-4 p-2">
            {Object.values(providers).map((provider) => (
              <div key={provider.name}>
                <button
                  className="w-full cursor-pointer items-center justify-center p-2 font-bold ring-2 ring-white ring-opacity-5"
                  onClick={() =>
                    signIn(provider.id, {
                      // callbackUrl: "http://localhost:3000/dashboard",
                    })
                  }
                >
                  Sign in with {provider.name}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default Index;
