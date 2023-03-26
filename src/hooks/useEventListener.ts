import { MutableRefObject, useEffect, useRef } from "react";

export function useEventListener<T extends HTMLElement>(
  event: keyof HTMLElementEventMap,
  cb: (
    ref: MutableRefObject<T>,
    event: HTMLElementEventMap[keyof HTMLElementEventMap]
  ) => void
): [MutableRefObject<T | null>, () => void, () => void] {
  const ref = useRef<T | null>(null);
  function handleEventListener(
    event: HTMLElementEventMap[keyof HTMLElementEventMap]
  ) {
    if (ref.current) {
      cb(ref as any, event);
    }
  }
  useEffect(() => {
    return () => {
      ref.current?.removeEventListener(event, handleEventListener);
    };
  }, [ref]);

  const cleanup = () =>
    ref.current?.removeEventListener(event, handleEventListener);

  const subscribe = () =>
    ref.current?.addEventListener(event, handleEventListener);

  return [ref, subscribe, cleanup];
}
