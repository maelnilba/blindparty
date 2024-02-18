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

export const AsyncModal = () => {};

type AsyncModalProps = {
  children: ReactNode;
  beforeOpen: (...args: any) => Promise<any>;
  closeOnOutside?: boolean;
};

export type AsyncModalRef = {
  open: () => void;
  close: () => void;
};

const Context = createContext<AsyncModalRef>({ open() {}, close() {} });

AsyncModal.Root = forwardRef<AsyncModalRef, AsyncModalProps>(
  (props, forwardRef) => {
    const { closeOnOutside = true } = props;
    let [isOpen, setIsOpen] = useState(false);

    const button = Children.map(props.children, (child) =>
      isValidElement(child) && child.type === AsyncModal.Trigger ? child : null
    )
      ?.filter(Boolean)
      .at(0);

    const content = Children.map(props.children, (child) =>
      isValidElement(child) && child.type === AsyncModal.Content ? child : null
    )
      ?.filter(Boolean)
      .at(0);

    const title = Children.map(props.children, (child) =>
      isValidElement(child) && child.type === AsyncModal.Title ? child : null
    )
      ?.filter(Boolean)
      .at(0);

    function closeModal() {
      setIsOpen(false);
    }

    function openModal() {
      props.beforeOpen().then(() => setIsOpen(true));
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
                    {title}
                    {content}
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

AsyncModal.Trigger = ({
  children,
  onClick,
  ...props
}: ComponentProps<"button">) => {
  const { open } = useAsyncModal();
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

AsyncModal.Content = ({ children }: { children: ReactNode }) => {
  return <>{children}</>;
};

AsyncModal.Title = ({
  children,
  ...props
}: ComponentProps<typeof Dialog.Title> & { children: ReactNode }) => {
  return (
    <Dialog.Title {...props}>
      <span className="block truncate text-ellipsis">{children}</span>
    </Dialog.Title>
  );
};

export function useAsyncModal() {
  const context = useContext(Context);

  if (context === undefined) {
    throw new Error(`useAsyncModal must be used within a Modal.Root.`);
  }
  return context;
}
