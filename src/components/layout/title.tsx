import { NextPageWithTitle } from "next";
import Head from "next/head";
import { useEffect, useRef } from "react";

type TitleProps = {
  fallback: string;
  pageProps: any;
  title?: NextPageWithTitle<any>["title"];
};
export function Title({ fallback, pageProps, title }: TitleProps) {
  const render = title
    ? typeof title === "string"
      ? title
      : title(pageProps)
    : fallback;

  return (
    <Head>
      <title>{render}</title>
    </Head>
  );
}

type Options = {
  undoOnUnmount: boolean;
};
export function useTitle({ undoOnUnmount }: Options = { undoOnUnmount: true }) {
  const original = useRef(document.title);

  useEffect(() => {
    return () => {
      if (undoOnUnmount) document.title = original.current;
    };
  }, []);

  return {
    title: new Proxy(
      { title: document?.title },
      {
        get(target, p, receiver) {
          if (typeof document === "undefined")
            throw new Error(
              "useTitle have to be use in Client. Can't access to document."
            );

          return Reflect.get(target, p, receiver);
        },
      }
    ),
    setTitle: (title: string) => {
      if (typeof document === "undefined")
        throw new Error(
          "useTitle have to be use in Client. Can't access to document."
        );

      document.title = title;
    },
    undo: () => {
      if (typeof document === "undefined")
        throw new Error(
          "useTitle have to be use in Client. Can't access to document."
        );

      document.title = original.current;
    },
  };
}
