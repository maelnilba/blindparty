import { Inter } from "next/font/google";
import { ReactElement, ReactNode } from "react";
import Navigation from "./navigation";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const Layout = ({ children }: { children: ReactNode }) => {
  return (
    <main className={inter.className}>
      <div className="relative flex min-h-screen w-screen flex-col">
        <Navigation />
        {children}
      </div>
    </main>
  );
};

export const LayoutThrough = ({ children }: { children: ReactNode }) => {
  return (
    <main className={inter.className}>
      <div className="relative flex min-h-screen w-screen flex-col">
        <Navigation through />
        {children}
      </div>
    </main>
  );
};

export function GetLayoutThrough(page: ReactElement) {
  return <LayoutThrough>{page}</LayoutThrough>;
}
