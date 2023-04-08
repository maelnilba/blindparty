import { useRef } from "react";

export function useEventDispatch<TElement extends HTMLElement>() {
  const ref = useRef<TElement>(null);
  const dispatch = (event: keyof HTMLElementEventMap) => {
    if (!ref.current) return;
    setTimeout(() => {
      if (!ref.current) return;
      const e = new Event(event, { bubbles: true });
      ref.current.dispatchEvent(e);
    }, 0);
  };

  return [ref, dispatch] as const;
}
