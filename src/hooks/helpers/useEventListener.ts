import { useEffect } from "react";

import { RefObject, useState } from "react";

export function useEventListenerValue<
  TRef extends RefObject<HTMLElement>,
  TEvent extends keyof HTMLElementEventMap,
  TListener extends (ev: HTMLElementEventMap[TEvent]) => any,
  TInitial extends ReturnType<TListener>
>(
  ref: TRef,
  event: TEvent,
  callback: TListener,
  initialValue?: TInitial
): TInitial extends never
  ? ReturnType<TListener> | undefined
  : ReturnType<TListener> {
  const [state, setState] = useState<ReturnType<TListener> | undefined>(
    initialValue
  );

  useEffect(() => {
    const listener = (ev: HTMLElementEventMap[TEvent]) => {
      setState(callback(ev));
    };
    ref.current?.addEventListener(event, listener);
    return () => {
      ref.current?.removeEventListener(event, listener);
    };
  }, [ref]);

  // @ts-ignore
  return state;
}

export function useEventListener<
  TRef extends RefObject<HTMLElement>,
  TEvent extends keyof HTMLElementEventMap,
  TListener extends (ev: HTMLElementEventMap[TEvent]) => any
>(ref: TRef, event: TEvent, callback: TListener) {
  useEffect(() => {
    ref.current?.addEventListener(event, callback);
    return () => {
      ref.current?.removeEventListener(event, callback);
    };
  }, [ref]);
}
