import { DependencyList, useEffect, useState } from "react";

export function useEffectValue<TEffect extends (...args: any) => any>(
  effect: TEffect,
  deps: DependencyList = [],
  initialValue: ReturnType<TEffect>
): ReturnType<TEffect> {
  const [state, setState] = useState<ReturnType<TEffect>>(initialValue);

  useEffect(() => {
    setState(effect());
  }, deps);
  return state;
}
