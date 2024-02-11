import { signIn, useSession } from "next-auth/react";
import { useEffect, type ReactNode } from "react";

export default function AnonSessionProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { status } = useSession();
  useEffect(() => {
    if (status === "unauthenticated") {
      // login as anonymous
      signIn("credentials", {})
        .then(async () => {
          // Hack for reload the next-auth session
          const event = new Event("visibilitychange");
          document.dispatchEvent(event);
          /* do nothing */
          console.info("Logged in as anonymous");
        })
        .catch((error) => {
          console.error("Failed to login as anonymous", error);
        });
    }
  }, [status]);
  return <>{children}</>;
}
