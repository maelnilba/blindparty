import { ImageUpload, ImageUploadRef } from "@components/elements/image-upload";
import { PlusIcon } from "@components/icons/plus";
import { ensureProvider, SocialIcon } from "@components/icons/socials";
import { Modal } from "@components/modals/modal";
import Navigation from "@components/navigation";
import { getServerAuthSession } from "@server/auth";
import { useQuery } from "@tanstack/react-query";
import { api, RouterOutputs } from "@utils/api";
import type {
  GetServerSidePropsContext,
  InferGetServerSidePropsType,
  NextPage,
} from "next";
import { getProviders, signIn } from "next-auth/react";
import { useRef } from "react";
import { useZorm } from "react-zorm";
import { z } from "zod";

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getServerAuthSession({
    req: context.req,
    res: context.res,
  });

  if (!session || !session.user) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  return {
    props: { user: session.user },
  };
}

const editSchema = z.object({
  name: z.string().min(1),
});

const Settings: NextPage<
  InferGetServerSidePropsType<typeof getServerSideProps>
> = ({ user: _user }) => {
  const { data: providers } = api.user.provider.useQuery();
  const { data: allProviders } = useQuery(["next-auth-providers"], () =>
    getProviders()
  );
  const { data: __user, refetch } = api.user.me.useQuery();
  const { mutate: edit } = api.user.edit.useMutation({
    onSuccess: () => {
      refetch();

      // Hack for reload the next-auth session
      const event = new Event("visibilitychange");
      document.dispatchEvent(event);
    },
  });

  const imageUpload = useRef<ImageUploadRef | null>(null);
  const zo = useZorm("edit", editSchema, {
    async onValidSubmit(e) {
      e.preventDefault();

      let s3key = __user?.s3key ?? getS3key(_user.image);
      if (imageUpload.current && imageUpload.current.changed) {
        await imageUpload.current.upload(s3key);
      }

      edit({
        name: e.data.name,
        s3key: imageUpload.current ? imageUpload.current.key : undefined,
      });
    },
  });

  const user = __user ? __user : _user;

  return (
    <div className="relative min-h-screen w-screen">
      <Navigation />
      <div className="flex flex-wrap gap-4 p-4 px-28">
        <div className="scrollbar-hide relative flex h-96 w-96 flex-col overflow-y-auto rounded border border-gray-800">
          <div className="sticky top-0 flex flex-row items-center justify-center gap-2 bg-black/10 p-6 font-semibold backdrop-blur-sm">
            <Modal className="w-full">
              <button className="w-full rounded-full bg-white px-6 py-1 text-center text-lg font-semibold text-black no-underline transition-transform hover:scale-105">
                Lié un compte
              </button>
              <div className="scrollbar-hide relative flex h-96 w-96 flex-col gap-2 overflow-y-auto">
                <div className="sticky top-0 flex flex-col gap-2 bg-black/10 font-semibold backdrop-blur-sm">
                  <div className="w-full rounded-full px-6 py-1 text-center text-lg font-semibold no-underline ring-2 ring-white ring-opacity-5">
                    Liste des providers
                  </div>
                </div>
                <div className="flex-1 p-2">
                  {allProviders && providers && (
                    <div className="flex flex-col gap-2">
                      {Object.values(allProviders)
                        .filter(
                          (provider) =>
                            !providers.includes(
                              ensureProvider(provider.name.toLocaleLowerCase())
                            )
                        )
                        .map((provider) => (
                          <ProviderCard
                            key={provider.id}
                            provider={ensureProvider(
                              provider.name.toLocaleLowerCase()
                            )}
                            onClick={() => {
                              signIn(provider.id, {
                                // callbackUrl: "http://localhost:3000/dashboard",
                              });
                            }}
                          />
                        ))}
                    </div>
                  )}
                </div>
              </div>
            </Modal>
          </div>
          <div className="flex flex-1 flex-col gap-2 p-2">
            {providers?.map((provider, idx) => (
              <ProviderCard key={idx} provider={provider} />
            ))}
          </div>
        </div>
        <div className="scrollbar-hide relative flex h-96 w-96 flex-col overflow-y-auto rounded border border-gray-800">
          <div className="sticky top-0 flex flex-row items-center justify-center gap-2 bg-black/10 p-6 font-semibold backdrop-blur-sm">
            <button
              type="submit"
              form="edit-user"
              className="w-full rounded-full bg-white px-6 py-1 text-center text-lg font-semibold text-black no-underline transition-transform hover:scale-105"
            >
              Sauvegarder
            </button>
          </div>
          <div className="flex flex-1 flex-col gap-2 p-2">
            <div className="flex justify-center gap-4">
              <ImageUpload
                src={user.image}
                ref={imageUpload}
                className="flex-1"
                prefix="user"
                presignedOptions={{ autoResigne: true, expires: 60 * 5 }}
              />
              <form
                ref={zo.ref}
                id="edit-user"
                className="flex h-full flex-[2] flex-col gap-2"
              >
                <div>
                  <label htmlFor={zo.fields.name()} className="font-semibold">
                    Nom
                  </label>
                  <input
                    defaultValue={user.name ?? ""}
                    name={zo.fields.name()}
                    id={zo.fields.name()}
                    className="block w-full rounded-lg border border-gray-800 bg-black p-2.5 text-sm text-white focus:border-gray-500 focus:outline-none focus:ring-gray-500"
                  />
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

type Provider = RouterOutputs["user"]["provider"][number];
type ProviderCardProps = {
  provider: Provider;
  onClick?: () => void;
};
const ProviderCard = ({ provider, onClick }: ProviderCardProps) => {
  return (
    <div className="group flex cursor-pointer items-center justify-center gap-4 p-2 font-bold ring-2 ring-white ring-opacity-5">
      <SocialIcon provider={provider} />
      <div className="inline-block w-3/4">
        <span className="block overflow-hidden truncate text-ellipsis capitalize">
          {provider}
        </span>
      </div>
      {onClick && (
        <PlusIcon onClick={onClick} className="h-6 w-6 group-hover:scale-125" />
      )}
    </div>
  );
};

export default Settings;

const getS3key = (url: string | null | undefined) => {
  if (!url) return undefined;

  const _url = new URL(url);
  if (
    _url.hostname ===
    `${process.env.NEXT_PUBLIC_AWS_S3_BUCKET_NAME}.s3.${process.env.NEXT_PUBLIC_APP_AWS_REGION}.amazonaws.com`
  )
    return _url.pathname.substring(1);
  else return undefined;
};
