import { useEffect, useState } from "react";

export function useWindowLocation() {
  const [location, setLocation] = useState<Location | null>(null);
  useEffect(() => {
    if (typeof window !== "undefined") {
      setLocation(window.location);
    }
  }, []);
  return location;
}
