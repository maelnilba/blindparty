import { ReactElement, ReactNode } from "react";
import Navigation from "./navigation";

export const Layout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="relative min-h-screen w-screen">
      <Navigation />
      {children}
    </div>
  );
};

export const LayoutThrough = ({ children }: { children: ReactNode }) => {
  return (
    <div className="relative min-h-screen w-screen">
      <Navigation through />
      {children}
    </div>
  );
};

export function GetLayoutThrough(page: ReactElement) {
  return <LayoutThrough>{page}</LayoutThrough>;
}
