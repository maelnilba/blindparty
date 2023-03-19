import { Menu, Transition } from "@headlessui/react";
import { signIn, signOut, useSession } from "next-auth/react";
import Link from "next/link";

const Navigation: React.FC = () => {
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
      <div className="flex h-20 flex-row items-center justify-around p-6">
        <Link
          href="/dashboard"
          className="text-4xl font-extrabold transition-transform hover:scale-105"
        >
          BlindParty
        </Link>
        <div className="flex-1"></div>
        <div className="flex flex-row items-center gap-4">
          <Link href="/help" className="font-bold hover:opacity-75">
            Help
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
                <picture className="cursor-pointer hover:ring-gray-300">
                  <img
                    alt={`profile picture of ${session.user.name || "unknown"}`}
                    src={session.user.image || ""}
                    className="aspect-square h-12 w-12 rounded-sm border-gray-800 object-cover"
                  />
                </picture>
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
                    Settings
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
                    Sign Out
                  </button>
                )}
              </Menu.Item>
            </Menu.Items>
          </Menu>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-20 flex-row items-center justify-around p-6">
      <p className="text-4xl font-extrabold">BlindParty</p>
      <div className="flex-1"></div>
      <div>
        <button
          className="rounded-full bg-white px-10 py-3 font-semibold text-black no-underline transition-transform hover:scale-105"
          onClick={() => void signIn()}
        >
          Sign in
        </button>
      </div>
    </div>
  );
};

export default Navigation;
