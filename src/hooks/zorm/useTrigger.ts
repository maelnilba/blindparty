import { useEffect, useRef } from "react";

export function useTrigger(
  zorm: {
    refObject: React.MutableRefObject<HTMLFormElement | undefined>;
  },
  name: string
) {
  const el = useRef<Element | null>(null);
  const dispatch = () => {
    if (!el) return;
    setTimeout(() => {
      const event = new Event("change", { bubbles: true });
      el.current!.dispatchEvent(event);
    }, 0);
  };

  useEffect(() => {
    if (zorm.refObject.current) {
      const element = zorm.refObject.current.elements.namedItem(name);
      if (element && element instanceof Element) el.current = element;
    }
  }, [zorm, name]);

  return dispatch;
}
