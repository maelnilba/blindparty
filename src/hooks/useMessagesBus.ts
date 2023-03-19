import { useEffect, useRef, useState } from "react";
import { z, ZodSchema } from "zod";

const getBaseUrl = () => {
  if (typeof window !== "undefined") return window.origin; // browser should use relative url
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`; // SSR should use vercel url
  return `http://localhost:${process.env.PORT ?? 3000}`; // dev SSR should use localhost
};

export function useMessagesBus<
  TMessages extends { [event: string]: ZodSchema }
>(
  messages: TMessages,
  opts?: {
    bc?: string;
  }
) {
  const bc = useRef<BroadcastChannel | null>();
  const [subscription, setSubscription] = useState<
    Map<
      keyof TMessages,
      (data: z.infer<TMessages[keyof TMessages]>) => void | Promise<void>
    >
  >(new Map());

  function message<TMessage extends keyof TMessages>(
    event: TMessage,
    data: z.infer<TMessages[TMessage]>
  ) {
    if (typeof window === "undefined" || !bc.current) return;
    bc.current.postMessage({ event, data });
  }

  function subscribe<TMessage extends keyof TMessages>(
    event: TMessage,
    callback: (data: z.infer<TMessages[TMessage]>) => void | Promise<void>
  ) {
    if (typeof window === "undefined") return;
    if (typeof event !== "string") return;
    const s = subscription.set(event, callback);
    setSubscription(new Map(s));
  }

  function unsubscribe<TMessage extends keyof TMessages>(event: TMessage) {
    subscription.delete(event);
    setSubscription(new Map(subscription));
  }

  useEffect(() => {
    bc.current = new BroadcastChannel(opts?.bc ?? "across");
    const listener = (
      e: MessageEvent<{ event: keyof TMessages; data: unknown }>
    ) => {
      if (e.origin !== getBaseUrl()) return;
      if (!subscription.has(e.data.event)) return;
      const sub = subscription.get(e.data.event)!;
      const schema = messages[e.data.event];
      if (!schema) return;
      const data = schema.parse(e.data.data);
      sub(data);
    };
    bc.current.addEventListener("message", listener);
    return () => {
      if (!bc.current) return;
      bc.current.removeEventListener("message", listener);
    };
  }, [subscription]);

  return { message, subscribe, unsubscribe };
}
