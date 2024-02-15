import type { Role } from "@prisma/client";
import type {
  NextComponentType,
  NextPageContext,
  NextLayoutComponentType,
  NextPage,
} from "next";
import type { AppProps } from "next/app";
import type { ReactElement, ReactNode } from "react";
import type { Session } from "next-auth";
import { NextRouter } from "next/router";

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
