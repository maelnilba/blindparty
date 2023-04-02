import { FaviconLoader } from "@components/elements/favicon-loader";
import { Auth } from "@components/layout/auth";
import { Layout } from "@components/layout/layout";
import type { NextPageWithAuth, NextPageWithLayout } from "next";
import { type Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { type AppProps, type AppType } from "next/app";
import "../styles/globals.css";
import { api } from "../utils/api";

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout & NextPageWithAuth;
};

const MyApp: AppType<{ session: Session | null }> = ({
  Component,
  pageProps: { session, ...pageProps },
}: AppPropsWithLayout) => {
  const getLayout = Component.getLayout ?? ((page) => <Layout>{page}</Layout>);
  const layout = getLayout(<Component {...pageProps} />);
  return (
    <SessionProvider session={session}>
      {Component.auth ? <Auth auth={Component.auth}>{layout}</Auth> : layout}
      <FaviconLoader />
    </SessionProvider>
  );
};

export default api.withTRPC(MyApp);
