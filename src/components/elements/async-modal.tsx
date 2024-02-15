import { Dialog, Transition } from "@headlessui/react";
import { Children, Fragment, isValidElement, ReactNode, useState } from "react";
import type { Element } from "./types";
import { noop } from "helpers/noop";

type AsyncModalProps = {
  children: ReactNode;
  title?: string;
  beforeOpen: (...args: any) => Promise<any>;
  closeOnOutside?: boolean;
  options?: Options;
};

type Options = {
  titleCenter?: boolean;
};

export function AsyncModal(props: AsyncModalProps) {
  const { title, closeOnOutside = true } = props;
  let [isOpen, setIsOpen] = useState(false);

  const [button, content] = Children.toArray(props.children).reduce<
    [Element | null | undefined, Element[]]
  >(
    (prev, child) => {
      if (isValidElement(child)) {
        if (child.type === "button") {
          prev[0] = child;
        } else {
          prev[1].push(child);
        }
      }
      return prev;
    },
    [null, []]
  );
  function closeModal() {
    setIsOpen(false);
  }

  function openModal() {
    props.beforeOpen().then(() => setIsOpen(true));
  }

  return (
    <>
      <div
        onClickCapture={(e) => {
          e.stopPropagation();
          openModal();
        }}
      >
        {button}
      </div>

      <Transition appear show={isOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-10"
          onClose={closeOnOutside ? closeModal : noop}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center text-white">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95 translate-y-4"
                enterTo="opacity-100 scale-100 translate-y-0"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100 translate-y-0"
                leaveTo="opacity-0 scale-95 translate-y-4"
              >
                <Dialog.Panel className="transform overflow-hidden rounded-2xl border border-gray-800 bg-white/5 p-6 text-left align-middle shadow-xl ring-1 ring-white/5 backdrop-blur-sm transition-all">
                  <Dialog.Title
                    as="h3"
                    className={`mb-2 inline-block w-full max-w-sm text-lg font-medium leading-6 ${
                      props.options?.titleCenter && "text-center"
                    }`}
                  >
                    <span className="block truncate text-ellipsis">
                      {title}
                    </span>
                  </Dialog.Title>
                  {content}
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}
