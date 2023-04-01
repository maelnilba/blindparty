import { useEffect, useState } from "react";

export function useClient() {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(typeof window !== "undefined");
  }, []);

  return isClient;
}
