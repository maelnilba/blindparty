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

declare module "next" {
  type NextPageWithLayout<P = {}, IP = P> = NextPage<P, IP> & {
    getLayout?: (page: ReactElement) => ReactNode;
  };

  type NextPageWithAuth<P = {}, IP = P> = NextPage<P, IP> & {
    auth?:
      | {
          role?: Role[];
          redirect: string;
        }
      | ((session: Session | null) => {
          auth: boolean | undefined;
          isLoading: boolean | undefined;
          redirect: string;
        });
  };
}
