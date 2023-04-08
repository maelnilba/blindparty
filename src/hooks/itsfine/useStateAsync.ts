import { useEffect, useRef, useState } from "react";

/**
 * Hacky react things, should use better composition rather than need render to call a function
 */
export function useStatePromise<T>(initialValue: T) {
  const [state, setState] = useState<T>(initialValue);
  const then = useRef<(value: T) => void>();
  useEffect(() => {
    if (then.current) {
      then.current(state);
      then.current = undefined;
    }
    return () => {
      then.current = undefined;
    };
  }, [state]);
  const setter = (value: T) => {
    setState(value);
    return {
      then: (cb: (value: T) => void) => {
        then.current = cb;
      },
    };
  };
  return [state, setter] as const;
}
