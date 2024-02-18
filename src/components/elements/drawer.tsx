import {
  Children,
  ComponentProps,
  ReactNode,
  createContext,
  isValidElement,
  useContext,
  useState,
} from "react";
import { Drawer as VaulDrawer } from "vaul";

const Context = createContext<{
  setOpen: (open: boolean) => void;
}>({ setOpen: () => {} });

type DrawerProps = Omit<
  ComponentProps<typeof VaulDrawer.Root>,
  "children" | "shouldScaleBackground" | "fadeFromIndex"
> & { children: ReactNode };

export const Drawer = () => <></>;
Drawer.Root = ({
  children,
  open: defaultOpen,
  dismissible,
  snapPoints,
  ...props
}: DrawerProps) => {
  const [open, setOpen] = useState<boolean>(Boolean(defaultOpen));
  const button = Children.map(children, (child) =>
    isValidElement(child) && child.type === Drawer.Button ? child : false
  );

  const content = Children.map(children, (child) =>
    isValidElement(child) && child.type === Drawer.Content ? child : false
  );

  return (
    <Context.Provider value={{ setOpen }}>
      <VaulDrawer.Root
        shouldScaleBackground
        open={dismissible ? open : undefined}
        {...props}
      >
        {button}
        <VaulDrawer.Portal>
          <VaulDrawer.Overlay className="fixed inset-0 bg-black/5 backdrop-blur-sm" />
          {content}
        </VaulDrawer.Portal>
      </VaulDrawer.Root>
    </Context.Provider>
  );
};

Drawer.Button = ({ children, ...props }: ComponentProps<"button">) => {
  const { setOpen } = useContext(Context);
  return (
    <VaulDrawer.Trigger asChild onClick={() => setOpen(true)}>
      <button {...props}>{children}</button>
    </VaulDrawer.Trigger>
  );
};

Drawer.Close = ({ children, onClick, ...props }: ComponentProps<"button">) => {
  const { setOpen } = useContext(Context);
  return (
    <button
      onClick={(e) => {
        setOpen(false);
        onClick && onClick(e);
      }}
      {...props}
    >
      {children}
    </button>
  );
};

Drawer.Content = ({ children }: { children: ReactNode }) => (
  <VaulDrawer.Content className="fixed bottom-0 left-0 right-0 mt-48 flex h-[96%] flex-col rounded-t-[10px] border-t border-gray-800 bg-white/5 ring-1 ring-white/5 backdrop-blur-sm ">
    <div className="flex-1 rounded-t-[10px] p-4">
      <div className="mx-auto mb-8 h-1.5 w-12 flex-shrink-0 rounded-full bg-gray-800" />
      {children}
    </div>
  </VaulDrawer.Content>
);
