import { Picture } from "@components/images/picture";
import { Menu, Transition } from "@headlessui/react";
import { useWindowConfirmation } from "@hooks/next/useWindowConfirmation";
import { signIn, signOut, useSession } from "next-auth/react";
import Link from "next/link";

type NavigationProps = {
  through?: boolean;
};

const Navigation = ({ through = false }: NavigationProps) => {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="flex h-20 flex-row items-center justify-around p-6">
        <p className="text-4xl font-extrabold">BlindParty</p>
        <div className="flex-1"></div>
      </div>
    );
  }

  if (session && session.user) {
    return (
      <>
        <div className="fixed top-0 z-navigation flex h-20 w-full flex-row items-center justify-around bg-black/5 p-6 backdrop-blur-sm">
          <Link
            href="/dashboard"
            className="text-4xl font-extrabold transition-transform hover:scale-105"
          >
            BlindParty
          </Link>
          <div className="flex-1"></div>
          <div className="flex flex-row items-center gap-4">
            <Link href="/help" className="font-bold hover:opacity-75">
              Aide
            </Link>
            <Menu as="div" className="relative z-50 inline-block">
              <Menu.Button>
                <Transition
                  show
                  appear
                  enter="transition-opacity duration-500"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="transition-opacity duration-1000"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <Picture
                    identifier={session.user.image}
                    className="shrink-0 cursor-pointer hover:ring-gray-300"
                  >
                    <img
                      alt={`profile picture of ${
                        session.user.name || "unknown"
                      }`}
                      src={session.user.image || ""}
                      className="aspect-square h-12 w-12 rounded border-gray-800 object-cover"
                    />
                  </Picture>
                </Transition>
              </Menu.Button>
              <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right rounded-md bg-black/80 ring-4 ring-white ring-opacity-5 backdrop-blur-sm focus:outline-none">
                <Menu.Item>
                  {({ active }) => (
                    <Link
                      className={`${
                        active ? "opacity-75" : ""
                      } group flex w-full items-center rounded-md p-4 text-sm ring-2 ring-white ring-opacity-5`}
                      href="/settings/account"
                    >
                      Profil
                    </Link>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <button
                      className={`${
                        active ? "opacity-75" : ""
                      } group flex w-full items-center rounded-md p-4 text-sm ring-2 ring-white ring-opacity-5`}
                      onClick={() =>
                        void signOut({
                          callbackUrl: "/",
                        })
                      }
                    >
                      Se déconnecter
                    </button>
                  )}
                </Menu.Item>
              </Menu.Items>
            </Menu>
          </div>
        </div>
        {!through && <div className="flex h-20 w-full"></div>}
      </>
    );
  }

  return (
    <>
      <div className="fixed top-0 z-navigation flex h-20 w-full flex-row items-center justify-around bg-black/5 p-6 backdrop-blur-sm">
        <p className="text-4xl font-extrabold">BlindParty</p>
        <div className="flex-1"></div>
        <div>
          <button
            className="rounded-full bg-white px-10 py-3 font-semibold text-black no-underline transition-transform hover:scale-105"
            onClick={() => void signIn()}
          >
            Se connecter
          </button>
        </div>
      </div>
      {!through && <div className="flex h-20 w-full"></div>}
    </>
  );
};

export default Navigation;
