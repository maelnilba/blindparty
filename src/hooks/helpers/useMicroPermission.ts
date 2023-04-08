import { useEffect, useRef, useState } from "react";

export function useMicroPermission() {
  const [permission, setPermission] = useState<
    PermissionState | null | undefined
  >(null);
  const query = useRef<PermissionStatus | null>(null);

  function callback(...args: any) {
    setPermission(query.current?.state);
  }

  useEffect(() => {
    const as = async () => {
      try {
        const q = await window.navigator.permissions.query({
          name: "microphone" as any,
        });
        query.current = q;
        setPermission(q.state);
        query.current.addEventListener("change", callback);
      } catch (error) {
        setPermission("prompt");
        navigator.mediaDevices
          .getUserMedia({ audio: true })
          .then(() => {
            setPermission("granted");
          })
          .catch(() => {
            setPermission("denied");
          });
      }
    };

    as();
    return () => {
      query.current?.removeEventListener("change", callback);
    };
  }, []);

  return permission;
}
