import { Dialog, Transition } from "@headlessui/react";
import { nothing } from "@lib/helpers/nothing";
import {
  forwardRef,
  Fragment,
  ReactElement,
  useImperativeHandle,
  useState,
} from "react";

type ConfirmationModalProps = {
  defaultOpen?: boolean;
  children?: ReactElement;
  title?: string;
  message?: string;
  actions?: [string, string] | [string];
  onSuccess: () => void;
  className?: string;
  closeOnOutside?: boolean;
};

export type ModalRef = {
  open: () => void;
  close: () => void;
};

export const ConfirmationModal = forwardRef<ModalRef, ConfirmationModalProps>(
  (props, forwardRef) => {
    const {
      defaultOpen = false,
      title,
      message,
      actions,
      onSuccess,
      closeOnOutside = true,
    } = props;
    let [isOpen, setIsOpen] = useState(defaultOpen);

    function closeModal() {
      setIsOpen(false);
    }

    function openModal() {
      setIsOpen(true);
    }

    useImperativeHandle(
      forwardRef,
      () => ({
        open: openModal,
        close: closeModal,
      }),
      []
    );

    return (
      <>
        {props.children && (
          <div
            onClickCapture={(e) => {
              e.stopPropagation();
              openModal();
            }}
            className={props.className}
          >
            {props.children}
          </div>
        )}

        <Transition appear show={isOpen} as={Fragment}>
          <Dialog
            as="div"
            className="relative z-10"
            onClose={closeOnOutside ? closeModal : nothing}
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
                  <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl border border-gray-800 bg-black/80 p-6 text-left align-middle shadow-xl ring-1 ring-white/5 backdrop-blur-sm transition-all">
                    <Dialog.Title
                      as="h3"
                      className="text-lg font-medium leading-6"
                    >
                      {title}
                    </Dialog.Title>
                    <div className="mt-2">
                      <p className="text-sm text-gray-100">{message}</p>
                    </div>
                    <div className="mt-4 flex flex-row justify-end gap-4">
                      {actions?.map((action, index, self) => (
                        <button
                          type="button"
                          className="rounded-full bg-white px-6 py-1 text-center text-lg font-semibold text-black no-underline transition-transform hover:scale-105"
                          onClick={() => {
                            closeModal();
                            if (index === self.length - 1) onSuccess();
                          }}
                        >
                          {action || "OK"}
                        </button>
                      ))}
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </Dialog>
        </Transition>
      </>
    );
  }
);
