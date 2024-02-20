import { Dialog, Transition } from "@headlessui/react";
import { noop } from "helpers/noop";
import {
  Children,
  Fragment,
  ReactNode,
  forwardRef,
  isValidElement,
  useContext,
  useImperativeHandle,
  useState,
} from "react";
import { Context, Modal } from "./modal";

export const ConfirmationModal = () => {};

type ConfirmationModalProps = {
  defaultOpen?: boolean;
  children: ReactNode;
  className?: string;
  closeOnOutside?: boolean;
};

export type ModalRef = {
  open: () => void;
  close: () => void;
};

ConfirmationModal.Root = forwardRef<ModalRef, ConfirmationModalProps>(
  (props, forwardRef) => {
    const { defaultOpen = false, closeOnOutside = true } = props;
    let [isOpen, setIsOpen] = useState(defaultOpen);

    const button = Children.map(props.children, (child) =>
      isValidElement(child) && child.type === ConfirmationModal.Trigger
        ? child
        : false
    );

    const title = Children.map(props.children, (child) =>
      isValidElement(child) && child.type === ConfirmationModal.Title
        ? child
        : false
    );

    const message = Children.map(props.children, (child) =>
      isValidElement(child) && child.type === ConfirmationModal.Message
        ? child
        : false
    );

    const actions = Children.map(props.children, (child) =>
      isValidElement(child) && child.type === ConfirmationModal.Action
        ? child
        : false
    );

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
      <Context.Provider value={{ open: openModal, close: closeModal }}>
        {button}
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
                  <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl border border-gray-800 bg-white/5 p-6 text-left align-middle shadow-xl ring-1 ring-white/5 backdrop-blur-sm transition-all">
                    {title}
                    <div className="mt-2">
                      <p className="text-sm text-gray-100">{message}</p>
                    </div>
                    <div className="mt-4 flex flex-row justify-end gap-4">
                      {actions}
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </Dialog>
        </Transition>
      </Context.Provider>
    );
  }
);

ConfirmationModal.Trigger = Modal.Trigger;

ConfirmationModal.Close = Modal.Close;

ConfirmationModal.Action = Modal.Close;

ConfirmationModal.Content = Modal.Content;

ConfirmationModal.Message = Modal.Content;

ConfirmationModal.Title = Modal.Title;

export function useModal() {
  const context = useContext(Context);

  if (context === undefined) {
    throw new Error(`useModal must be used within a Modal.Root.`);
  }
  return context;
}
