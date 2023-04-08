import { useEffect, useRef, useState } from "react";

/**
 * Hacky react things, should use better composition rather than need render to call a function
 */
export function useStateAsync<T>(initialValue: T) {
  const [state, setState] = useState<T>(initialValue);
  const resolver = useRef<(value: T) => void>();
  useEffect(() => {
    if (resolver.current) {
      resolver.current(state);
      resolver.current = undefined;
    }
    return () => {
      resolver.current = undefined;
    };
  }, [state]);

  return [
    state,
    (value: T) =>
      new Promise<T>((resolve) => {
        resolver.current = resolve;
        setState(value);
      }),
  ] as const;
}
