import { useRef, useEffect, RefObject, MutableRefObject } from "react";

export function useClickOutside<T extends HTMLElement>(
  cb: Function
): [MutableRefObject<T | null>, () => void, () => void] {
  const ref = useRef<T | null>(null);
  function handleClickOutside(event: MouseEvent) {
    if (ref.current && !ref.current.contains(event.target as any)) {
      cb();
    }
  }
  useEffect(() => {
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [ref]);

  const cleanup = () =>
    document.removeEventListener("mousedown", handleClickOutside);

  const subscribe = () =>
    document.addEventListener("mousedown", handleClickOutside);

  return [ref, subscribe, cleanup];
}
