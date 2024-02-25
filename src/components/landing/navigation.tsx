import { Transition } from "@headlessui/react";
import { useMotionValueEvent, useScroll } from "framer-motion";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Fragment, useState } from "react";

export const Navigation = () => {
  const { scrollYProgress, scrollY } = useScroll();

  const [visible, setVisible] = useState(true);

  useMotionValueEvent(scrollYProgress, "change", (current) => {
    if (typeof current === "number" && scrollY.get() > window.innerHeight) {
      let direction = current! - scrollYProgress.getPrevious()!;

      if (scrollYProgress.get() < 0.05) {
        setVisible(false);
      } else {
        if (direction < 0) {
          setVisible(true);
        } else {
          setVisible(false);
        }
      }
    }
  });

  return (
    <Transition appear show={visible} as={Fragment}>
      <Transition.Child
        as={Fragment}
        enter="ease-out duration-300"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="ease-in duration-200"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <div className="fixed top-0 z-navigation flex h-20 w-full flex-row items-center justify-around bg-black/5 p-6 backdrop-blur-sm">
          <Link
            href="/"
            className="text-4xl font-extrabold transition-transform hover:scale-105"
          >
            BlindParty
          </Link>
          <div className="flex-1"></div>
          <div>
            <button
              className="rounded-full bg-white px-10 py-3 font-semibold text-black no-underline transition-transform hover:scale-105 max-sm:px-3 max-sm:py-1.5 max-sm:text-xs"
              onClick={() => void signIn()}
            >
              Se connecter
            </button>
          </div>
        </div>
      </Transition.Child>
    </Transition>
  );
};
