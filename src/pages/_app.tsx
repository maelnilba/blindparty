import { FaviconLoader } from "@components/elements/favicon-loader";
import { Auth } from "@components/layout/auth";
import { Layout } from "@components/layout/layout";
import type {
  NextPageWithAuth,
  NextPageWithLayout,
  NextPageWithTitle,
} from "next";
import { type Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { type AppProps, type AppType } from "next/app";
import "../styles/globals.css";
import { api } from "../utils/api";
import { Title } from "@components/layout/title";

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout & NextPageWithAuth & NextPageWithTitle;
};

const MyApp: AppType<{ session: Session | null }> = ({
  Component,
  pageProps: { session, ...pageProps },
}: AppPropsWithLayout) => {
  const getLayout = Component.getLayout ?? ((page) => <Layout>{page}</Layout>);
  const layout = getLayout(<Component {...pageProps} />);
  return (
    <SessionProvider session={session}>
      <Title
        pageProps={pageProps}
        fallback="Blindparty"
        title={Component.title}
      />
      {Component.auth ? <Auth auth={Component.auth}>{layout}</Auth> : layout}
      <FaviconLoader />
    </SessionProvider>
  );
};

export default api.withTRPC(MyApp);
