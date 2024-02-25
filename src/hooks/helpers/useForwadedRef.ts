import { ForwardedRef, MutableRefObject } from "react";

type ForwardedRefType<T> = T extends (instance: infer I | null) => void
  ? I
  : T extends MutableRefObject<infer R | null>
  ? R
  : null;
export function useForwardedRef<T extends ForwardedRef<any>>(
  ref: T
): MutableRefObject<ForwardedRefType<T>> {
  if (ref instanceof Function || ref === null)
    throw new Error("Allow only MutableRefObject for forwadRef");
  return ref;
}
