import type { Role } from "@prisma/client";
import type { NextPage } from "next";
import type { Session } from "next-auth";
import type { ReactElement, ReactNode } from "react";

declare module "next" {
  type NextPageWithLayout<P = {}, IP = P> = NextPage<P, IP> & {
    getLayout?: (page: ReactElement) => ReactNode;
  };

  type NextPageWithTitle<P = {}, IP = P> = NextPage<P, IP> & {
    title?: ((props: P) => string | null | undefined) | string;
  };

  type NextPageWithAuth<P = {}, IP = P> = NextPage<P, IP> & {
    auth?:
      | {
          role?: Role[];
          redirect: string;
        }
      | ((session: Session | null) => {
          auth: boolean | undefined;
          isLoading?: boolean | undefined;
          redirect: string;
        });
  };
}
