import { useRouter } from "next/router";
import {
  ComponentProps,
  ReactNode,
  createContext,
  useContext,
  useMemo,
  useState,
} from "react";

type Wouquest = {
  query: Record<string, string>;
};
type WouterConfig = { [path: `/${string}`]: (req: Wouquest) => ReactNode };
type WouterPage = (req: Wouquest) => ReactNode;

const Context = createContext<{
  navigate: (path: string) => void;
}>({ navigate(path) {} });

export function createWouter(wouter: WouterConfig) {
  const router = useRouter();

  const [url, setUrl] = useState<string>("");
  const [pattern, setPattern] = useState<keyof typeof wouter>(
    Object.keys(wouter).at(0)! as keyof typeof wouter
  );

  const navigate = (path: string) => {
    const woute = findPathValue(wouter, path);
    if (!woute) throw new Error("Route not find for " + path);

    setUrl(path);
    setPattern(woute.path as keyof typeof wouter);

    router.replace(router.pathname, router.pathname + path);
  };

  const active = useMemo(() => {
    const component = findPathValue<WouterPage>(wouter, url);
    if (component) return component.value;
  }, [url]);

  return (
    <Context.Provider value={{ navigate }}>
      {active && active({ query: parsePath(url, pattern) })}
    </Context.Provider>
  );
}

function findPathValue<T = any>(
  paths: { [key: string]: any },
  targetPath: string
): { path: string; value: T } | undefined {
  const segments = targetPath.split("/");
  if (segments[0] === "") segments.shift();
  if (segments[segments.length - 1] === "") segments.pop();

  for (const path in paths) {
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
        return { path: path, value: paths[path] };
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

export function useWouter() {
  const context = useContext(Context);

  if (context === undefined) {
    throw new Error(`useWouter must be used within a wouter.`);
  }
  return context;
}

export function Wink({
  children,
  href,
  onClick,
  ...props
}: ComponentProps<"a"> & { href: string }) {
  const wouter = useWouter();
  return (
    <a
      onClick={(e) => {
        wouter.navigate(href);
        onClick && onClick(e);
      }}
      {...props}
    >
      {children}
    </a>
  );
}
