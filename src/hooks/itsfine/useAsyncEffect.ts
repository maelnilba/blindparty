import { DependencyList, EffectCallback, useEffect } from "react";

type ExtractDestructor<T extends EffectCallback> = T extends EffectCallback
  ? Exclude<ReturnType<T>, void>
  : never;

/**
 * Hacky react things, should just write function in useEffect then calling it
 */
export function useAsyncEffect(
  effect: () => Promise<void | ExtractDestructor<EffectCallback>>,
  deps?: DependencyList
): void {
  useEffect(() => {
    let returned: Function;
    effect().then((r) => {
      returned = r as any;
    });
    return () => {
      returned instanceof Function && returned();
    };
  }, deps);
}
