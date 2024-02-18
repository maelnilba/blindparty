import { Dialog, Transition } from "@headlessui/react";
import { noop } from "helpers/noop";
import {
  Children,
  ComponentProps,
  Fragment,
  ReactNode,
  createContext,
  forwardRef,
  isValidElement,
  useContext,
  useImperativeHandle,
  useState,
} from "react";

export const Modal = () => {};

type ModalProps = {
  defaultOpen?: boolean;
  children: ReactNode;
  title?: string;
  className?: string;
  closeOnOutside?: boolean;
  options?: Options;
};

type Options = {
  titleCenter?: boolean;
};

export type ModalRef = {
  open: () => void;
  close: () => void;
};

const Context = createContext<ModalRef>({ open() {}, close() {} });

Modal.Root = forwardRef<ModalRef, ModalProps>((props, forwardRef) => {
  const { defaultOpen = false, title, closeOnOutside = true } = props;
  let [isOpen, setIsOpen] = useState(defaultOpen);

  const button = Children.map(props.children, (child) =>
    isValidElement(child) && child.type === Modal.Button ? child : null
  )
    ?.filter(Boolean)
    .at(0);

  const content = Children.map(props.children, (child) =>
    isValidElement(child) && child.type === Modal.Content ? child : null
  )
    ?.filter(Boolean)
    .at(0);

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
    </Context.Provider>
  );
});

Modal.Button = ({ children, onClick, ...props }: ComponentProps<"button">) => {
  const { open } = useModal();
  return (
    <button
      onClick={(e) => {
        open();
        onClick?.(e);
      }}
      {...props}
    >
      {children}
    </button>
  );
};

Modal.Content = ({ children }: { children: ReactNode }) => {
  return <>{children}</>;
};

export function useModal() {
  const context = useContext(Context);

  if (context === undefined) {
    throw new Error(`useModal must be used within a Modal.Root.`);
  }
  return context;
}
