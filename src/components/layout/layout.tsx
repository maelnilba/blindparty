import { Inter } from "next/font/google";
import { ReactElement, ReactNode } from "react";
import Navigation from "./navigation";
import { Intercept } from "./routing";

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
  subscribeOnMount = true,
}: {
  children: ReactNode;
  confirmText: string;
  subscribeOnMount: boolean;
}) => {
  return (
    <Main>
      <Intercept
        confirmText={confirmText}
        subscribeOnMount={subscribeOnMount}
      />
      <Navigation />
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
  subscribeOnMount = true,
}: {
  children: ReactNode;
  confirmText: string;
  subscribeOnMount: boolean;
}) => {
  return (
    <Main>
      <Intercept
        confirmText={confirmText}
        subscribeOnMount={subscribeOnMount}
      />
      <Navigation through />
      {children}
    </Main>
  );
};

export function GetLayoutThroughConfirm(
  confirmText: string,
  subscribeOnMount: boolean = true
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
