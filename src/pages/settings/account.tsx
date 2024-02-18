import { Divider } from "@components/elements/divider";
import { ImageUpload, ImageUploadRef } from "@components/elements/image-upload";
import { Modal } from "@components/elements/modal";
import { PlusIcon } from "@components/icons/plus";
import { SignIn } from "@components/icons/sign-in";
import { SocialIcon, ensureProvider } from "@components/icons/socials";
import { AuthGuardUser } from "@components/layout/auth";
import { useSubmit } from "@hooks/form/useSubmit";
import { useQuery } from "@tanstack/react-query";
import { RouterOutputs, api } from "@utils/api";
import { getNextAuthProviders } from "@utils/next-auth";
import { useF0rm } from "modules/f0rm";
import type { NextPageWithAuth, NextPageWithTitle } from "next";
import { signIn, useSession } from "next-auth/react";
import { ReactNode, useRef } from "react";
import { z } from "zod";

const editSchema = z.object({
  name: z
    .string()
    .min(3, { message: "Un pseudo doit contenir au minimum 3 caractère." }),
});

const Settings: NextPageWithAuth & NextPageWithTitle = () => {
  const { update, data: session } = useSession();
  const { data: accounts } = api.user.accounts.useQuery();
  const { data: allProviders } = useQuery(["next-auth-providers"], () =>
    getNextAuthProviders()
  );
  const { data: user, isLoading } = api.user.me.useQuery();

  const { mutateAsync: edit } = api.user.edit.useMutation({
    onSuccess: async () => {
      const x = await update();
      console.log(x);
    },
  });

  const imageUpload = useRef<ImageUploadRef | null>(null);
  const { submitPreventDefault, isSubmitting } = useSubmit<typeof editSchema>(
    async (e) => {
      if (!e.success) return;
      if (!user) throw new Error("Should have user");

      let s3key = user?.s3key ?? getS3key(user.image);
      if (imageUpload.current && imageUpload.current.local) {
        await imageUpload.current.upload(s3key);
      }

      await edit({
        name: e.data.name,
        s3key: imageUpload.current ? imageUpload.current.key : undefined,
      });
    }
  );

  const f0rm = useF0rm(editSchema, submitPreventDefault);

  return (
    <div className="flex flex-wrap gap-4 p-4 px-28">
      <div className="scrollbar-hide relative flex h-96 w-96 flex-col overflow-y-auto rounded border border-gray-800">
        <div className="sticky top-0 flex flex-row items-center justify-center gap-2 bg-black/10 p-6 backdrop-blur-sm">
          <Modal.Root
            title="Liste des providers"
            options={{ titleCenter: true }}
          >
            <Modal.Button className="w-full rounded-full bg-white px-6 py-1 text-center text-lg font-semibold text-black no-underline transition-transform hover:scale-105">
              Lié un compte
            </Modal.Button>
            <div className="scrollbar-hide relative flex h-96 w-96 flex-col gap-2 overflow-y-auto">
              <div className="flex-1 p-2">
                {allProviders && accounts?.providers && (
                  <div className="flex flex-col gap-2">
                    {allProviders
                      .filter(
                        (provider) =>
                          !accounts.providers.includes(
                            ensureProvider(provider.name.toLocaleLowerCase())
                          )
                      )
                      .map((provider) => (
                        <ProviderBanner
                          key={provider.id}
                          provider={ensureProvider(
                            provider.name.toLocaleLowerCase()
                          )}
                        >
                          <PlusIcon
                            onClick={() => {
                              signIn(provider.id, {
                                // callbackUrl: "http://localhost:3000/dashboard",
                              });
                            }}
                            className="h-6 w-6 cursor-pointer group-hover:scale-125"
                          />
                        </ProviderBanner>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </Modal.Root>
        </div>
        <div className="flex flex-1 flex-col gap-2 p-2">
          {accounts?.platform && (
            <ProviderBanner provider={accounts.platform} />
          )}
          <Divider />
          {accounts?.providers
            .filter((provider) => provider !== accounts.platform)
            .map((provider, idx) => (
              <ProviderBanner key={idx} provider={provider}>
                <SignIn
                  onClick={() => {
                    signIn(provider, {
                      // callbackUrl: "http://localhost:3000/dashboard",
                    });
                  }}
                  className="h-6 w-6 cursor-pointer group-hover:scale-125"
                />
              </ProviderBanner>
            ))}
        </div>
      </div>
      <div className="scrollbar-hide relative flex h-96 w-96 flex-col overflow-y-auto rounded border border-gray-800">
        <div className="sticky top-0 flex flex-row items-center justify-center gap-2 bg-black/10 p-6 font-semibold backdrop-blur-sm">
          <button
            disabled={isSubmitting || isLoading}
            type="submit"
            form="edit-user"
            className="w-full rounded-full bg-white px-6 py-1 text-center text-lg font-semibold text-black no-underline transition-transform hover:scale-105 disabled:opacity-75"
          >
            Sauvegarder
          </button>
        </div>
        <div className="flex flex-1 flex-col gap-2 p-2">
          <div className="flex justify-center gap-4">
            <ImageUpload
              src={session?.user?.image}
              ref={imageUpload}
              className="flex-1"
              prefix="user"
              presignedOptions={{ autoResigne: true, expires: 60 * 5 }}
            />
            <form
              onSubmit={f0rm.form.submit}
              id="edit-user"
              className="flex h-full flex-[2] flex-col gap-2"
            >
              <div>
                <label
                  htmlFor={f0rm.fields.name().name()}
                  className="font-semibold"
                >
                  Nom
                </label>
                <input
                  defaultValue={session?.user?.name ?? ""}
                  name={f0rm.fields.name().name()}
                  id={f0rm.fields.name().name()}
                  data-error={!!f0rm.errors.name().errors()?.length}
                  className="block w-full rounded-lg border border-gray-800 bg-black p-2.5 text-white focus:border-gray-500 focus:outline-none focus:ring-gray-500 data-[error=true]:border-red-500"
                />
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

type Provider = RouterOutputs["user"]["accounts"]["providers"][number];
type ProviderBanner = {
  provider: Provider;
  children?: ReactNode;
};
const ProviderBanner = ({ provider, children }: ProviderBanner) => {
  return (
    <div className="group flex items-center justify-center gap-4 p-2 font-bold ring-2 ring-white ring-opacity-5">
      <SocialIcon provider={provider} />
      <div className="grow">
        <span className="block overflow-hidden truncate text-ellipsis font-bold capitalize tracking-tighter">
          {provider}
        </span>
      </div>
      {children}
    </div>
  );
};

export default Settings;
Settings.auth = AuthGuardUser;
Settings.title = "Account";

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
