import { useEffect } from "react";

export function useDebug<T>(value: T, name: string = "debug") {
  useEffect(() => {
    (window as any)[name] = value;
  }, [value]);
}
