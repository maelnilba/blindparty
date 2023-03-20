import { type AppProps, type AppType } from "next/app";
import { type Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { api } from "../utils/api";
import "../styles/globals.css";
import { FaviconLoader } from "@components/elements/favicon-loader";
import { Layout } from "@components/layout/layout";
import type { NextPage } from "next";
import type { ReactElement, ReactNode } from "react";

export type NextPageWithLayout<P = {}, IP = P> = NextPage<P, IP> & {
  getLayout?: (page: ReactElement) => ReactNode;
};

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};

const MyApp: AppType<{ session: Session | null }> = ({
  Component,
  pageProps: { session, ...pageProps },
}: AppPropsWithLayout) => {
  const getLayout = Component.getLayout ?? ((page) => <Layout>{page}</Layout>);
  const layout = getLayout(<Component {...pageProps} />);
  return (
    <SessionProvider session={session}>
      {layout} <FaviconLoader />
    </SessionProvider>
  );
};

export default api.withTRPC(MyApp);
