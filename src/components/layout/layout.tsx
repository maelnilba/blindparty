import { Inter } from "next/font/google";
import { ReactElement, ReactNode, useEffect } from "react";
import Navigation from "./navigation";
import { useWindowConfirmationStore } from "@hooks/next/useWindowConfirmation";

const inter = Inter({ subsets: ["latin"], display: "swap" });

const Main = ({ children }: { children: ReactNode }) => (
  <main className={inter.className}>
    <div className="relative flex min-h-screen w-screen flex-col">
      {children}
    </div>
  </main>
);

export const Layout = ({ children }: { children: ReactNode }) => {
  return (
    <Main>
      <Navigation />
      {children}
    </Main>
  );
};

export const LayoutThrough = ({ children }: { children: ReactNode }) => {
  return (
    <Main>
      <Navigation through />
      {children}
    </Main>
  );
};

export function GetLayoutThrough(page: ReactElement) {
  return <LayoutThrough>{page}</LayoutThrough>;
}

export const LayoutConfirm = ({
  children,
  confirmText,
  subscribeOnMount = false,
}: {
  children: ReactNode;
  confirmText: string;
  subscribeOnMount: boolean;
}) => {
  const sub = useWindowConfirmationStore((state) => state.subscribe);
  const unsub = useWindowConfirmationStore((state) => state.unsubscribe);

  useEffect(() => {
    if (subscribeOnMount) sub();
    return () => unsub();
  }, [subscribeOnMount]);

  return (
    <Main>
      <Navigation confirm={confirmText} />
      {children}
    </Main>
  );
};

export function GetLayoutConfirm(
  confirmText: string,
  subscribeOnMount: boolean = false
) {
  return function (page: ReactElement) {
    return (
      <LayoutConfirm
        confirmText={confirmText}
        subscribeOnMount={subscribeOnMount}
      >
        {page}
      </LayoutConfirm>
    );
  };
}

export const LayoutThroughConfirm = ({
  children,
  confirmText,
  subscribeOnMount = false,
}: {
  children: ReactNode;
  confirmText: string;
  subscribeOnMount: boolean;
}) => {
  const sub = useWindowConfirmationStore((state) => state.subscribe);
  const unsub = useWindowConfirmationStore((state) => state.unsubscribe);

  useEffect(() => {
    if (subscribeOnMount) sub();
    return () => unsub();
  }, [subscribeOnMount]);

  return (
    <Main>
      <Navigation through confirm={confirmText} />
      {children}
    </Main>
  );
};

export function GetLayoutThroughConfirm(
  confirmText: string,
  subscribeOnMount: boolean = false
) {
  return function (page: ReactElement) {
    return (
      <LayoutThroughConfirm
        confirmText={confirmText}
        subscribeOnMount={subscribeOnMount}
      >
        {page}
      </LayoutThroughConfirm>
    );
  };
}
