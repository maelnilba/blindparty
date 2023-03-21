import { FaviconLoader } from "@components/elements/favicon-loader";
import { Layout } from "@components/layout/layout";
import type { NextPageWithLayout } from "next";
import { type Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { type AppProps, type AppType } from "next/app";
import "../styles/globals.css";
import { api } from "../utils/api";

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
