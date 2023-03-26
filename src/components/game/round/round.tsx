import { Transition } from "@headlessui/react";
import { ComponentProps, PropsWithChildren } from "react";

type RoundProps = PropsWithChildren<ComponentProps<"div">> & {
  round: number;
};
export const Round = ({ round, ...props }: RoundProps) => {
  return (
    <div {...props} key={round}>
      <Transition
        show
        appear
        enter="transition-all duration-500 ease-out"
        enterFrom="opacity-0 scale-0"
        enterTo="opacity-100 scale-100"
        leave="transition-all duration-1000 ease-in"
        leaveFrom="opacity-100 scale-100"
        leaveTo="opacity-0 scale-0"
      >
        <div className="flex h-20 w-20 items-center justify-center rounded border border-gray-800">
          <p className="text-4xl font-extrabold">{round}</p>
        </div>
      </Transition>
    </div>
  );
};
