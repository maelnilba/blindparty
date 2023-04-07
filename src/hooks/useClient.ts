import { noop } from "@lib/helpers/noop";
import { useEffect, useState, useSyncExternalStore } from "react";

// export function useClient() {
//   const [isClient, setIsClient] = useState(false);
//   useEffect(() => {
//     setIsClient(typeof window !== "undefined");
//   }, []);

//   return isClient;
// }

export const useClient = () =>
  useSyncExternalStore(
    () => noop,
    () => true,
    () => false
  );
