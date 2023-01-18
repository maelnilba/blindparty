import { PlusIcon } from "@components/icons/plus";
import { ensureProvider, SocialIcon } from "@components/icons/socials";
import { Modal } from "@components/modals/modal";
import Navigation from "@components/navigation";
import { useAccessSpotify } from "@hooks/useAccessSpotify";
import { useQuery } from "@tanstack/react-query";
import { api, RouterOutputs } from "@utils/api";
import type { NextPage } from "next";
import { getProviders, signIn } from "next-auth/react";

const Settings: NextPage = () => {
  const [hasSpotify, isProviderLoading] = useAccessSpotify();
  const { data: providers } = api.user.provider.useQuery();
  const { data: allProviders } = useQuery(["next-auth-providers"], () =>
    getProviders()
  );

  return (
    <div className="min-h-screen w-screen">
      <Navigation />
      <div className="flex flex-wrap gap-4 p-4 px-28">
        <div className="scrollbar-hide relative flex h-96 w-96 flex-col overflow-y-auto rounded border border-gray-800">
          <div className="sticky top-0 flex flex-row items-center justify-center gap-2 bg-black/10 p-6 font-semibold backdrop-blur-sm">
            <Modal>
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
