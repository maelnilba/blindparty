import { Picture } from "@components/images/picture";
import { Transition } from "@headlessui/react";
import { RouterOutputs } from "@utils/api";
import { useEffect, useState } from "react";

type WinnerTileProps = {
  player: RouterOutputs["party"]["game"]["guess"]["winner"] | null;
};

export const WinnerTile = ({ player }: WinnerTileProps) => {
  const [tileAppear, setTileAppear] = useState(false);
  const [thumbAppear, setThumbAppear] = useState(false);
  useEffect(() => {
    setTileAppear(!!player);
  }, [player]);

  return (
    <div className="pointer-events-none relative mt-2">
      <Transition
        show={tileAppear}
        enter="transition-all duration-500 ease-out"
        enterFrom="opacity-0 -translate-x-28"
        enterTo="opacity-100 -translate-x-0"
        afterEnter={() => setThumbAppear(true)}
        leave="transition-all duration-1000 ease-in"
        leaveFrom="opacity-100 -translate-x-0"
        leaveTo="opacity-0 -translate-x-28"
      >
        <Picture identifier={player?.user?.image} className="shrink-0">
          <img
            alt={`playlist picture of ${player?.user.name}`}
            src={player?.user.image!}
            className="aspect-square h-14 w-14 rounded border-gray-800 object-cover"
          />
        </Picture>
      </Transition>
      <Transition
        show={thumbAppear}
        enter="transition-all duration-300 delay-75 ease-out"
        enterFrom="opacity-0 -translate-y-14"
        enterTo="opacity-100 -translate-y-28"
        afterEnter={() => {
          setThumbAppear(false);
        }}
        afterLeave={() => {
          setTileAppear(false);
        }}
        leave="transition-all duration-500 ease-in"
        leaveFrom="opacity-100 -translate-y-28"
        leaveTo="opacity-0 -translate-y-14"
      >
        <div className="flex h-14 w-14 items-center justify-center text-4xl font-extrabold">
          +1
        </div>
      </Transition>
    </div>
  );
};
