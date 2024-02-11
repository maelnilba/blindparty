import { getProviders } from "next-auth/react";

export function getNextAuthProviders() {
  return getProviders().then((providers) => {
    if (providers)
      return Object.values(providers).filter((p) => p.name !== "anonymous");
    else return [];
  });
}
