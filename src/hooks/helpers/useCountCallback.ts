import { useEffect, useRef } from "react";

type CountCallback = {
  at: number;
  /**
   * The timer to reset in milliseconds
   */
  reset?: number;
};
export function useCountCallback<TFunc extends (...args: any) => any>(
  options: CountCallback,
  func: TFunc,
  callback: (...args: Parameters<TFunc>) => any,
  deps: any[] = []
): TFunc {
  const count = useRef(0);
  const timeout = useRef<NodeJS.Timeout>();
  const reset = () => {
    count.current = 0;
  };

  const handler = (...args: any) => {
    if (timeout.current) {
      clearTimeout(timeout.current);
      timeout.current = undefined;
    } else if (!timeout.current && options.reset)
      timeout.current = setTimeout(reset, options.reset);

    count.current = count.current + 1;
    if (count.current >= options.at) {
      if (timeout.current) {
        clearTimeout(timeout.current);
        timeout.current = undefined;
      }
      reset();
      return callback(...args);
    } else {
      return func(...args);
    }
  };

  useEffect(() => {
    reset();
    return () => {
      if (timeout.current) {
        clearTimeout(timeout.current);
        timeout.current = undefined;
      }
    };
  }, deps);

  return handler as any;
}
