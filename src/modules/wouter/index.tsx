import { getQueries } from "helpers/query-validator";
import { useRouter } from "next/router";
import ErrorPage from "next/error";
import {
  Children,
  ComponentProps,
  ReactNode,
  createContext,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type Url = string;
interface TransitionOptions {
  shallow?: boolean;
  locale?: string | false;
  scroll?: boolean;
  unstable_skipClientCache?: boolean;
}
interface ParsedUrlQuery {
  [x: string]: string | string[];
}

type Router = {
  asPath: string;
  pathname: string;
  query: ParsedUrlQuery;
  route: string;
};
const Context = createContext<
  {
    push: (url: Url, options?: TransitionOptions) => Promise<boolean>;
    replace: (url: Url, options?: TransitionOptions) => Promise<boolean>;
  } & Router
>({
  async push(url, options) {
    return true;
  },
  async replace(url, options) {
    return true;
  },
  asPath: "",
  pathname: "",
  query: {},
  route: "",
});

export const Wouter = () => {};

type RoutersProps = {
  children: ReactNode;
  baseUrl?: string;
};
Wouter.Routes = ({ children, baseUrl }: RoutersProps) => {
  const next = useRouter();

  const [router, setRouter] = useState<Router>({
    asPath: "",
    pathname: "",
    route: "",
    query: {},
  });

  const [notFound, setNotFound] = useState(false);

  const patterns = useMemo(() => {
    return Children.map(children, (child) =>
      isValidElement(child) && child.type === Wouter.Route
        ? child.props.pattern
        : null
    )!.filter(Boolean);
  }, [children]);

  const onRouteChange = useCallback(
    (urlEvent: string) => {
      const base = baseUrl
        ? baseUrl.endsWith("/")
          ? baseUrl.slice(0, -1)
          : baseUrl
        : next.pathname
            .replace(/\/\[\[.*?\]\]/g, "")
            .split("/")
            .map((_, i) => next.asPath.split("/").at(i))
            .join("/");
      const url = [
        "",
        urlEvent.split("/").slice(base.split("/").length).join("/"),
      ].join("/");

      const pattern = findPattern(patterns, url);
      if (!pattern) return setNotFound(true);
      else setNotFound(false);

      const u = new URL(url, window.origin);
      setRouter((r) => ({
        ...r,
        asPath: u.pathname + u.search,
        route: pattern,
        pathname: u.pathname,
        query: getQuery(u, pattern),
      }));
    },
    [next, baseUrl, patterns]
  );

  useEffect(() => {
    onRouteChange(window.location.pathname);
  }, [onRouteChange]);

  useEffect(() => {
    next.events.on("routeChangeComplete", onRouteChange);
    return () => {
      next.events.off("routeChangeComplete", onRouteChange);
    };
  }, [next, onRouteChange]);

  async function navigate(
    push: boolean,
    url: Url,
    options?: TransitionOptions
  ) {
    const pattern = findPattern(patterns, url);
    if (!pattern) {
      setNotFound(true);
      return false;
    } else setNotFound(false);
    const base = baseUrl
      ? baseUrl.endsWith("/")
        ? baseUrl.slice(0, -1)
        : baseUrl
      : next.pathname
          .replace(/\/\[\[.*?\]\]/g, "")
          .split("/")
          .map((_, i) => next.asPath.split("/").at(i))
          .join("/");

    if (push) return next.push(next.pathname, base + url, options);
    else return next.replace(next.pathname, base + url, options);
  }

  async function push(url: Url, options?: TransitionOptions) {
    return navigate(true, url, options);
  }

  async function replace(url: Url, options?: TransitionOptions) {
    return navigate(false, url, options);
  }

  return (
    <Context.Provider value={{ push, replace, ...router }}>
      {!notFound ? (
        <>
          {Children.map(children, (child) => {
            if (
              isValidElement(child) &&
              child.type === Wouter.Route &&
              child.props.pattern === router.route
            )
              return child;
            return null;
          })!.filter(Boolean)}
        </>
      ) : (
        <ErrorPage statusCode={404} />
      )}
    </Context.Provider>
  );
};

type RouteProps = {
  children: ReactNode;
  pattern: string;
};
Wouter.Route = ({ children }: RouteProps) => {
  return <>{children}</>;
};

export function useWouter() {
  const context = useContext(Context);

  if (context === undefined) {
    throw new Error(`useWouter must be used within a Wouter.Root.`);
  }
  return context;
}

Wouter.Link = ({
  children,
  href,
  onClick,
  replace,
  ...props
}: ComponentProps<"a"> & { href: string; replace?: boolean }) => {
  const wouter = useWouter();
  return (
    <a
      onClick={(e) => {
        if (replace) wouter.replace(href);
        else wouter.push(href);
        if (onClick) onClick(e);
      }}
      {...props}
    >
      {children}
    </a>
  );
};

function findPattern(paths: string[], targetPath: string): string | undefined {
  const segments = targetPath.split("/");
  if (segments[0] === "") segments.shift();
  if (segments[segments.length - 1] === "") segments.pop();

  for (const path of paths) {
    const pathSegments = path.split("/").filter((segment) => segment !== "");

    if (segments.length === pathSegments.length) {
      let match = true;

      for (let i = 0; i < segments.length; i++) {
        if (
          segments[i] !== pathSegments[i] &&
          !pathSegments[i]!.startsWith(":")
        ) {
          match = false;
          break;
        } else if (pathSegments[i]!.startsWith(":") && segments[i] === "") {
          match = false;
          break;
        }
      }

      if (match) {
        return path;
      }
    }
  }
  return undefined;
}

function parsePath(path: string, pattern: string): Record<string, string> {
  const pathParts: string[] = path.split("/");
  const patternParts: string[] = pattern.split("/");
  const params: Record<string, string> = {};

  for (let i = 0; i < patternParts.length; i++) {
    const part = patternParts[i];
    if (part!.startsWith(":")) {
      const paramName = part!.slice(1);
      params[paramName] = pathParts[i]!;
    }
  }

  return params;
}

function getQuery(url: URL, pattern: string) {
  const obj1 = parsePath(url.pathname, pattern);
  const obj2 = getQueries(url.searchParams);

  return [...Object.entries(obj1), ...Object.entries(obj2)].reduce(
    (acc, [key, value]) => {
      acc[key] = acc.hasOwnProperty(key)
        ? Array.isArray(acc[key])
          ? [...acc[key]!, value]
          : [acc[key], value]
        : value;
      return acc;
    },
    {} as { [x: string]: string | string[] }
  );
}
