import { getBaseUrl } from "@lib/helpers/base-url";
import { getServerAuthSession } from "@server/auth";
import { getNextAuthProviders } from "@utils/next-auth";
import type {
  GetServerSidePropsContext,
  InferGetServerSidePropsType,
  NextPage,
} from "next";
import type { BuiltInProviderType } from "next-auth/providers";
import type { ClientSafeProvider, LiteralUnion } from "next-auth/react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/router";
import { z } from "zod";

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const providers = await getNextAuthProviders();
  const session = await getServerAuthSession({
    req: context.req,
    res: context.res,
  });

  if (session && session.user && session.user.role !== "ANON") {
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

const querySchema = z.object({
  callbackUrl: z.string().url().optional(),
  error: z
    .enum([
      "OAuthSignin",
      "OAuthCallback",
      "OAuthCreateAccount",
      "EmailCreateAccount",
      "Callback",
      "OAuthAccountNotLinked",
      "EmailSignin",
      "CredentialsSignin",
      "SessionRequired",
      "Default",
    ])
    .optional(),
  redirect_to: z.string().optional(),
});

const Index: NextPage<
  InferGetServerSidePropsType<typeof getServerSideProps>
> = ({ providers }) => {
  const { query: qu } = useRouter();
  const query = querySchema.parse(qu);

  if (!providers) return <div>No provider found!</div>;
  return (
    <div className="flex h-full min-h-screen w-screen items-center justify-center">
      <div className="scrollbar-hide flex h-96 w-96 flex-col gap-2 overflow-y-auto text-center">
        <div className="sticky top-0 flex flex-col gap-2 bg-black/10 py-2 backdrop-blur-sm">
          <div className="text-6xl font-bold">Inscription</div>
        </div>
        <div className="flex flex-1 flex-col gap-4 p-2">
          {providers.map((provider) => (
            <div key={provider.name}>
              <button
                className="w-full cursor-pointer items-center justify-center p-2 font-bold ring-2 ring-white ring-opacity-5"
                onClick={() =>
                  signIn(provider.id, {
                    callbackUrl: query.redirect_to
                      ? `${getBaseUrl()}${query.redirect_to}`
                      : query.callbackUrl,
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
  );
};

export default Index;
