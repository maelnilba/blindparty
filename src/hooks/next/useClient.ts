import { noop } from "@lib/helpers/noop";
import { useSyncExternalStore } from "react";

export const useClient = () =>
  useSyncExternalStore(
    () => noop,
    () => true,
    () => false
  );
