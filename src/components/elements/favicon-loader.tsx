import { useIsFetching, useIsMutating, useQuery } from "@tanstack/react-query";
import { sleep } from "lib/helpers/sleep";
import { memo, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export const FaviconLoader = memo(() => {
  const ref = useRef<HTMLElement>();
  const [mount, setMount] = useState(false);

  useEffect(() => {
    ref.current = document.body;
    setMount(true);
  }, []);

  return mount ? createPortal(<FaviconLoaderPortal />, ref.current!) : null;
});

export const FaviconLoaderPortal = () => {
  useFaviconLoader((frame) => `/favicon_${frame}.ico`);
  // const test = useQuery([""], async () => {
  //   await sleep(2000);
  //   return true;
  // });
  return <div></div>;
};

const fps = 30;
type FaviconLoaderOptions = {
  FPS?: number;
  wait?: number;
  icon?: string;
};

function useFaviconLoader(
  favicons: (frame: number) => void,
  options?: FaviconLoaderOptions
): void;
function useFaviconLoader(
  favicons: string[],
  options?: FaviconLoaderOptions
): void;
function useFaviconLoader(
  favicons: string[] | ((frame: number) => void),
  options?: FaviconLoaderOptions
): void {
  const isFetching = useIsFetching();
  const isMutating = useIsMutating();

  const loadingsTimeout = useRef<NodeJS.Timeout[]>([]);
  const frameId = useRef<number>();

  const waitTimeout = useRef<NodeJS.Timeout | undefined>();
  const backTimeout = useRef<NodeJS.Timeout | undefined>();

  const loading = (frame: number) => {
    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement("link");
      (link as any).rel = "shortcut icon";
      document.head.appendChild(link);
    }
    (link as any).href =
      favicons instanceof Function ? favicons(frame) : favicons[frame];
    frame++;
    frame = frame % (options?.FPS ?? fps);
    loadingsTimeout.current.push(
      setTimeout(() => {
        frameId.current = window.requestAnimationFrame(() => loading(frame));
      }, 1000 / (options?.FPS ?? fps))
    );
  };

  const back = () => {
    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement("link");
      (link as any).rel = "shortcut icon";
      document.head.appendChild(link);
    }
    (link as any).href = options?.icon ?? "/favicon.ico";
  };

  useEffect(() => {
    if (!isFetching && !isMutating) {
      loadingsTimeout.current &&
        loadingsTimeout.current.forEach((t) => clearTimeout(t));
      frameId.current && window.cancelAnimationFrame(frameId.current);
      waitTimeout.current && clearTimeout(waitTimeout.current);
      backTimeout.current = setTimeout(() => back(), options?.wait ?? 100);
      return () => {
        loadingsTimeout.current &&
          loadingsTimeout.current.forEach((t) => clearTimeout(t));
        frameId.current && window.cancelAnimationFrame(frameId.current);
        waitTimeout.current && clearTimeout(waitTimeout.current);
        backTimeout.current = setTimeout(() => back(), options?.wait ?? 100);
      };
    }

    waitTimeout.current = setTimeout(() => {
      backTimeout.current && clearTimeout(backTimeout.current);
      loading(0);
    }, options?.wait ?? 700);

    return () => {
      waitTimeout.current && clearTimeout(waitTimeout.current);
    };
  }, [isFetching, isMutating]);
}
